'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Users, Clock, Trophy, Loader2,
  CheckCircle2, XCircle, Wifi, Crown, RefreshCw
} from 'lucide-react'

const MATIERES = [
  { code: 'MATH', nom: 'Mathématiques' },
  { code: 'PC', nom: 'Physique-Chimie' },
  { code: 'SVT', nom: 'SVT' },
  { code: 'FR', nom: 'Français' },
  { code: 'HG', nom: 'Histoire-Géo' },
  { code: 'PHILO', nom: 'Philosophie' },
]

interface Props {
  userId: string
  profile: Profile | null
}

type Phase = 'lobby' | 'creation' | 'attente' | 'rejoindre' | 'duel' | 'resultat'

export default function DuelClient({ userId, profile }: Props) {
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('lobby')
  const [enLigne, setEnLigne] = useState<any[]>([])
  const [matiere, setMatiere] = useState('MATH')
  const [codeDuel, setCodeDuel] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [duel, setDuel] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [questionIdx, setQuestionIdx] = useState(0)
  const [reponseChoisie, setReponseChoisie] = useState<string | null>(null)
  const [scores, setScores] = useState({ moi: 0, adversaire: 0 })
  const [tempsRestant, setTempsRestant] = useState(30)
  const [loading, setLoading] = useState(false)
  const [adversaireRepondu, setAdversaireRepondu] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'

  // Mettre à jour la présence
  useEffect(() => {
    const majPresence = async () => {
      await supabase.from('presence').upsert({
        user_id: userId,
        full_name: profile?.full_name ?? 'Élève',
        niveau: profile?.niveau ?? 1,
        xp: profile?.xp ?? 0,
        classe: profile?.classe ?? '3eme',
        serie: profile?.serie ?? null,
        derniere_activite: new Date().toISOString()
      })
    }
    majPresence()

    // Nettoyer la présence quand on quitte
    return () => {
      supabase.from('presence').delete().eq('user_id', userId)
    }
  }, [])

  // Charger les élèves en ligne
  useEffect(() => {
    const chargerEnLigne = async () => {
      const { data } = await supabase
        .from('presence')
        .select('*')
        .neq('user_id', userId)
        .gt('derniere_activite', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('xp', { ascending: false })

      setEnLigne(data ?? [])
    }

    chargerEnLigne()
    const interval = setInterval(chargerEnLigne, 10000)

    // Realtime présence
    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
        chargerEnLigne()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  // Générer code aléatoire
  const genererCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  // Créer un duel
  const creerDuel = async (adversaireId?: string) => {
    setLoading(true)
    const code = genererCode()
    setCodeDuel(code)

    // Générer questions
    const res = await fetch('/api/generate-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serie: profile?.serie ?? 'S1', matieres: [matiere] })
    })
    const data = await res.json()
    const qcms = data.questions?.[matiere]?.qcm ?? []

    const { data: duelData } = await supabase
      .from('duels')
      .insert({
        code,
        createur_id: userId,
        createur_nom: profile?.full_name ?? 'Élève',
        adversaire_id: adversaireId ?? null,
        matiere,
        questions: qcms,
        statut: adversaireId ? 'invite' : 'attente'
      })
      .select()
      .single()

    setDuel(duelData)
    setQuestions(qcms)
    setPhase('attente')
    ecouterDuel(duelData.id)
    setLoading(false)
  }

  // Rejoindre un duel
  const rejoindreDuel = async () => {
    setLoading(true)
    const { data: duelData } = await supabase
      .from('duels')
      .select('*')
      .eq('code', codeInput.toUpperCase())
      .single()

    if (!duelData) {
      alert('Code invalide')
      setLoading(false)
      return
    }

    await supabase
      .from('duels')
      .update({
        adversaire_id: userId,
        adversaire_nom: profile?.full_name ?? 'Élève',
        statut: 'en_cours'
      })
      .eq('id', duelData.id)

    setDuel(duelData)
    setQuestions(duelData.questions ?? [])
    ecouterDuel(duelData.id)
    setPhase('duel')
    demarrerTimer()
    setLoading(false)
  }

  // Écouter les changements du duel
  const ecouterDuel = (duelId: string) => {
    channelRef.current = supabase
      .channel(`duel-${duelId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'duels',
        filter: `id=eq.${duelId}`
      }, (payload) => {
        const updated = payload.new
        setDuel(updated)

        if (updated.statut === 'en_cours' && phase === 'attente') {
          setPhase('duel')
          demarrerTimer()
        }

        if (updated.statut === 'termine') {
          setPhase('resultat')
          clearInterval(timerRef.current!)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'duel_reponses',
        filter: `duel_id=eq.${duelId}`
      }, (payload) => {
        if (payload.new.user_id !== userId) {
          setAdversaireRepondu(true)
        }
      })
      .subscribe()
  }

  // Timer par question
  const demarrerTimer = () => {
    setTempsRestant(30)
    clearInterval(timerRef.current!)
    timerRef.current = setInterval(() => {
      setTempsRestant(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          questionSuivante(null)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  // Répondre à une question
  const repondre = async (option: string) => {
    if (reponseChoisie || !duel) return
    clearInterval(timerRef.current!)
    setReponseChoisie(option)

    const q = questions[questionIdx]
    const correct = option === q.reponse_correcte

    await supabase.from('duel_reponses').insert({
      duel_id: duel.id,
      user_id: userId,
      question_idx: questionIdx,
      reponse: option,
      correct,
      temps_ms: (30 - tempsRestant) * 1000
    })

    if (correct) {
      setScores(s => ({ ...s, moi: s.moi + 1 }))
    }

    setTimeout(() => questionSuivante(option), 1500)
  }

  // Question suivante
  const questionSuivante = async (reponse: string | null) => {
    setReponseChoisie(null)
    setAdversaireRepondu(false)

    if (questionIdx >= questions.length - 1) {
      // Fin du duel
      const isCreateur = duel.createur_id === userId
      const scoreCreateur = isCreateur ? scores.moi : scores.adversaire
      const scoreAdversaire = isCreateur ? scores.adversaire : scores.moi
      const gagnantId = scoreCreateur > scoreAdversaire
        ? duel.createur_id
        : duel.adversaire_id

      await supabase.from('duels').update({
        statut: 'termine',
        score_createur: scoreCreateur,
        score_adversaire: scoreAdversaire,
        gagnant_id: gagnantId
      }).eq('id', duel.id)

      // XP
      const xp = gagnantId === userId ? 50 : 15
      await supabase.rpc('increment_xp', { user_id: userId, points: xp })

      setPhase('resultat')
    } else {
      setQuestionIdx(i => i + 1)
      demarrerTimer()
    }
  }

  // ===== LOBBY =====
  if (phase === 'lobby') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Swords className="w-7 h-7 text-green" />
            Mode Duel
          </h1>
          <p className="text-gray-500 text-sm mt-1">Affronte tes camarades en temps réel</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPhase('creation')}
            className="bg-green text-white rounded-2xl p-5 text-left hover:opacity-90 transition"
          >
            <Swords className="w-6 h-6 mb-2 opacity-80" />
            <p className="font-bold">Créer un duel</p>
            <p className="text-white/70 text-xs mt-0.5">Choisis ta matière et attends</p>
          </button>
          <button
            onClick={() => setPhase('rejoindre')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 text-left card-shadow hover:shadow-md transition"
          >
            <Users className="w-6 h-6 mb-2 text-green" />
            <p className="font-bold text-gray-900 dark:text-white">Rejoindre</p>
            <p className="text-gray-400 text-xs mt-0.5">Entre un code de duel</p>
          </button>
        </div>

        {/* Élèves en ligne */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                Élèves en ligne ({enLigne.length})
              </h2>
            </div>
            <button
              onClick={() => {}}
              className="text-gray-400 hover:text-green transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {enLigne.length === 0 ? (
            <div className="text-center py-8">
              <Wifi className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aucun élève en ligne pour le moment</p>
              <p className="text-gray-300 text-xs mt-1">Invite tes amis à rejoindre TerangaLearn !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enLigne.map((eleve, i) => (
                <motion.div
                  key={eleve.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {eleve.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {eleve.full_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Niv. {eleve.niveau} • {eleve.xp} XP
                        {eleve.serie ? ` • ${eleve.serie}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPhase('creation')
                    }}
                    className="flex items-center gap-1 bg-green/10 text-green px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green hover:text-white transition"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Défier
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===== CREATION =====
  if (phase === 'creation') {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Créer un duel</h2>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 card-shadow">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Choisis la matière</p>
          <div className="grid grid-cols-2 gap-2">
            {MATIERES.map(m => (
              <button
                key={m.code}
                onClick={() => setMatiere(m.code)}
                className={cn(
                  'py-3 px-4 rounded-xl border-2 text-sm font-medium transition text-left',
                  matiere === m.code
                    ? 'border-green bg-green-light text-green'
                    : 'border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                )}
              >
                {m.nom}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => creerDuel()}
          disabled={loading}
          className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
          {loading ? 'Génération du duel...' : 'Lancer le duel'}
        </button>

        <button onClick={() => setPhase('lobby')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
          Annuler
        </button>
      </div>
    )
  }

  // ===== ATTENTE =====
  if (phase === 'attente') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 card-shadow">
          <div className="w-16 h-16 bg-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Swords className="w-8 h-8 text-green" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Duel créé !</h2>
          <p className="text-gray-500 text-sm mb-6">Partage ce code à ton adversaire</p>

          <div className="bg-green-light rounded-2xl p-4 mb-4">
            <p className="text-xs text-green/70 mb-1">Code du duel</p>
            <p className="text-4xl font-black text-green tracking-widest">{codeDuel}</p>
          </div>

          <div className="flex items-center gap-2 justify-center text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">En attente de l'adversaire...</span>
          </div>
        </div>

        <button onClick={() => setPhase('lobby')} className="text-sm text-gray-400 hover:text-gray-600">
          Annuler le duel
        </button>
      </div>
    )
  }

  // ===== REJOINDRE =====
  if (phase === 'rejoindre') {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rejoindre un duel</h2>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 card-shadow">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Entre le code du duel</p>
          <input
            type="text"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Ex: AB12CD"
            maxLength={6}
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-green text-center text-2xl font-black tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button
          onClick={rejoindreDuel}
          disabled={codeInput.length < 6 || loading}
          className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Rejoindre le duel
        </button>

        <button onClick={() => setPhase('lobby')} className="w-full text-center text-sm text-gray-400">
          Annuler
        </button>
      </div>
    )
  }

  // ===== DUEL =====
  if (phase === 'duel' && questions.length > 0) {
    const q = questions[questionIdx]
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header scores */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-gray-400 mb-1">{prenom}</p>
              <p className="text-3xl font-black text-green">{scores.moi}</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <div className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm',
                tempsRestant <= 10 ? 'bg-red-50 text-red-500' : 'bg-green-light text-green'
              )}>
                <Clock className="w-4 h-4" />
                {tempsRestant}s
              </div>
              <p className="text-xs text-gray-400 mt-1">{questionIdx + 1}/{questions.length}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-400 mb-1">Adversaire</p>
              <p className="text-3xl font-black text-red-400">{scores.adversaire}</p>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 card-shadow">
          <p className="font-bold text-gray-900 dark:text-white text-sm leading-relaxed mb-4">
            {q.question}
          </p>
          <div className="space-y-2">
            {q.options?.map((option: string) => (
              <button
                key={option}
                onClick={() => repondre(option)}
                disabled={!!reponseChoisie}
                className={cn(
                  'w-full text-left p-3 rounded-xl border-2 text-sm transition font-medium',
                  reponseChoisie === null
                    ? 'border-gray-100 hover:border-green hover:bg-green-light'
                    : option === q.reponse_correcte
                      ? 'border-green bg-green-light text-green'
                      : option === reponseChoisie
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-gray-100 opacity-50'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {adversaireRepondu && (
          <div className="text-center text-xs text-green font-medium">
            ✓ Adversaire a répondu
          </div>
        )}
      </div>
    )
  }

  // ===== RESULTAT =====
  if (phase === 'resultat') {
    const gagne = duel?.gagnant_id === userId
    return (
      <div className="max-w-md mx-auto text-center space-y-5">
        <div className={cn(
          'rounded-3xl p-8',
          gagne ? 'gradient-green' : 'bg-white dark:bg-gray-800 card-shadow'
        )}>
          {gagne ? (
            <>
              <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-3" />
              <h2 className="text-3xl font-black text-white mb-1">Victoire !</h2>
              <p className="text-white/80 text-sm">+50 XP gagnés</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">😔</div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Défaite</h2>
              <p className="text-gray-400 text-sm">+15 XP pour ta participation</p>
            </>
          )}

          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <p className={cn('text-4xl font-black', gagne ? 'text-white' : 'text-green')}>
                {duel?.score_createur ?? scores.moi}
              </p>
              <p className={cn('text-xs', gagne ? 'text-white/60' : 'text-gray-400')}>
                {duel?.createur_nom ?? prenom}
              </p>
            </div>
            <div className="text-center">
              <p className={cn('text-4xl font-black', gagne ? 'text-white/40' : 'text-red-400')}>
                {duel?.score_adversaire ?? scores.adversaire}
              </p>
              <p className={cn('text-xs', gagne ? 'text-white/60' : 'text-gray-400')}>
                {duel?.adversaire_nom ?? 'Adversaire'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setPhase('lobby')
            setDuel(null)
            setQuestions([])
            setQuestionIdx(0)
            setScores({ moi: 0, adversaire: 0 })
            setReponseChoisie(null)
            if (channelRef.current) supabase.removeChannel(channelRef.current)
          }}
          className="w-full py-3 bg-green text-white font-bold rounded-2xl hover:opacity-90 transition"
        >
          Retour au lobby
        </button>
      </div>
    )
  }

  return null
}