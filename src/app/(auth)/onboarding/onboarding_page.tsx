'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, BookOpen, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const OBJECTIFS = [
  { id: 'reussir_examen', label: 'Réussir mon examen', emoji: '', desc: 'BFEM ou BAC' },
  { id: 'ameliorer_notes', label: 'Améliorer mes notes', emoji: '', desc: 'Progresser chaque jour' },
  { id: 'combler_lacunes', label: 'Combler mes lacunes', emoji: '', desc: 'Renforcer les bases' },
  { id: 'orientation', label: "Préparer mon orientation", emoji: '', desc: 'Choisir ma filière' },
]

const MATIERES_3EME = [
  { code: 'MATH', label: 'Mathématiques', emoji: '' },
  { code: 'PC', label: 'Physique-Chimie', emoji: '' },
  { code: 'SVT', label: 'SVT', emoji: '' },
  { code: 'FR', label: 'Français', emoji: '' },
  { code: 'HG', label: 'Histoire-Géo', emoji: '' },
  { code: 'EN', label: 'Anglais',  },
]

const MATIERES_TERMINALE = [
  ...MATIERES_3EME,
  { code: 'PHILO', label: 'Philosophie', emoji: '' },
  { code: 'ECO', label: 'Économie', emoji: '' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [objectif, setObjectif] = useState<string | null>(null)
  const [matieres, setMatieres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [classe, setClasse] = useState<string>('3eme')

  const matieresDisponibles = classe === 'terminale' ? MATIERES_TERMINALE : MATIERES_3EME

  const toggleMatiere = (code: string) => {
    setMatieres(m => m.includes(code) ? m.filter(x => x !== code) : [...m, code])
  }

  const handleNext = async () => {
    if (step === 0) {
      // Récupérer la classe de l'utilisateur pour adapter les matières à l'étape suivante
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('classe')
          .eq('id', user.id)
          .single()
        if (profile?.classe) setClasse(profile.classe)
      }
      setStep(1)
      return
    }

    // Étape finale : sauvegarder et rediriger
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({
          objectif,
          matieres_prioritaires: matieres,
          onboarding_complete: true,
        })
        .eq('id', user.id)
    }

    router.push('/confirmation')
  }

  const handleSkip = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id)
    }
    router.push('/confirmation')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[0, 1].map(i => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-green' : 'bg-gray-200'
              )}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl card-shadow p-6 md:p-8">
          <AnimatePresence mode="wait">

            {/* ===== ÉTAPE 0 : OBJECTIF ===== */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="w-12 h-12 bg-green-light rounded-2xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Quel est ton objectif ? 
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Ça nous aide à personnaliser ton expérience
                </p>

                <div className="space-y-3">
                  {OBJECTIFS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setObjectif(o.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition text-left',
                        objectif === o.id
                          ? 'border-green bg-green-light'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-2xl flex-shrink-0">{o.emoji}</span>
                      <div>
                        <p className={cn('font-semibold text-sm', objectif === o.id ? 'text-green' : 'text-gray-900')}>
                          {o.label}
                        </p>
                        <p className="text-xs text-gray-400">{o.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== ÉTAPE 1 : MATIÈRES ===== */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="w-12 h-12 bg-green-light rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Quelles matières veux-tu réviser en priorité ? 
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Choisis-en une ou plusieurs (optionnel)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {matieresDisponibles.map(m => (
                    <button
                      key={m.code}
                      onClick={() => toggleMatiere(m.code)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border-2 transition text-left',
                        matieres.includes(m.code)
                          ? 'border-green bg-green-light'
                          : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className="text-lg flex-shrink-0">{m.emoji}</span>
                      <p className={cn('font-medium text-xs', matieres.includes(m.code) ? 'text-green' : 'text-gray-700')}>
                        {m.label}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            ) : (
              <button
                onClick={handleSkip}
                disabled={loading}
                className="text-sm text-gray-400 hover:text-gray-600 transition"
              >
                Passer
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading || (step === 0 && !objectif)}
              className="flex items-center gap-2 bg-green text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {step === 0 ? 'Continuer' : 'Terminer'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
