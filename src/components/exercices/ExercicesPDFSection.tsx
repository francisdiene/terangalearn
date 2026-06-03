'use client'

import { useState } from 'react'
import { FileText, Eye, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'

interface Epreuve {
  id: string
  titre: string
  matiere: string
  classe: string
  semestre: string | null
  type: string
  annee: number | null
  pdf_url: string
}

interface Props {
  epreuves: Epreuve[]
  profile: Profile | null
}

const MATIERES_LABELS: Record<string, string> = {
  MATH: '📐 Maths', PC: '⚗️ Physique-Chimie', SVT: '🧬 SVT',
  FR: '📖 Français', HG: '🌍 Histoire-Géo', EN: '🇬🇧 Anglais',
  PHILO: '🧠 Philo', ECO: '📊 Économie'
}

export default function ExercicesPDFSection({ epreuves, profile }: Props) {
  const [search, setSearch] = useState('')
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [filtreSemestre, setFiltreSemestre] = useState<string | null>(null)
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? '3eme'

  const epreuvesFiltrees = epreuves.filter(e => {
    if (e.classe !== classe && e.classe !== 'both') return false
    if (search && !e.titre.toLowerCase().includes(search.toLowerCase())) return false
    if (filtreMatiere && e.matiere !== filtreMatiere) return false
    if (filtreSemestre && e.semestre !== filtreSemestre) return false
    return true
  })

  const matieres = [...new Set(epreuves.map(e => e.matiere))]

  return (
    <div className="space-y-4">

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un exercice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
        />
      </div>

      {/* Filtres */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltreMatiere(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
              !filtreMatiere ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            Toutes
          </button>
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
      </div>

      {/* Liste */}
      {epreuvesFiltrees.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun exercice trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {epreuvesFiltrees.map((epreuve, i) => (
            <motion.div
              key={epreuve.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-4 card-shadow hover-lift"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
                    {epreuve.titre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {MATIERES_LABELS[epreuve.matiere] ?? epreuve.matiere}
                    </span>
                    {epreuve.semestre && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {epreuve.semestre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPdfOuvert(epreuve)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-green-light text-green rounded-xl text-xs font-semibold hover:bg-green hover:text-white transition"
              >
                <Eye className="w-4 h-4" />
                Voir l'exercice
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
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