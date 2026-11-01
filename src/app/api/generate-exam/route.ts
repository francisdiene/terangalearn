import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

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

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2048,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        console.error(`Groq error ${response.status} for ${matiere}:`, errBody)
        questionsParMatiere[matiere] = { matiere, nom: MATIERE_NOMS[matiere], coefficient: coeff, qcm: [], question_ouverte: null }
        continue
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content ?? '{}'
      const clean = text.replace(/```json|```/g, '').trim()

      try {
        questionsParMatiere[matiere] = JSON.parse(clean)
      } catch {
        questionsParMatiere[matiere] = { matiere, nom: MATIERE_NOMS[matiere], coefficient: coeff, qcm: [], question_ouverte: null }
      }
    }

    return NextResponse.json({ questions: questionsParMatiere })

  } catch (error) {
    console.error('Generate exam error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
