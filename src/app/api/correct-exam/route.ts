import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const { questions, reponses } = await req.json()

    const corrections: Record<string, any> = {}
    let totalPoints = 0
    let maxPoints = 0

    for (const [matiere, data] of Object.entries(questions) as any) {
      const reponsesMatiere = reponses[matiere] ?? {}
      const coeff = data.coefficient ?? 2
      let pointsMatiere = 0
      let maxPointsMatiere = 0
      const detailsQCM: any[] = []

      // Corriger QCM
      for (const qcm of data.qcm ?? []) {
        const reponseEleve = reponsesMatiere[`qcm_${qcm.id}`]
        const correct = reponseEleve === qcm.reponse_correcte
        const points = correct ? 2 : 0
        pointsMatiere += points
        maxPointsMatiere += 2
        detailsQCM.push({
          id: qcm.id,
          question: qcm.question,
          reponse_eleve: reponseEleve,
          reponse_correcte: qcm.reponse_correcte,
          correct,
          points,
          explication: qcm.explication
        })
      }

      // Corriger question ouverte par IA
      let correctionQO = null
      if (data.question_ouverte) {
        const reponseQO = reponsesMatiere['question_ouverte'] ?? ''
        const maxPts = data.question_ouverte.points ?? 8

        const prompt = `Tu es un correcteur sénégalais expert.
Question : "${data.question_ouverte.question}"
Réponse modèle : "${data.question_ouverte.reponse_modele}"
Réponse de l'élève : "${reponseQO}"

Évalue la réponse sur ${maxPts} points et réponds UNIQUEMENT en JSON :
{
  "points_obtenus": X,
  "points_max": ${maxPts},
  "appreciation": "Bien/Moyen/Insuffisant",
  "commentaire": "Commentaire constructif en 2 phrases"
}`

        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 512,
            temperature: 0.3,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        const dataResp = await response.json()
        const text = dataResp.choices[0]?.message?.content ?? '{}'
        const clean = text.replace(/```json|```/g, '').trim()

        try {
          correctionQO = JSON.parse(clean)
          pointsMatiere += correctionQO.points_obtenus ?? 0
          maxPointsMatiere += maxPts
        } catch {
          correctionQO = { points_obtenus: 0, points_max: maxPts, appreciation: 'Non évalué', commentaire: '' }
          maxPointsMatiere += maxPts
        }
      }

      const noteMatiere = maxPointsMatiere > 0
        ? Math.round((pointsMatiere / maxPointsMatiere) * 20 * 100) / 100
        : 0

      corrections[matiere] = {
        nom: data.nom,
        coefficient: coeff,
        note: noteMatiere,
        points: pointsMatiere,
        max_points: maxPointsMatiere,
        qcm: detailsQCM,
        question_ouverte: correctionQO
      }

      totalPoints += noteMatiere * coeff
      maxPoints += 20 * coeff
    }

    const notefinale = maxPoints > 0
      ? Math.round((totalPoints / maxPoints) * 20 * 100) / 100
      : 0

    return NextResponse.json({ corrections, note_finale: notefinale })

  } catch (error) {
    console.error('Correct exam error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}