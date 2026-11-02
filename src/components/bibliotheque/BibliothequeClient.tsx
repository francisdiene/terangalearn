'use client'

import { useState } from 'react'
import { BookOpen, Search, X, Clock, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import PDFViewer from '@/components/ui/PDFViewer'

interface Livre {
  id: string
  titre: string
  auteur: string | null
  classe: string
  matiere: string | null
  description: string | null
  couverture_url: string | null
  pdf_url: string
  pages: number | null
}

interface Props {
  userId: string
  profile: Profile | null
  livres: Livre[]
}

const MATIERE_LABELS: Record<string, string> = {
  MATH: 'Maths', PC: 'Physique-Chimie', SVT: 'SVT',
  FR: 'Français', HG: 'Histoire-Géo', EN: 'Anglais',
  PHILO: 'Philo', ECO: 'Économie'
}

const MATIERE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  FR:    { bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-400' },
  MATH:  { bg: 'bg-blue-50',   text: 'text-blue-600',    dot: 'bg-blue-400' },
  PC:    { bg: 'bg-purple-50', text: 'text-purple-600',  dot: 'bg-purple-400' },
  SVT:   { bg: 'bg-emerald-50',text: 'text-emerald-600', dot: 'bg-emerald-400' },
  HG:    { bg: 'bg-amber-50',  text: 'text-amber-600',   dot: 'bg-amber-400' },
  EN:    { bg: 'bg-cyan-50',   text: 'text-cyan-600',    dot: 'bg-cyan-400' },
  PHILO: { bg: 'bg-pink-50',   text: 'text-pink-600',    dot: 'bg-pink-400' },
  ECO:   { bg: 'bg-teal-50',   text: 'text-teal-600',    dot: 'bg-teal-400' },
}

// Gradient de fond par matière quand pas de couverture
const MATIERE_GRADIENTS: Record<string, string> = {
  FR:    'from-orange-100 to-orange-50',
  MATH:  'from-blue-100 to-blue-50',
  PC:    'from-purple-100 to-purple-50',
  SVT:   'from-emerald-100 to-emerald-50',
  HG:    'from-amber-100 to-amber-50',
  EN:    'from-cyan-100 to-cyan-50',
  PHILO: 'from-pink-100 to-pink-50',
  ECO:   'from-teal-100 to-teal-50',
}

export default function BibliothequeClient({ userId, profile, livres }: Props) {
  const [search, setSearch] = useState('')
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [livreOuvert, setLivreOuvert] = useState<Livre | null>(null)

  const matieres = [...new Set(livres.map(l => l.matiere).filter(Boolean))]

  const livresFiltres = livres.filter(l => {
    if (search && !l.titre.toLowerCase().includes(search.toLowerCase()) &&
        !l.auteur?.toLowerCase().includes(search.toLowerCase())) return false
    if (filtreMatiere && l.matiere !== filtreMatiere) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bibliothèque</h1>
          <p className="text-sm text-gray-500 mt-0.5">Œuvres au programme officiel sénégalais</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-green" />
          <span>{livres.length} ressource{livres.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Titre, auteur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green text-sm transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtres matières */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setFiltreMatiere(null)}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0',
            !filtreMatiere
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
          )}
        >
          Tout voir
        </button>
        {matieres.map(m => {
          const colors = MATIERE_COLORS[m!] ?? { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
          const active = filtreMatiere === m
          return (
            <button
              key={m}
              onClick={() => setFiltreMatiere(active ? null : m!)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 flex items-center gap-1.5',
                active
                  ? `${colors.bg} ${colors.text} ring-1 ring-current/20`
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              )}
            >
              {active && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors.dot)} />}
              {MATIERE_LABELS[m!] ?? m}
            </button>
          )
        })}
      </div>

      {/* Grille livres */}
      {livresFiltres.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">Aucun livre trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Les ressources sont ajoutées progressivement</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
          {livresFiltres.map((livre, i) => {
            const matColors = MATIERE_COLORS[livre.matiere ?? ''] ?? { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-300' }
            const gradient = MATIERE_GRADIENTS[livre.matiere ?? ''] ?? 'from-gray-100 to-gray-50'

            return (
              <motion.div
                key={livre.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="group cursor-pointer"
                onClick={() => setLivreOuvert(livre)}
              >
                {/* Couverture livre — ratio 2:3 style poche */}
                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  {livre.couverture_url ? (
                    <img
                      src={livre.couverture_url}
                      alt={livre.titre}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  ) : (
                    <div className={cn('w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-4 text-center', gradient)}>
                      <BookOpen className={cn('w-10 h-10 mb-3 opacity-40', matColors.text)} />
                      <p className={cn('text-xs font-bold leading-tight opacity-60', matColors.text)}>
                        {livre.titre}
                      </p>
                    </div>
                  )}

                  {/* Badge matière */}
                  {livre.matiere && (
                    <div className="absolute top-2 left-2">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm', matColors.bg, matColors.text)}>
                        {MATIERE_LABELS[livre.matiere] ?? livre.matiere}
                      </span>
                    </div>
                  )}

                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-1.5 text-xs font-bold text-gray-900 shadow-lg">
                      Lire <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Infos sous la couverture */}
                <div className="mt-3 px-0.5">
                  <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-green transition-colors">
                    {livre.titre}
                  </h3>
                  {livre.auteur && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{livre.auteur}</p>
                  )}
                  {livre.pages && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-300" />
                      <span className="text-[10px] text-gray-400">{livre.pages} pages</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal lecteur PDF */}
      <AnimatePresence>
        {livreOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6"
            onClick={() => setLivreOuvert(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
                {/* Mini couverture */}
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                  {livreOuvert.couverture_url ? (
                    <img src={livreOuvert.couverture_url} alt="" className="w-full h-full object-contain bg-gray-50" />
                  ) : (
                    <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', MATIERE_GRADIENTS[livreOuvert.matiere ?? ''] ?? 'from-gray-100 to-gray-50')}>
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 truncate">{livreOuvert.titre}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {livreOuvert.auteur && (
                      <span className="text-xs text-gray-500">{livreOuvert.auteur}</span>
                    )}
                    {livreOuvert.pages && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400">{livreOuvert.pages} pages</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setLivreOuvert(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-50">
                <PDFViewer url={livreOuvert.pdf_url} titre={livreOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
