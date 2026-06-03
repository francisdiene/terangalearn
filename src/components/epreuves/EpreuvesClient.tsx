'use client'

import { useState } from 'react'
import { FileText, Eye, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface Epreuve {
  id: string
  titre: string
  matiere: string
  classe: string
  semestre: string | null
  type: 'bac' | 'bfem' | 'exercice' | 'devoir'
  annee: number | null
  pdf_url: string
  corrige_url: string | null
  ordre: number
}

interface Props {
  userId: string
  profile: Profile | null
  epreuves: Epreuve[]
}

const TYPE_CONFIG = {
  bac: { label: 'BAC', color: 'bg-red-50 text-red-600', emoji: '🎓' },
  bfem: { label: 'BFEM', color: 'bg-blue-50 text-blue-600', emoji: '📋' },
  exercice: { label: 'Exercice', color: 'bg-green-light text-green', emoji: '✏️' },
  devoir: { label: 'Devoir', color: 'bg-orange-50 text-orange-600', emoji: '📝' },
}

const MATIERES_LABELS: Record<string, string> = {
  MATH: '📐 Maths', PC: '⚗️ Physique-Chimie', SVT: '🧬 SVT',
  FR: '📖 Français', HG: '🌍 Histoire-Géo', EN: '🇬🇧 Anglais',
  PHILO: '🧠 Philo', ECO: '📊 Économie'
}

export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState<string | null>(null)
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [filtreSemestre, setFiltreSemestre] = useState<string | null>(null)
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? '3eme'

  const epreuvesFiltrees = epreuves.filter(e => {
    if (e.classe !== classe && e.classe !== 'both') return false
    if (search && !e.titre.toLowerCase().includes(search.toLowerCase())) return false
    if (filtreType && e.type !== filtreType) return false
    if (filtreMatiere && e.matiere !== filtreMatiere) return false
    if (filtreSemestre && e.semestre !== filtreSemestre) return false
    return true
  })

  const matieres = [...new Set(epreuves.map(e => e.matiere))]

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Épreuves & Exercices 📝</h1>
        <p className="text-gray-500 mt-1">
          Annales {classe === '3eme' ? 'BFEM' : 'BAC'} et exercices par chapitre
        </p>
      </div>

      <ExamenCountdown classe={classe} />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une épreuve..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltreType(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
              !filtreType ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            Tous
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFiltreType(filtreType === key ? null : key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                filtreType === key ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>

        {classe === 'terminale' && (
          <div className="flex gap-2">
            {['S1', 'S2'].map(s => (
              <button
                key={s}
                onClick={() => setFiltreSemestre(filtreSemestre === s ? null : s)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium transition',
                  filtreSemestre === s ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {matieres.map(m => (
            <button
              key={m}
              onClick={() => setFiltreMatiere(filtreMatiere === m ? null : m)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                filtreMatiere === m ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {MATIERES_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      </div>

      {epreuvesFiltrees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-14 h-14 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Aucune épreuve trouvée</p>
          <p className="text-sm mt-1">Modifie tes filtres ou reviens plus tard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {epreuvesFiltrees.map((epreuve, i) => {
            const typeConf = TYPE_CONFIG[epreuve.type]
            return (
              <motion.div
                key={epreuve.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 card-shadow hover-lift"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{typeConf.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">
                      {epreuve.titre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeConf.color)}>
                        {typeConf.label}
                      </span>
                      {epreuve.annee && (
                        <span className="text-xs text-gray-400">{epreuve.annee}</span>
                      )}
                      {epreuve.semestre && (
                        <span className="text-xs text-gray-400">{epreuve.semestre}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPdfOuvert(epreuve)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-light text-green rounded-xl text-xs font-semibold hover:bg-green hover:text-white transition"
                >
                  <Eye className="w-4 h-4" />
                  Voir l'épreuve
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

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
                <h3 className="font-bold text-gray-900 truncate">{pdfOuvert.titre}</h3>
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

function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM 2026', date: '2026-06-10' }
    : { nom: 'BAC 2026', date: '2026-06-17' }

  const today = new Date()
  const dateExamen = new Date(examen.date)
  const diff = Math.ceil((dateExamen.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return null

  return (
    <div className="gradient-green rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">Compte à rebours</p>
          <p className="text-2xl font-bold mt-1">{examen.nom}</p>
          <p className="text-white/70 text-sm mt-1">
            {new Date(examen.date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold">{diff}</p>
          <p className="text-white/70 text-sm">jours restants</p>
        </div>
      </div>
      <div className="mt-4 bg-white/20 rounded-full h-2">
        <div
          className="bg-white h-2 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, (1 - diff / 365) * 100))}%` }}
        />
      </div>
    </div>
  )
}