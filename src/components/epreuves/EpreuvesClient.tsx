'use client'

import { useState } from 'react'
import { Search, X, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'

interface Epreuve {
  id: string
  titre: string
  matiere: string
  classe: string
  semestre: string | null
  type: 'bac' | 'bfem' | 'exercice' | 'devoir' | 'corrige'
  annee: number | null
  pdf_url: string
}

interface Props {
  userId: string
  profile: Profile | null
  epreuves: Epreuve[]
}

const MATIERES_LABELS: Record<string, string> = {
  MATH: 'Mathématiques',
  PC: 'Physique-Chimie',
  SVT: 'SVT',
  FR: 'Français',
  HG: 'Histoire-Géographie',
  EN: 'Anglais',
  PHILO: 'Philosophie',
  ECO: 'Économie',
  AUTRE: 'Autres matières',
}

function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM 2026', date: '2026-06-10' }
    : { nom: 'BAC 2026', date: '2026-06-17' }

  const diff = Math.ceil(
    (new Date(examen.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="gradient-green rounded-2xl p-5 text-white">
      {diff < 0 ? (
        <div className="text-center">
          <p className="font-bold text-lg">{examen.nom} — Session terminée</p>
          <p className="text-white/70 text-sm mt-1">Retrouvez les sujets et corrigés ci-dessous</p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Compte à rebours</p>
            <p className="text-xl font-bold mt-1">{examen.nom}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{diff}</p>
            <p className="text-white/70 text-xs">jours restants</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState<'bac' | 'corrige' | null>(null)
  const [anneesOuvertes, setAnneesOuvertes] = useState<Record<number, boolean>>({ 2026: true })
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? '3eme'

  // Grouper par année puis par matière
  const grouped: Record<number, Record<string, { sujet?: Epreuve; corrige?: Epreuve }>> = {}

  epreuves.forEach(e => {
    const annee = e.annee ?? 0
    const matiere = e.matiere ?? 'AUTRE'

    if (!grouped[annee]) grouped[annee] = {}
    if (!grouped[annee][matiere]) grouped[annee][matiere] = {}

    if (e.type === 'corrige') {
      grouped[annee][matiere].corrige = e
    } else {
      grouped[annee][matiere].sujet = e
    }
  })

  const annees = Object.keys(grouped).map(Number).sort((a, b) => b - a)

  const toggleAnnee = (annee: number) => {
    setAnneesOuvertes(prev => ({ ...prev, [annee]: !prev[annee] }))
  }

  // Filtrage par recherche
  const matiereMatchSearch = (matiere: string) => {
    if (!search) return true
    const label = MATIERES_LABELS[matiere] ?? matiere
    return label.toLowerCase().includes(search.toLowerCase())
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Sujets {classe === '3eme' ? 'BFEM' : 'BAC'} — Années précédentes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {epreuves.length} documents disponibles avec corrigés
        </p>
      </div>

      <ExamenCountdown classe={classe} />

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une matière..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtres type */}
      <div className="flex gap-2">
        {([null, 'bac', 'corrige'] as const).map(t => (
          <button
            key={t ?? 'tous'}
            onClick={() => setFiltreType(t)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium transition',
              filtreType === t ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            {t === null ? 'Tout' : t === 'bac' ? 'Sujets' : 'Corrigés'}
          </button>
        ))}
      </div>

      {/* Contenu groupé par année */}
      <div className="space-y-4">
        {annees.map(annee => {
          const matieresDannee = Object.keys(grouped[annee]).filter(matiereMatchSearch)
          if (matieresDannee.length === 0) return null
          const isOpen = anneesOuvertes[annee] ?? false

          return (
            <div key={annee} className="bg-white rounded-2xl card-shadow overflow-hidden">

              {/* Header année */}
              <button
                onClick={() => toggleAnnee(annee)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-base">BAC {annee}</span>
                  <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full font-medium">
                    {matieresDannee.length} matières
                  </span>
                </div>
                {isOpen
                  ? <ChevronUp className="w-5 h-5 text-gray-400" />
                  : <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>

              {/* Table des matières */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100">
                      {/* En-têtes colonnes */}
                      <div className="grid grid-cols-3 px-5 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500">Matière</span>
                        <span className="text-xs font-semibold text-gray-500 text-center">Sujet</span>
                        <span className="text-xs font-semibold text-gray-500 text-center">Corrigé</span>
                      </div>

                      {/* Lignes matières */}
                      {matieresDannee.map((matiere, i) => {
                        const { sujet, corrige } = grouped[annee][matiere]
                        const afficherSujet = !filtreType || filtreType === 'bac'
                        const afficherCorrige = !filtreType || filtreType === 'corrige'

                        return (
                          <div
                            key={matiere}
                            className={cn(
                              'grid grid-cols-3 px-5 py-3 items-center',
                              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                              'border-b border-gray-100 last:border-0'
                            )}
                          >
                            <span className="text-sm font-medium text-gray-800 pr-2">
                              {MATIERES_LABELS[matiere] ?? matiere}
                            </span>

                            <div className="flex justify-center">
                              {sujet && afficherSujet ? (
                                <button
                                  onClick={() => setPdfOuvert(sujet)}
                                  className="flex items-center gap-1 text-xs bg-green-light text-green px-3 py-1.5 rounded-lg font-medium hover:bg-green hover:text-white transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Voir
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </div>

                            <div className="flex justify-center">
                              {corrige && afficherCorrige ? (
                                <button
                                  onClick={() => setPdfOuvert(corrige)}
                                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Corrigé
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* PDF Viewer */}
      <AnimatePresence>
        {pdfOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setPdfOuvert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-bold text-gray-900 text-sm truncate">{pdfOuvert.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {MATIERES_LABELS[pdfOuvert.matiere] ?? pdfOuvert.matiere} — {pdfOuvert.annee}
                  </p>
                </div>
                <button
                  onClick={() => setPdfOuvert(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`${pdfOuvert.pdf_url}#toolbar=0`}
                  className="w-full h-full"
                  title={pdfOuvert.titre}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}