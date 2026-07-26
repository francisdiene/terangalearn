'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Play, Pause, RotateCcw, Music, Volume2, VolumeX, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SONS = [
  { id: 'pluie', label: 'Pluie', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { id: 'foret', label: 'Forêt', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
  { id: 'cafe', label: 'Café', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-444.mp3' },
  { id: 'ocean', label: 'Océan', url: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1196.mp3' },
]

const DUREES_POMODORO = [
  { label: '25 min', travail: 25, pause: 5 },
  { label: '45 min', travail: 45, pause: 10 },
  { label: '50 min', travail: 50, pause: 10 },
]

export default function NuitRevision() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  // Pomodoro
  const [dureeIdx, setDureeIdx] = useState(0)
  const [phase, setPhase] = useState<'travail' | 'pause'>('travail')
  const [secondes, setSecondes] = useState(DUREES_POMODORO[0].travail * 60)
  const [actif, setActif] = useState(false)
  const [cycles, setCycles] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Son
  const [sonActif, setSonActif] = useState<string | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [mute, setMute] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isDark = theme === 'dark'
  const duree = DUREES_POMODORO[dureeIdx]

  // Timer Pomodoro
  useEffect(() => {
    if (actif) {
      timerRef.current = setInterval(() => {
        setSecondes(s => {
          if (s <= 1) {
            // Changer de phase
            if (phase === 'travail') {
              setPhase('pause')
              setCycles(c => c + 1)
              return duree.pause * 60
            } else {
              setPhase('travail')
              return duree.travail * 60
            }
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current!)
    }
    return () => clearInterval(timerRef.current!)
  }, [actif, phase, duree])

  const resetTimer = () => {
    clearInterval(timerRef.current!)
    setActif(false)
    setPhase('travail')
    setSecondes(duree.travail * 60)
    setCycles(0)
  }

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const pct = phase === 'travail'
    ? 1 - secondes / (duree.travail * 60)
    : 1 - secondes / (duree.pause * 60)

  // Audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (sonActif) {
      const son = SONS.find(s => s.id === sonActif)
      if (son) {
        const audio = new Audio(son.url)
        audio.loop = true
        audio.volume = mute ? 0 : volume
        audio.play().catch(() => {})
        audioRef.current = audio
      }
    }
    return () => { audioRef.current?.pause() }
  }, [sonActif])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = mute ? 0 : volume
    }
  }, [volume, mute])

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
  'fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition',
  isDark ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-white'
)}
      >
        <Moon className="w-5 h-5" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-50 w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Mode Nuit de Révision</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {isDark ? 'Mode sombre activé' : 'Mode clair'}
                    </span>
                  </div>
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      isDark ? 'bg-indigo-600' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </button>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Pomodoro */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Pomodoro
                  </p>

                  {/* Durée */}
                  <div className="flex gap-2 mb-4">
                    {DUREES_POMODORO.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDureeIdx(i)
                          resetTimer()
                          setSecondes(DUREES_POMODORO[i].travail * 60)
                        }}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-medium transition',
                          dureeIdx === i
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Timer cercle */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28 mb-3">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#E5E7EB" strokeWidth="8" className="dark:stroke-gray-700" />
                        <circle
                          cx="50" cy="50" r="44"
                          fill="none"
                          stroke={phase === 'travail' ? '#4F46E5' : '#10B981'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct)}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatTimer(secondes)}</span>
                        <span className={cn('text-xs font-medium', phase === 'travail' ? 'text-indigo-500' : 'text-green')}>
                          {phase === 'travail' ? 'Travail' : 'Pause'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={resetTimer} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActif(!actif)}
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white transition',
                          actif ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                        )}
                      >
                        {actif ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">{cycles}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Sons d'ambiance */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Sons d'ambiance
                    </p>
                    <button onClick={() => setMute(!mute)} className="text-gray-400 hover:text-gray-600">
                      {mute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {SONS.map(son => (
                      <button
                        key={son.id}
                        onClick={() => setSonActif(sonActif === son.id ? null : son.id)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-medium transition',
                          sonActif === son.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        )}
                      >
                        {son.label}
                      </button>
                    ))}
                  </div>

                  {sonActif && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={e => setVolume(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}