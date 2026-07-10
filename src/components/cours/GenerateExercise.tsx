'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Exercice {
  question: string
  options: string[]
  reponse_correcte: string
  explication: string
}

interface Props {
  userId: string
  coursTitre: string
  coursContenu: string
}

export default function GenerateExercise({ userId, coursTitre, coursContenu }: Props) {
  const [exercice, setExercice] = useState<Exercice | null>(null)
  const [loading, setLoading] = useState(false)
  const [reponseChoisie, setReponseChoisie] = useState<string | null>(null)
  const [correction, setCorrection] = useState<'correct' | 'incorrect' | null>(null)
  const [xpGagne, setXpGagne] = useState(false)
  const supabase = createClient()

  const generer = async () => {
    setLoading(true)
    setExercice(null)
    setReponseChoisie(null)
    setCorrection(null)
    setXpGagne(false)

    try {
      const res = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coursTitre, coursContenu })
      })
      const data = await res.json()
      if (data.exercice) setExercice(data.exercice)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  const repondre = async (option: string) => {
    if (reponseChoisie || !exercice) return
    setReponseChoisie(option)

    const estCorrect = option === exercice.reponse_correcte
    setCorrection(estCorrect ? 'correct' : 'incorrect')

    if (estCorrect && !xpGagne) {
      setXpGagne(true)
      await supabase.rpc('increment_xp', { user_id: userId, points: 10 })
    }
  }

  const getOptionStyle = (option: string) => {
    if (!reponseChoisie) return 'border-gray-200 hover:border-green hover:bg-green-light cursor-pointer'
    if (option === exercice?.reponse_correcte) return 'border-green bg-green-light'
    if (option === reponseChoisie && correction === 'incorrect') return 'border-red-400 bg-red-50'
    return 'border-gray-100 opacity-60'
  }

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green" />
        <h3 className="font-bold text-gray-900">Exercice généré par IA</h3>
        {xpGagne && (
          <span className="ml-auto text-xs bg-green text-white px-2 py-0.5 rounded-full font-medium">
            +10 XP ✓
          </span>
        )}
      </div>

      {!exercice && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4">
            L'IA va générer un QCM basé sur ce cours pour tester ta compréhension.
          </p>
          <button
            onClick={generer}
            className="flex items-center gap-2 bg-green text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Générer un exercice
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-green" />
          <span className="text-sm text-gray-500">L'IA génère un exercice...</span>
        </div>
      )}

      {exercice && (
        <div className="space-y-4">
          {/* Question */}
          <p className="font-semibold text-gray-900 text-sm leading-relaxed">
            {exercice.question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {exercice.options.map((option, i) => (
              <button
                key={i}
                onClick={() => repondre(option)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left',
                  getOptionStyle(option)
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0',
                  reponseChoisie
                    ? option === exercice.reponse_correcte
                      ? 'border-green bg-green text-white'
                      : option === reponseChoisie
                        ? 'border-red-400 bg-red-400 text-white'
                        : 'border-gray-200 text-gray-400'
                    : 'border-gray-300 text-gray-500'
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-gray-700">{option}</span>
                {reponseChoisie && option === exercice.reponse_correcte && (
                  <CheckCircle2 className="w-4 h-4 text-green ml-auto flex-shrink-0" />
                )}
                {reponseChoisie && option === reponseChoisie && correction === 'incorrect' && (
                  <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Correction */}
          {reponseChoisie && (
            <div className={cn(
              'rounded-xl p-4 text-sm leading-relaxed',
              correction === 'correct' ? 'bg-green-light' : 'bg-red-50'
            )}>
              <p className={cn('font-bold mb-1', correction === 'correct' ? 'text-green' : 'text-red-600')}>
                {correction === 'correct' ? '✅ Bonne réponse !' : '❌ Mauvaise réponse'}
              </p>
              <p className={correction === 'correct' ? 'text-green/80' : 'text-red-700'}>
                {exercice.explication}
              </p>
            </div>
          )}

          {/* Bouton nouveau exercice */}
          {reponseChoisie && (
            <button
              onClick={generer}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-green text-green rounded-xl font-semibold text-sm hover:bg-green hover:text-white transition"
            >
              <RefreshCw className="w-4 h-4" />
              Nouvel exercice
            </button>
          )}
        </div>
      )}
    </div>
  )
}