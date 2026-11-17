'use client'

import { useState, useMemo } from 'react'
import { Search, X, ChevronDown, BookOpen, Sparkles, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'
import PDFViewer from '@/components/ui/PDFViewer'

interface Epreuve {
  id: string
  titre: string
  matiere: string
  classe: string
  semestre: string | null
  type: string
  annee: number | null
  pdf_url: string
  chapitre?: string | null
  has_corrige_externe?: boolean
  fournisseur_corrige?: string | null
}

interface Props {
  epreuves: Epreuve[]
  profile: Profile | null
}

const MATIERES_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  MATH:   { label: 'Mathématiques', icon: '📐', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  PHY:    { label: 'Physique',       icon: '⚡', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  CHIMIE: { label: 'Chimie',         icon: '🧪', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  SVT:    { label: 'SVT',            icon: '🧬', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  FR:     { label: 'Français',       icon: '📝', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  HG:     { label: 'Histoire-Géo',   icon: '🌍', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  PHILO:  { label: 'Philosophie',    icon: '💭', color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  EN:     { label: 'Anglais',        icon: '🇬🇧', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  ECO:    { label: 'Économie',       icon: '📊', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
}

export default function ExercicesPDFSection({ epreuves, profile }: Props) {
  const [search, setSearch]           = useState('')
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [filtreSemestre, setFiltreSemestre] = useState<string | null>(null)
  const [pdfOuvert, setPdfOuvert]     = useState<Epreuve | null>(null)
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({})

  const classe = profile?.classe ?? '3eme'
  const isTerminale = classe === 'terminale'

  // Filtrage
  const epreuvesFiltrees = useMemo(() => epreuves.filter(e => {
    if (e.classe !== classe && e.classe !== 'both') return false
    if (filtreMatiere && e.matiere !== filtreMatiere) return false
    if (filtreSemestre && e.semestre !== filtreSemestre) return false
    if (search && !e.titre.toLowerCase().includes(search.toLowerCase()) &&
        !(e.chapitre ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [epreuves, classe, filtreMatiere, filtreSemestre, search])

  // Groupement par matière
  const parMatiere = useMemo(() => {
    const map: Record<string, Epreuve[]> = {}
    for (const e of epreuvesFiltrees) {
      if (!map[e.matiere]) map[e.matiere] = []
      map[e.matiere].push(e)
    }
    return map
  }, [epreuvesFiltrees])

  const matieresDispo = useMemo(
    () => [...new Set(epreuves.filter(e => e.classe === classe || e.classe === 'both').map(e => e.matiere))],
    [epreuves, classe]
  )

  const toggleMatiere = (code: string) =>
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }))

  const totalAffiches = epreuvesFiltrees.length

  return (
    <div className="space-y-5">

      {/* Barre de recherche + filtres */}
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou chapitre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green text-sm bg-gray-50 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filtres matières */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setFiltreMatiere(null)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              !filtreMatiere
                ? 'bg-green text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            Toutes
          </button>
          {matieresDispo.map(code => {
            const cfg = MATIERES_CONFIG[code]
            const actif = filtreMatiere === code
            return (
              <button
                key={code}
                onClick={() => setFiltreMatiere(actif ? null : code)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5',
                  actif ? 'shadow-sm text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                style={actif ? { backgroundColor: cfg?.color ?? '#16a34a' } : {}}
              >
                <span>{cfg?.icon ?? '📄'}</span>
                {cfg?.label ?? code}
              </button>
            )
          })}
        </div>

        {/* Filtre semestre (Terminale) */}
        {isTerminale && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Semestre :</span>
            {['S1', 'S2'].map(s => (
              <button
                key={s}
                onClick={() => setFiltreSemestre(filtreSemestre === s ? null : s)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition',
                  filtreSemestre === s ? 'bg-green text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Compteur */}
        <p className="text-xs text-gray-400">
          {totalAffiches} exercice{totalAffiches !== 1 ? 's' : ''} trouvé{totalAffiches !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Résultats vides */}
      {totalAffiches === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Aucun exercice trouvé</p>
          <p className="text-sm mt-1">Essaie un autre mot-clé ou filtre</p>
        </div>
      )}

      {/* Groupes par matière */}
      {Object.entries(parMatiere).map(([code, items]) => {
        const cfg = MATIERES_CONFIG[code]
        const isOpen = expanded[code] !== false // ouvert par défaut
        const PREVIEW = 4

        return (
          <div key={code} className="bg-white rounded-2xl overflow-hidden card-shadow">

            {/* Header matière */}
            <button
              onClick={() => toggleMatiere(code)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: cfg?.bg ?? '#f0fdf4', border: `1.5px solid ${cfg?.border ?? '#bbf7d0'}` }}
                >
                  {cfg?.icon ?? '📄'}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-sm">{cfg?.label ?? code}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {items.length} exercice{items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: cfg?.bg ?? '#f0fdf4', color: cfg?.color ?? '#16a34a' }}
                >
                  {items.length}
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
                />
              </div>
            </button>

            {/* Liste exercices */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items.map((e, i) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition group"
                      >
                        {/* Numéro */}
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: cfg?.bg ?? '#f0fdf4', color: cfg?.color ?? '#16a34a' }}
                        >
                          {i + 1}
                        </span>

                        {/* Titre + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-1 group-hover:text-gray-900">
                            {e.titre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {e.chapitre && e.chapitre !== e.titre && (
                              <span className="text-xs text-gray-400 truncate max-w-[180px]">
                                {e.chapitre}
                              </span>
                            )}
                            {e.semestre && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">
                                {e.semestre}
                              </span>
                            )}
                            {e.has_corrige_externe && (
                              <span className="text-xs flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-medium">
                                <Sparkles className="w-2.5 h-2.5" />
                                Corrigé dispo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bouton */}
                        <button
                          onClick={() => setPdfOuvert(e)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: cfg?.bg ?? '#f0fdf4',
                            color: cfg?.color ?? '#16a34a',
                          }}
                          onMouseEnter={ev => {
                            const btn = ev.currentTarget
                            btn.style.backgroundColor = cfg?.color ?? '#16a34a'
                            btn.style.color = '#fff'
                          }}
                          onMouseLeave={ev => {
                            const btn = ev.currentTarget
                            btn.style.backgroundColor = cfg?.bg ?? '#f0fdf4'
                            btn.style.color = cfg?.color ?? '#16a34a'
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ouvrir
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {pdfOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPdfOuvert(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                {(() => {
                  const cfg = MATIERES_CONFIG[pdfOuvert.matiere]
                  return (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: cfg?.bg ?? '#f0fdf4' }}
                    >
                      {cfg?.icon ?? '📄'}
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{pdfOuvert.titre}</h3>
                  <p className="text-xs text-gray-400">
                    {MATIERES_CONFIG[pdfOuvert.matiere]?.label ?? pdfOuvert.matiere}
                    {pdfOuvert.semestre ? ` · ${pdfOuvert.semestre}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setPdfOuvert(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <PDFViewer url={pdfOuvert.pdf_url} titre={pdfOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
