'use client'

import { useState } from 'react'
import { BookOpen, Search, Eye, X } from 'lucide-react'
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
  MATH: ' Maths', PC: ' Physique-Chimie', SVT: ' SVT',
  FR: ' Français', HG: ' Histoire-Géo', EN: ' Anglais',
  PHILO: ' Philo', ECO: ' Économie'
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bibliothèque </h1>
        <p className="text-gray-500 mt-1">Œuvres au programme et ressources pédagogiques</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un livre ou un auteur..."
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltreMatiere(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
            !filtreMatiere ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
          )}
        >
          Tous
        </button>
        {matieres.map(m => (
          <button
            key={m}
            onClick={() => setFiltreMatiere(filtreMatiere === m ? null : m!)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
              filtreMatiere === m ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            {MATIERE_LABELS[m!] ?? m}
          </button>
        ))}
      </div>

      <div className="bg-green-light rounded-2xl p-4 flex items-center gap-4">
        <BookOpen className="w-8 h-8 text-green flex-shrink-0" />
        <div>
          <p className="font-bold text-green">
            {livresFiltres.length} ressource{livresFiltres.length > 1 ? 's' : ''} disponible{livresFiltres.length > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-green/70">Programme officiel sénégalais</p>
        </div>
      </div>

      {livresFiltres.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Aucun livre trouvé</p>
          <p className="text-sm mt-1">Les ressources seront ajoutées progressivement</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {livresFiltres.map((livre, i) => (
            <motion.div
              key={livre.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden card-shadow hover-lift cursor-pointer group"
              onClick={() => setLivreOuvert(livre)}
            >
              <div className="h-40 bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center relative overflow-hidden">
                {livre.couverture_url ? (
                  <img
                    src={livre.couverture_url}
                    alt={livre.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <BookOpen className="w-12 h-12 text-green/40 mx-auto mb-2" />
                    <span className="text-xs text-green/60 font-medium">
                      {livre.matiere ? MATIERE_LABELS[livre.matiere] : 'Œuvre'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
                  {livre.titre}
                </h3>
                {livre.auteur && (
                  <p className="text-xs text-gray-500 mt-1">{livre.auteur}</p>
                )}
                {livre.pages && (
                  <p className="text-xs text-gray-400 mt-1">{livre.pages} pages</p>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setLivreOuvert(livre) }}
                  className="w-full mt-3 py-1.5 bg-green-light text-green rounded-lg text-xs font-semibold hover:bg-green hover:text-white transition"
                >
                  Lire
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {livreOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setLivreOuvert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">{livreOuvert.titre}</h3>
                  {livreOuvert.auteur && (
                    <p className="text-xs text-gray-500">{livreOuvert.auteur}</p>
                  )}
                </div>
                <button
                  onClick={() => setLivreOuvert(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PDFViewer url={livreOuvert.pdf_url} titre={livreOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}