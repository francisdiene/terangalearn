'use client'

import { useState } from 'react'
import { FileText, Eye, Search, X, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

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

const TYPE_CONFIG = {
  bac:     { label: 'BAC',     color: 'bg-red-50 text-red-600',    emoji: '' },
  bfem:    { label: 'BFEM',    color: 'bg-blue-50 text-blue-600',  emoji: '' },
  corrige: { label: 'Corrigé', color: 'bg-green-light text-green', emoji: '' },
  exercice:{ label: 'Exercice',color: 'bg-gray-50 text-gray-600',  emoji: '' },
  devoir:  { label: 'Devoir',  color: 'bg-orange-50 text-orange-600', emoji: '' },
}

const MATIERES_LABELS: Record<string, string> = {
  MATH: ' Maths', PC: ' Physique-Chimie', SVT: ' SVT',
  FR: ' Français', HG: ' Histoire-Géo', EN: ' Anglais',
  PHILO: ' Philo', ECO: ' Économie', AUTRE: ' Autre'
}

function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM 2026', date: '2026-06-10' }
    : { nom: 'BAC 2026', date: '2026-06-17' }

  const today = new Date()
  const dateExamen = new Date(examen.date)
  const diff = Math.ceil((dateExamen.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return (
    <div className="gradient-green rounded-2xl p-5 text-white text-center">
      <p className="font-bold text-xl">{examen.nom} — Session terminée </p>
      <p className="text-white/70 text-sm mt-1">Retrouvez les sujets et corrigés ci-dessous</p>
    </div>
  )

  return (
    <div className="gradient-green rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">Compte à rebours</p>
          <p className="text-2xl font-bold mt-1">{examen.nom}</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold">{diff}</p>
          <p className="text-white/70 text-sm">jours restants</p>
        </div>
      </div>
    </div>
  )
}

export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState<string | null>(null)
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [filtreAnnee, setFiltreAnnee] = useState<number | null>(null)
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? '3eme'

  const annees = [...new Set(epreuves.map(e => e.annee).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0))
  const matieres = [...new Set(epreuves.map(e => e.matiere))]

  const epreuvesFiltrees = epreuves.filter(e => {
    if (search && !e.titre.toLowerCase().includes(search.toLowerCase())) return false
    if (filtreType && e.type !== filtreType) return false
    if (filtreMatiere && e.matiere !== filtreMatiere) return false
    if (filtreAnnee && e.annee !== filtreAnnee) return false
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sujets {classe === '3eme' ? 'BFEM' : 'BAC'} — Années précédentes 📋
        </h1>
        <p className="text-gray-500 mt-1">
          Sujets officiels avec corrigés — {epreuves.length} documents disponibles
        </p>
      </div>

      <ExamenCountdown classe={classe} />

      {/* Recherche */}
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
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="space-y-2">
        {/* Type */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltreType(null)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
              !filtreType ? 'bg-green text-white' : 'bg-gray-100 text-gray-600')}
          >
            Tous
          </button>
          {(['bac', 'bfem', 'corrige'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltreType(filtreType === t ? null : t)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                filtreType === t ? 'bg-green text-white' : 'bg-gray-100 text-gray-600')}
            >
              {TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Année */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltreAnnee(null)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
              !filtreAnnee ? 'bg-green text-white' : 'bg-gray-100 text-gray-600')}
          >
            Toutes années
          </button>
          {annees.map(a => (
            <button
              key={a}
              onClick={() => setFiltreAnnee(filtreAnnee === a ? null : a!)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                filtreAnnee === a ? 'bg-green text-white' : 'bg-gray-100 text-gray-600')}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Matière */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {matieres.map(m => (
            <button
              key={m}
              onClick={() => setFiltreMatiere(filtreMatiere === m ? null : m)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                filtreMatiere === m ? 'bg-green text-white' : 'bg-gray-100 text-gray-600')}
            >
              {MATIERES_LABELS[m] ?? m}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {epreuvesFiltrees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-14 h-14 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Aucune épreuve trouvée</p>
          <p className="text-sm mt-1">Modifie tes filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {epreuvesFiltrees.map((epreuve, i) => {
            const conf = TYPE_CONFIG[epreuve.type] ?? TYPE_CONFIG['bac']
            return (
              <motion.div
                key={epreuve.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-4 card-shadow hover-lift"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{conf.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2 break-words">
                      {epreuve.titre}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', conf.color)}>
                        {conf.label}
                      </span>
                      {epreuve.annee && (
                        <span className="text-xs text-gray-400">{epreuve.annee}</span>
                      )}
                      {epreuve.matiere && epreuve.matiere !== 'AUTRE' && (
                        <span className="text-xs text-gray-400">
                          {MATIERES_LABELS[epreuve.matiere] ?? epreuve.matiere}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPdfOuvert(epreuve)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-light text-green rounded-xl text-xs font-semibold hover:bg-green hover:text-white transition"
                >
                  <Eye className="w-4 h-4" />
                  Voir le document
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

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
                <h3 className="font-bold text-gray-900 truncate text-sm">{pdfOuvert.titre}</h3>
                <button onClick={() => setPdfOuvert(null)} className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe src={`${pdfOuvert.pdf_url}#toolbar=0`} className="w-full h-full" title={pdfOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}