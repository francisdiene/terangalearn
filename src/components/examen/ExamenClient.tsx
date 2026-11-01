'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import {
  Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, ChevronRight, Trophy, RotateCcw
} from 'lucide-react'

const MATIERES_PAR_SERIE: Record<string, string[]> = {
  S1:   ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO'],
  S2:   ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO'],
  L:    ['FR', 'PHILO', 'HG', 'EN', 'MATH', 'PC'],
  G:    ['MATH', 'ECO', 'FR', 'HG', 'EN', 'PHILO'],
  STEG: ['MATH', 'ECO', 'FR', 'HG', 'EN', 'PHILO'],
}

const MATIERE_NOMS: Record<string, string> = {
  MATH: 'Mathématiques', PC: 'Physique-Chimie', SVT: 'SVT',
  FR: 'Français', HG: 'Histoire-Géographie', EN: 'Anglais',
  PHILO: 'Philosophie', ECO: 'Économie'
}

interface Props {
  userId: string
  profile: Profile | null
}

type Etape = 'config' | 'examen' | 'correction'

// ─── Chrono hh:mm:ss visible et grand ────────────────────────────────────────
function Chrono({ secondes }: { secondes: number }) {
  const h   = Math.floor(secondes / 3600)
  const m   = Math.floor((secondes % 3600) / 60)
  const sec = secondes % 60

  const urgent = secondes < 300  // rouge sous 5 min
  const warning = secondes < 900 // orange sous 15 min

  const couleur = urgent
    ? 'text-red-500'
    : warning
    ? 'text-amber-500'
    : 'text-green'

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono font-bold',
      urgent ? 'bg-red-50' : warning ? 'bg-amber-50' : 'bg-green-light'
    )}>
      <Clock className={cn('w-4 h-4 flex-shrink-0', couleur)} />
      <span className={cn('text-xl tracking-widest', couleur)}>
        {h > 0 && <>{String(h).padStart(2, '0')}<span className="opacity-50">h</span></>}
        {String(m).padStart(2, '0')}
        <span className="opacity-50 text-base">:</span>
        {String(sec).padStart(2, '0')}
      </span>
    </div>
  )
}

export default function ExamenClient({ userId, profile }: Props) {
  const supabase = createClient()
  const serie = profile?.serie ?? 'S1'
  const matieresDispo = MATIERES_PAR_SERIE[serie] ?? MATIERES_PAR_SERIE['S1']

  const [etape, setEtape] = useState<Etape>('config')
  const [matieresSel, setMatieresSel] = useState<string[]>([])
  const [questions, setQuestions] = useState<any>({})
  const [reponses, setReponses] = useState<Record<string, Record<string, string>>>({})
  const [corrections, setCorrections] = useState<any>({})
  const [noteFinale, setNoteFinale] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [matiereActive, setMatiereActive] = useState<string>('')
  const [tempsRestant, setTempsRestant] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const toggleMatiere = (m: string) => {
    setMatieresSel(prev =>
      prev.includes(m)
        ? prev.filter(x => x !== m)
        : prev.length < 3 ? [...prev, m] : prev
    )
  }

  const demarrerExamen = async () => {
    if (matieresSel.length < 2) return
    setLoading(true)

    setErreur(null)
    const res = await fetch('/api/generate-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serie, matieres: matieresSel })
    })
    const data = await res.json()
    if (!res.ok || data.error || !data.questions) {
      setErreur(`Erreur ${res.status} : ${data.error ?? 'Réponse invalide de l\'API'}`)
      setLoading(false)
      return
    }

    // Vérifier que les questions ont bien des QCM
    const questionsVides = matieresSel.every(m => !data.questions[m]?.qcm?.length)
    if (questionsVides) {
      setErreur('L\'IA n\'a pas pu générer les questions. Vérifie que GROQ_API_KEY est configurée dans Vercel.')
      setLoading(false)
      return
    }
    setQuestions(data.questions)
    setMatiereActive(matieresSel[0])
    setTempsRestant(matieresSel.length * 45 * 60)
    setEtape('examen')
    setLoading(false)
  }

  // Timer — tick chaque seconde
  useEffect(() => {
    if (etape !== 'examen') return
    timerRef.current = setInterval(() => {
      setTempsRestant(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          soumettre()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [etape])

  const repondreQCM = (matiere: string, qcmId: number, option: string) => {
    setReponses(prev => ({
      ...prev,
      [matiere]: { ...(prev[matiere] ?? {}), [`qcm_${qcmId}`]: option }
    }))
  }

  const repondreQO = (matiere: string, texte: string) => {
    setReponses(prev => ({
      ...prev,
      [matiere]: { ...(prev[matiere] ?? {}), question_ouverte: texte }
    }))
  }

  const soumettre = async () => {
    clearInterval(timerRef.current!)
    setLoading(true)

    const res = await fetch('/api/correct-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, reponses })
    })
    const data = await res.json()
    if (data.error || !data.corrections) {
      alert('Erreur lors de la correction. Réessaie.')
      setLoading(false)
      return
    }
    setCorrections(data.corrections)
    setNoteFinale(data.note_finale ?? 0)

    await supabase.from('examens_simules').insert({
      user_id: userId,
      serie,
      matieres: matieresSel,
      questions,
      reponses,
      correction: data.corrections,
      note_finale: data.note_finale,
      statut: 'termine',
      termine_at: new Date().toISOString()
    })

    const xpGagne = data.note_finale >= 16 ? 100
      : data.note_finale >= 14 ? 75
      : data.note_finale >= 10 ? 50 : 25

    await supabase.rpc('increment_xp', { user_id: userId, points: xpGagne })
    setEtape('correction')
    setLoading(false)
  }

  const getNiveauNote = (note: number) => {
    if (note >= 16) return { label: 'Excellent', color: 'text-green' }
    if (note >= 14) return { label: 'Très bien', color: 'text-blue-500' }
    if (note >= 12) return { label: 'Bien', color: 'text-yellow-600' }
    if (note >= 10) return { label: 'Passable', color: 'text-orange-500' }
    return { label: 'Insuffisant', color: 'text-red-500' }
  }

  // ===== CONFIG =====
  if (etape === 'config') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examen simulé</h1>
          <p className="text-gray-500 mt-1">Série {serie} — Généré et corrigé par intelligence artificielle</p>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-gray-900 mb-1">Comment ça marche ?</h2>
          <div className="space-y-2 mt-3">
            {[
              'Choisis 2 ou 3 matières de ta série',
              "L'IA génère des QCM + 1 question ouverte par matière",
              'Tu réponds en temps limité (45 min par matière)',
              "L'IA corrige et te donne une note finale sur 20",
              'Tu gagnes entre 25 et 100 XP selon ta performance',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h2 className="font-bold text-gray-900 mb-4">
            Choisis tes matières <span className="text-gray-400 font-normal">(2 ou 3 max)</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {matieresDispo.map(m => (
              <button
                key={m}
                onClick={() => toggleMatiere(m)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition',
                  matieresSel.includes(m)
                    ? 'border-green bg-green-light'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <p className={cn('font-semibold text-sm', matieresSel.includes(m) ? 'text-green' : 'text-gray-900')}>
                  {MATIERE_NOMS[m]}
                </p>
                {matieresSel.includes(m) && (
                  <p className="text-xs text-green/70 mt-0.5">45 min</p>
                )}
              </button>
            ))}
          </div>

          {/* Durée totale estimée */}
          {matieresSel.length >= 2 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Durée totale estimée :{' '}
                <span className="font-bold text-gray-900">
                  {matieresSel.length * 45} min ({matieresSel.length}h{matieresSel.length * 45 % 60 > 0 ? `${matieresSel.length * 45 % 60}min` : ''})
                </span>
              </p>
            </div>
          )}

          {erreur && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{erreur}</p>
              </div>
            </div>
          )}

          <button
            onClick={demarrerExamen}
            disabled={matieresSel.length < 2 || loading}
            className="w-full mt-6 py-4 bg-green text-white font-bold rounded-2xl hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Génération de l'examen...</>
            ) : (
              <>Démarrer l'examen <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ===== EXAMEN =====
  if (etape === 'examen') {
    const dataMatiere = questions[matiereActive] ?? { nom: '...', coefficient: 1, qcm: [], question_ouverte: null }
    const reponsesMatiere = reponses[matiereActive] ?? {}
    const matiereIdx = matieresSel.indexOf(matiereActive)

    // Progression : nb de questions répondues dans la matière active
    const totalQCM = dataMatiere?.qcm?.length ?? 0
    const reponsesQCM = Object.keys(reponsesMatiere).filter(k => k.startsWith('qcm_')).length
    const aQO = !!dataMatiere?.question_ouverte
    const reponsesTotal = reponsesQCM + (reponsesMatiere['question_ouverte'] ? 1 : 0)
    const totalQuestions = totalQCM + (aQO ? 1 : 0)
    const pct = totalQuestions > 0 ? Math.round((reponsesTotal / totalQuestions) * 100) : 0

    return (
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header sticky avec chrono grand et visible */}
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{dataMatiere?.nom}</h2>
              <p className="text-xs text-gray-400">
                Coeff. {dataMatiere?.coefficient} · Série {serie} · {pct}% répondu
              </p>
            </div>
            {/* ← Chrono heure:minute:seconde */}
            <Chrono secondes={tempsRestant} />
          </div>

          {/* Barre de progression */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Navigation matières */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {matieresSel.map(m => {
            const repM = reponses[m] ?? {}
            const qTotal = (questions[m]?.qcm?.length ?? 0) + (questions[m]?.question_ouverte ? 1 : 0)
            const qFait  = Object.keys(repM).length
            const done   = qTotal > 0 && qFait === qTotal

            return (
              <button
                key={m}
                onClick={() => setMatiereActive(m)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition flex-shrink-0 flex items-center gap-1.5',
                  matiereActive === m ? 'bg-green text-white' : 'bg-white text-gray-600 card-shadow'
                )}
              >
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-green" />}
                {MATIERE_NOMS[m]}
              </button>
            )
          })}
        </div>

        {/* Questions QCM */}
        <div className="space-y-4">
          {dataMatiere?.qcm?.map((qcm: any, idx: number) => (
            <div key={qcm.id} className="bg-white rounded-2xl p-5 card-shadow">
              <p className="font-semibold text-gray-900 text-sm mb-4 leading-relaxed">
                {idx + 1}. {qcm.question}
              </p>
              <div className="space-y-2">
                {qcm.options?.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => repondreQCM(matiereActive, qcm.id, option)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border-2 text-sm transition',
                      reponsesMatiere[`qcm_${qcm.id}`] === option
                        ? 'border-green bg-green-light text-green font-medium'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Question ouverte */}
        {dataMatiere?.question_ouverte && (
          <div className="bg-white rounded-2xl p-5 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg">
                Question ouverte — {dataMatiere.question_ouverte.points} pts
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-3 leading-relaxed">
              {dataMatiere.question_ouverte.question}
            </p>
            <textarea
              value={reponsesMatiere['question_ouverte'] ?? ''}
              onChange={e => repondreQO(matiereActive, e.target.value)}
              placeholder="Rédigez votre réponse ici..."
              rows={5}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green resize-none"
            />
          </div>
        )}

        {/* Boutons navigation + soumettre */}
        <div className="flex gap-3">
          {matiereIdx < matieresSel.length - 1 && (
            <button
              onClick={() => setMatiereActive(matieresSel[matiereIdx + 1])}
              className="flex-1 py-3 bg-green-light text-green font-semibold rounded-xl hover:bg-green hover:text-white transition text-sm"
            >
              Matière suivante →
            </button>
          )}
          <button
            onClick={soumettre}
            disabled={loading}
            className="flex-1 py-3 bg-green text-white font-bold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Correction en cours...</>
            ) : (
              'Soumettre et corriger'
            )}
          </button>
        </div>
      </div>
    )
  }

  // ===== CORRECTION =====
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Note finale */}
      <div className="gradient-green rounded-2xl p-6 text-white text-center">
        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-80" />
        <p className="text-white/70 text-sm mb-1">Note finale</p>
        <p className="text-5xl font-bold">{noteFinale.toFixed(2)}</p>
        <p className="text-white/70 text-sm mt-1">/ 20</p>
        <p className="mt-2 font-bold text-lg">{getNiveauNote(noteFinale).label}</p>
        <p className="text-white/60 text-xs mt-1">
          XP gagné : {noteFinale >= 16 ? 100 : noteFinale >= 14 ? 75 : noteFinale >= 10 ? 50 : 25} XP
        </p>
      </div>

      {/* Détails par matière */}
      {Object.entries(corrections).map(([matiere, corr]: any) => (
        <div key={matiere} className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">{corr.nom}</h3>
              <p className="text-xs text-gray-400">Coefficient {corr.coefficient}</p>
            </div>
            <div className="text-right">
              <span className={cn('text-2xl font-bold', getNiveauNote(corr.note).color)}>
                {corr.note.toFixed(2)}/20
              </span>
            </div>
          </div>

          {/* QCM corrigés */}
          <div className="space-y-3 mb-4">
            {corr.qcm?.map((q: any) => (
              <div key={q.id} className={cn(
                'rounded-xl p-3',
                q.correct ? 'bg-green-light' : 'bg-red-50'
              )}>
                <div className="flex items-start gap-2 mb-1">
                  {q.correct
                    ? <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-xs font-medium text-gray-900 leading-relaxed">{q.question}</p>
                </div>
                {!q.correct && (
                  <p className="text-xs text-gray-500 ml-6">
                    Ta réponse : <span className="text-red-500">{q.reponse_eleve ?? 'Non répondu'}</span>
                    {' | '}Correcte : <span className="text-green font-medium">{q.reponse_correcte}</span>
                  </p>
                )}
                {q.explication && (
                  <p className="text-xs text-gray-500 ml-6 mt-1 italic">{q.explication}</p>
                )}
              </div>
            ))}
          </div>

          {/* Question ouverte corrigée */}
          {corr.question_ouverte && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600">Question ouverte</span>
                <span className="text-xs font-bold text-blue-600">
                  {corr.question_ouverte.points_obtenus}/{corr.question_ouverte.points_max} pts
                </span>
              </div>
              <p className="text-xs font-medium text-blue-700 mb-1">
                Appréciation : {corr.question_ouverte.appreciation}
              </p>
              <p className="text-xs text-blue-600 leading-relaxed">
                {corr.question_ouverte.commentaire}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Recommencer */}
      <button
        onClick={() => {
          setEtape('config')
          setMatieresSel([])
          setQuestions({})
          setReponses({})
          setCorrections({})
          setNoteFinale(0)
        }}
        className="w-full py-3 border-2 border-green text-green font-bold rounded-2xl hover:bg-green hover:text-white transition flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Nouvel examen simulé
      </button>
    </div>
  )
}
