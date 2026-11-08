import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b'

export async function POST(req: NextRequest) {
  try {
    const { coursId } = await req.json()
    if (!coursId) return NextResponse.json({ error: 'coursId requis' }, { status: 400 })

    const supabase = await createClient()

    // Vérif auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Récupérer le cours
    const { data: cours } = await supabase
      .from('cours')
      .select('id, titre, contenu, resume')
      .eq('id', coursId)
      .single()

    if (!cours) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })

    // Si résumé déjà généré (et pas juste le début du contenu), retourner directement
    if (cours.resume && cours.resume.length > 50 && cours.resume !== cours.contenu.slice(0, cours.resume.length)) {
      return NextResponse.json({ resume: cours.resume })
    }

    // Tronquer le contenu à 3000 chars pour le prompt
    const contenuCourt = cours.contenu.slice(0, 3000)

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant pédagogique pour lycéens sénégalais. Rédige des résumés clairs et concis en français.'
          },
          {
            role: 'user',
            content: `Fais un résumé de ce cours en 3-4 phrases maximum. Va à l'essentiel, retiens les points clés. Réponds uniquement avec le résumé, sans titre ni introduction.\n\nCours : ${cours.titre}\n\n${contenuCourt}`
          }
        ]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })
    }

    const data = await response.json()
    const resume = data.choices?.[0]?.message?.content?.trim()

    if (!resume) return NextResponse.json({ error: 'Résumé vide' }, { status: 500 })

    // Sauvegarder en base (service role pour bypasser RLS)
    const supabaseAdmin = await createClient()
    await supabaseAdmin
      .from('cours')
      .update({ resume })
      .eq('id', coursId)

    return NextResponse.json({ resume })

  } catch (err) {
    console.error('generate-resume error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
