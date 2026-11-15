import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAiCall } from '@/lib/logAiCall'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'openai/gpt-oss-120b'

export async function POST(req: NextRequest) {
  try {
    const { coursTitre, coursContenu } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const t0 = Date.now()
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `Tu es un professeur sénégalais expert qui crée des exercices QCM pour les élèves de Terminale et 3ème.
Tu dois générer UN seul QCM basé sur le contenu du cours fourni.
Tu dois répondre UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec exactement cette structure :
{
  "question": "La question posée",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "reponse_correcte": "Option A",
  "explication": "Explication détaillée de la bonne réponse en 2-3 phrases"
}
Règles :
- La question doit porter sur un concept clé du cours
- Les 4 options doivent être plausibles
- Une seule option est correcte
- L'explication doit être pédagogique et claire`
          },
          {
            role: 'user',
            content: `Génère un QCM sur ce cours : "${coursTitre}"\n\nContenu du cours :\n${coursContenu.slice(0, 2000)}`
          }
        ]
      })
    })

    if (!response.ok) {
      void logAiCall({ userId: user?.id ?? null, feature: 'exercise', model: GROQ_MODEL, tokensIn: 0, tokensOut: 0, durationMs: Date.now() - t0, success: false, errorCode: 'groq_error' })
      return NextResponse.json({ error: 'Erreur API Groq' }, { status: 500 })
    }

    const data = await response.json()
    void logAiCall({ userId: user?.id ?? null, feature: 'exercise', model: GROQ_MODEL, tokensIn: data.usage?.prompt_tokens ?? 0, tokensOut: data.usage?.completion_tokens ?? 0, durationMs: Date.now() - t0, success: true })
    const text = data.choices[0]?.message?.content ?? ''

    // Parser le JSON
    const clean = text.replace(/```json|```/g, '').trim()
    const exercice = JSON.parse(clean)

    return NextResponse.json({ exercice })

  } catch (error) {
    console.error('Generate exercise error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
