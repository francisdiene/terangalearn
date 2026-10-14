import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier que c'est un élève de terminale
  const { data: profile } = await supabase.from('profiles').select('classe').eq('id', user.id).single()
  if (profile?.classe !== 'terminale') {
    return NextResponse.json({ error: 'Module réservé aux élèves de Terminale' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('bulletin') as File | null
  if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })

  const isImage = file.type.startsWith('image/')
  const isPDF = file.type === 'application/pdf'

  if (!isImage && !isPDF) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez PDF, JPG ou PNG.' }, { status: 400 })
  }

  let contenuBulletin = ''

  if (isPDF) {
    // Extraire texte du PDF
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      contenuBulletin = data.text
    } catch {
      return NextResponse.json({ error: 'Impossible de lire le PDF. Essayez une image.' }, { status: 400 })
    }

    if (!contenuBulletin.trim()) {
      return NextResponse.json({ error: 'Le PDF semble scanné. Uploadez une image à la place.' }, { status: 400 })
    }
  }

  // Construire le message pour Groq
  let messages: any[]

  if (isImage) {
    // Groq vision — envoyer l'image directement
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    const mimeType = file.type
    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` }
          },
          {
            type: 'text',
            text: PROMPT_ANALYSE
          }
        ]
      }
    ]
  } else {
    // PDF texte extrait
    messages = [
      {
        role: 'user',
        content: `Voici le contenu extrait du bulletin scolaire :\n\n${contenuBulletin}\n\n${PROMPT_ANALYSE}`
      }
    ]
  }

  const model = isImage ? 'qwen/qwen3.8-27b' : 'openai/gpt-oss-120b'

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Groq error:', err)
    let errMsg = 'Erreur lors de l\'analyse IA'
    try {
      const parsed = JSON.parse(err)
      errMsg = parsed?.error?.message ?? errMsg
    } catch {}
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content

  if (!content) {
    return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
  }

  try {
    const analyse = JSON.parse(content)
    return NextResponse.json({ success: true, analyse })
  } catch {
    console.error('Parse error, raw content:', content?.slice(0, 200))
    return NextResponse.json({ error: 'Erreur de parsing de la réponse IA' }, { status: 500 })
  }
}

const PROMPT_ANALYSE = `Tu es un conseiller d'orientation scolaire expert pour le système éducatif sénégalais.
Analyse ce bulletin scolaire de terminale et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans texte autour) avec cette structure exacte :

{
  "eleve": {
    "nom": "nom si visible, sinon null",
    "classe": "classe si visible, sinon null",
    "etablissement": "établissement si visible, sinon null"
  },
  "moyennes": {
    "generale": 0.0,
    "semestre": "S1 ou S2 ou Annuelle",
    "matieres": [
      { "matiere": "Mathématiques", "moyenne": 0.0, "coefficient": 4 },
      { "matiere": "Physique-Chimie", "moyenne": 0.0, "coefficient": 3 }
    ]
  },
  "analyse": {
    "points_forts": ["matière 1", "matière 2"],
    "points_faibles": ["matière 1"],
    "appreciation_globale": "Appréciation en 2-3 phrases"
  },
  "orientation": {
    "serie_recommandee": "S1",
    "serie_explication": "Pourquoi cette série est adaptée",
    "series_alternatives": ["S2", "L"],
    "filieres_universitaires": [
      { "filiere": "Médecine", "adequation": 85, "etablissements": ["UCAD", "UGB"] },
      { "filiere": "Informatique", "adequation": 90, "etablissements": ["ESP", "UCAD"] }
    ],
    "metiers": [
      { "metier": "Ingénieur informatique", "description": "Courte description" },
      { "metier": "Médecin", "description": "Courte description" }
    ]
  },
  "conseils": [
    "Conseil personnalisé 1",
    "Conseil personnalisé 2",
    "Conseil personnalisé 3"
  ]
}

Les séries possibles au Sénégal : S1 (Maths/Physique), S2 (Maths/Sciences Vie), L (Lettres/Philosophie), G (Gestion/Economie), STEG (Sciences Techno Economie Gestion).
Adapte tes recommandations au contexte sénégalais (UCAD, UGB, ESP, ISE, FASEG, FLSH, etc.).
Si le bulletin n'est pas lisible ou incomplet, retourne quand même le JSON avec les champs disponibles et "non lisible" pour les autres.`
