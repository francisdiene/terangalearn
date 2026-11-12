import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.OPENROUTER_API_KEY
  ? 'https://openrouter.ai/api/v1/chat/completions'
  : 'https://api.groq.com/openai/v1/chat/completions'

const MODELS = process.env.OPENROUTER_API_KEY
  ? ['meta-llama/llama-3.1-8b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free']
  : ['openai/gpt-oss-120b']

const API_KEY = () => process.env.OPENROUTER_API_KEY ?? process.env.GROQ_API_KEY ?? ''

const COEFFICIENTS: Record<string, Record<string, number>> = {
  S1: { MATH: 5, PC: 4, SVT: 4, FR: 2, HG: 2, EN: 2, PHILO: 2 },
  S2: { MATH: 5, PC: 4, SVT: 4, FR: 2, HG: 2, EN: 2, PHILO: 2 },
  L:  { FR: 4, PHILO: 3, HG: 3, EN: 3, MATH: 2, PC: 1 },
  G:  { MATH: 4, ECO: 4, FR: 3, HG: 2, EN: 2, PHILO: 2 },
  STEG: { MATH: 4, ECO: 4, FR: 3, HG: 2, EN: 2, PHILO: 2 },
}

const MATIERE_NOMS: Record<string, string> = {
  MATH: 'Mathématiques', PC: 'Physique-Chimie', SVT: 'SVT',
  FR: 'Français', HG: 'Histoire-Géographie', EN: 'Anglais',
  PHILO: 'Philosophie', ECO: 'Économie'
}

export async function POST(req: NextRequest) {
  try {
    const { serie, matieres } = await req.json()

    // ── Vérification quota Examens simulés (côté serveur) ───────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()

    const plan = profile?.plan ?? 'free'
    const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null
    const isActivePremium = (plan === 'premium' || plan === 'school') && (expiresAt ? expiresAt > new Date() : false)

    if (!isActivePremium) {
      // Vérifier le quota hebdomadaire (2 examens/semaine pour free)
      const monday = new Date()
      monday.setDate(monday.getDate() - monday.getDay() + 1)
      monday.setHours(0, 0, 0, 0)

      const { count: examsThisWeek } = await supabase
        .from('examens_simules')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monday.toISOString())

      if ((examsThisWeek ?? 0) >= 2) {
        return NextResponse.json(
          { error: 'quota_exceeded', message: 'Tu as atteint ta limite de 2 examens simulés par semaine. Passe à Premium pour des examens illimités.' },
          { status: 429 }
        )
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const questionsParMatiere: Record<string, any> = {}

    for (const matiere of matieres) {
      const coeff = COEFFICIENTS[serie]?.[matiere] ?? 2
      const nbQCM = Math.max(2, coeff)

      const prompt = `
Tu es un professeur sénégalais expert en ${MATIERE_NOMS[matiere]}
pour la classe de Terminale série ${serie}.

Génère un mini-examen en JSON STRICT avec exactement cette structure :

{
  "matiere": "${matiere}",
  "nom": "${MATIERE_NOMS[matiere]}",
  "coefficient": ${coeff},
  "qcm": [
    {
      "id": 1,
      "question": "...",
      "options": [
        "A. ...",
        "B. ...",
        "C. ...",
        "D. ..."
      ],
      "reponse_correcte": "A. ...",
      "explication": "..."
    }
  ],
  "question_ouverte": {
    "id": "qo",
    "question": "...",
    "reponse_modele": "...",
    "points": ${coeff * 4}
  }
}

CONSIGNES :

- Génère exactement ${nbQCM} QCM.
- Les questions doivent correspondre au niveau Terminale ${serie}.
- Utilise uniquement des notions pertinentes du programme scolaire
  sénégalais de ${MATIERE_NOMS[matiere]}.
- Chaque QCM doit avoir exactement 4 propositions.
- Une seule proposition doit être correcte.
- Vérifie que la réponse correcte correspond réellement à
  "reponse_correcte".
- Vérifie chaque calcul avant de générer la question.
- Les distracteurs doivent être plausibles mais clairement faux.
- L'explication doit justifier la bonne réponse.
- La question ouverte doit demander une réflexion ou une analyse.
- La réponse modèle doit contenir les éléments essentiels attendus.
- Ne crée aucune information scolaire fictive.
- N'utilise pas de HTML ou de SVG.

IMPORTANT :
RÉPONDS UNIQUEMENT AVEC UN JSON VALIDE.
Aucun texte avant ou après.
Aucun bloc Markdown.
Aucune balise.
`;

      let parsed = null
      for (const model of MODELS) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY()}`,
            ...(process.env.OPENROUTER_API_KEY ? { 'HTTP-Referer': 'https://terangalearn-sandy.vercel.app' } : {})
          },
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        if (!response.ok) {
          const errBody = await response.text()
          console.error(`Groq error ${response.status} model=${model} matiere=${matiere}:`, errBody)
          continue // essaie le modèle suivant
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        console.log(`RAW model=${model} matiere=${matiere}:`, text.slice(0, 300))

        if (!text) {
          console.error(`Empty response model=${model} matiere=${matiere}`)
          continue
        }

        // Extraction JSON robuste : cherche le premier { ... } de niveau racine
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const clean = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim()

        try {
          parsed = JSON.parse(clean)
          if (!Array.isArray(parsed.qcm) || parsed.qcm.length === 0) {
            console.error(`Empty qcm model=${model} matiere=${matiere}`)
            continue
          }
          console.log(`OK model=${model} matiere=${matiere} qcm=${parsed.qcm.length}`)
          break
        } catch (e: any) {
          console.error(`JSON parse error model=${model} matiere=${matiere}:`, e.message, clean.slice(0, 200))
          continue
        }
      }

      questionsParMatiere[matiere] = parsed ?? { matiere, nom: MATIERE_NOMS[matiere], coefficient: coeff, qcm: [], question_ouverte: null }
    }

    return NextResponse.json({ questions: questionsParMatiere })

  } catch (error) {
    console.error('Generate exam error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
