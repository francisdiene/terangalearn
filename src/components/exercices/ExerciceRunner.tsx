'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Exercice } from '@/types'

interface Props {
  exercices: Exercice[]
  userId: string
  resultatsExistants: { exercice_id: string; est_correct: boolean }[]
}

export default function ExerciceRunner({ exercices, userId, resultatsExistants }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const supabase = createClient()

  const exercice = exercices[current]
  const isCorrect = selected === exercice?.reponse_correcte
  const options = exercice?.options as string[] ?? ['Vrai', 'Faux']

  const handleConfirm = async () => {
    if (!selected) return
    setConfirmed(true)

    const correct = selected === exercice.reponse_correcte
    const points = correct ? exercice.points : 0

    if (correct) setScore(s => s + points)
    setResults(r => [...r, correct])

    // Sauvegarder le résultat
    await supabase.from('resultats_exercices').insert({
      user_id: userId,
      exercice_id: exercice.id,
      reponse_donnee: selected,
      est_correct: correct,
      points_gagnes: points,
    })

    // Ajouter XP si correct
    if (correct) {
      await supabase.rpc('increment_xp', { user_id: userId, points })
    }
  }

  const handleNext = () => {
    if (current + 1 >= exercices.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setScore(0)
    setFinished(false)
    setResults([])
  }

  // Écran de fin
  if (finished) {
    const total = exercices.reduce((acc, e) => acc + e.points, 0)
    const pct = Math.round(score / total * 100)
    const mention = pct >= 80 ? '🏆 Excellent !' : pct >= 60 ? '👍 Bien !' : '💪 Continue !'

    return (
      <div className="bg-white rounded-2xl p-8 card-shadow text-center">
        <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{mention}</h2>
        <p className="text-gray-500 mb-6">Tu as terminé cet entraînement</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-light rounded-xl p-4">
            <div className="text-2xl font-bold text-green">{score}</div>
            <div className="text-xs text-gray-500">Points gagnés</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-500">
              {results.filter(Boolean).length}/{exercices.length}
            </div>
            <div className="text-xs text-gray-500">Bonnes réponses</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-500">{pct}%</div>
            <div className="text-xs text-gray-500">Taux de réussite</div>
          </div>
        </div>

        {/* Détail par question */}
        <div className="text-left space-y-2 mb-6">
          {results.map((ok, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${ok ? 'bg-green-light' : 'bg-red-50'}`}>
              {ok
                ? <CheckCircle className="w-4 h-4 text-green flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              }
              <span className="text-sm text-gray-700 truncate">{exercices[i].question}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-2 mx-auto bg-green text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            Question {current + 1} / {exercices.length}
          </span>
          <div className="flex items-center gap-1 text-sm font-medium text-green">
            <Zap className="w-4 h-4" />
            {score} pts
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green h-2 rounded-full transition-all"
            style={{ width: `${(current / exercices.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            exercice.difficulte === 'facile' ? 'bg-green-light text-green' :
            exercice.difficulte === 'moyen' ? 'bg-orange-50 text-orange-500' :
            'bg-red-50 text-red-500'
          )}>
            {exercice.difficulte}
          </span>
          <span className="text-xs text-gray-400">+{exercice.points} pts</span>
        </div>

        <p className="text-lg font-semibold text-gray-900 mb-6 leading-snug">
          {exercice.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, i) => {
            const isSelected = selected === option
            const isCorrectOption = option === exercice.reponse_correcte

            let style = 'border-gray-200 hover:border-green hover:bg-gray-50'
            if (confirmed) {
              if (isCorrectOption) style = 'border-green bg-green-light'
              else if (isSelected && !isCorrectOption) style = 'border-red-400 bg-red-50'
              else style = 'border-gray-200 opacity-50'
            } else if (isSelected) {
              style = 'border-green bg-green-light'
            }

            return (
              <button
                key={i}
                onClick={() => !confirmed && setSelected(option)}
                disabled={confirmed}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3',
                  style
                )}
              >
                <span className="text-sm font-medium text-gray-800">{option}</span>
                {confirmed && isCorrectOption && (
                  <CheckCircle className="w-5 h-5 text-green flex-shrink-0" />
                )}
                {confirmed && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Explication */}
      {confirmed && (
        <div className={cn(
          'rounded-2xl p-5 card-shadow',
          isCorrect ? 'bg-green-light' : 'bg-red-50'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect
              ? <CheckCircle className="w-5 h-5 text-green" />
              : <XCircle className="w-5 h-5 text-red-500" />
            }
            <span className={`font-bold text-sm ${isCorrect ? 'text-green' : 'text-red-500'}`}>
              {isCorrect ? `Bravo ! +${exercice.points} points` : 'Pas tout à fait...'}
            </span>
          </div>
          <p className="text-sm text-gray-700">{exercice.explication}</p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {current + 1 >= exercices.length ? (
              <><Trophy className="w-4 h-4" /> Voir les résultats</>
            ) : (
              <>Question suivante <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}