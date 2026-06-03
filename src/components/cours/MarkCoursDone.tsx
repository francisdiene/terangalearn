'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Clock } from 'lucide-react'

export default function MarkCoursDone({
  coursId,
  userId,
  dejaFait,
  nombreMots = 300
}: {
  coursId: string
  userId: string
  dejaFait: boolean
  nombreMots?: number
}) {
  // Temps minimum = 1 seconde par 50 mots, minimum 30s, maximum 5 min
  const tempsMinimum = Math.min(2000, Math.max(600, Math.floor(nombreMots / 30)))

  const [done, setDone] = useState(dejaFait)
  const [loading, setLoading] = useState(false)
  const [tempsRestant, setTempsRestant] = useState(dejaFait ? 0 : tempsMinimum)
  const [pret, setPret] = useState(dejaFait)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (dejaFait) return
    if (tempsRestant <= 0) {
      setPret(true)
      return
    }

    const timer = setInterval(() => {
      setTempsRestant(t => {
        if (t <= 1) {
          clearInterval(timer)
          setPret(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [dejaFait])

  const handleMark = async () => {
    if (!pret || done) return
    setLoading(true)

    await supabase
      .from('progression_cours')
      .upsert({
        user_id: userId,
        cours_id: coursId,
        termine: true,
        progression_pct: 100,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,cours_id' })

    await supabase.rpc('increment_xp', { user_id: userId, points: 30 })

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  const formatTemps = (secondes: number) => {
    const m = Math.floor(secondes / 60)
    const s = secondes % 60
    if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
    return `${s}s`
  }

  const pct = Math.round((1 - tempsRestant / tempsMinimum) * 100)

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green font-semibold text-sm">
        <CheckCircle className="w-5 h-5" />
        Cours terminé !
      </div>
    )
  }

  if (!pret) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4 text-orange-400" />
          <span>Lisez encore <strong className="text-orange-500">{formatTemps(tempsRestant)}</strong></span>
        </div>
        {/* Barre de progression */}
        <div className="w-32 bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-green h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          disabled
          className="flex items-center gap-2 bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          Marquer comme terminé
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
        : <><CheckCircle className="w-4 h-4" /> Marquer comme terminé</>
      }
    </button>
  )
}