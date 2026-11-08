'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'

interface Props {
  coursId: string
  resumeInitial: string | null
}

export default function ResumeRapide({ coursId, resumeInitial }: Props) {
  const [resume, setResume] = useState<string | null>(resumeInitial)
  const [loading, setLoading] = useState(false)

  // Détecter si le résumé est du contenu brut (commence comme le cours) ou un vrai résumé
  const estBrut = !resumeInitial || resumeInitial.length < 30

  useEffect(() => {
    if (!estBrut) return // résumé déjà propre
    setLoading(true)
    fetch('/api/generate-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coursId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.resume) setResume(data.resume)
      })
      .catch(() => {}) // silencieux si erreur
      .finally(() => setLoading(false))
  }, [coursId, estBrut])

  if (!resume && !loading) return null

  return (
    <div className="bg-green-light border-l-4 border-green rounded-r-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-green" />
        <p className="text-sm font-bold text-green">Résumé rapide</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Génération du résumé...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{resume}</p>
      )}
    </div>
  )
}
