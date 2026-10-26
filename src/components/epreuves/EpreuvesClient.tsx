'use client'

import { useState, useEffect } from 'react'
import { Search, X, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import PDFViewer from '@/components/ui/PDFViewer'

interface Epreuve {
  id: string
  titre: string
  matiere: string
  classe: string
  semestre: string | null
  type: 'bac' | 'bfem' | 'exercice' | 'devoir' | 'corrige'
  annee: number | null
  pdf_url: string
  tour?: 1 | 2  // 1er tour ou 2ème tour
}

interface Props {
  userId: string
  profile: Profile | null
  epreuves: Epreuve[]
}

// Ordre officiel des matières au BAC/BFEM sénégalais
const MATIERES_ORDER: Record<string, number> = {
  MATH:  1,
  PC:    2,
  SVT:   3,
  FR:    4,
  PHILO: 5,
  HG:    6,
  EN:    7,
  ECO:   8,
  AUTRE: 99,
}

const MATIERES_LABELS: Record<string, string> = {
  MATH:  'Mathématiques',
  PC:    'Physique-Chimie',
  SVT:   'SVT',
  FR:    'Français',
  HG:    'Histoire-Géographie',
  EN:    'Anglais',
  PHILO: 'Philosophie',
  ECO:   'Économie',
  AUTRE: 'Autres matières',
}

// Couleur badge par matière
const MATIERES_COLORS: Record<string, string> = {
  MATH:  'bg-blue-50 text-blue-700',
  PC:    'bg-purple-50 text-purple-700',
  SVT:   'bg-green-50 text-green-700',
  FR:    'bg-orange-50 text-orange-700',
  PHILO: 'bg-pink-50 text-pink-700',
  HG:    'bg-amber-50 text-amber-700',
  EN:    'bg-cyan-50 text-cyan-700',
  ECO:   'bg-emerald-50 text-emerald-700',
  AUTRE: 'bg-gray-100 text-gray-600',
}

function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM', annee: 2027, date: '2027-06-10T08:00:00' }
    : { nom: 'BAC',  annee: 2027, date: '2027-06-17T08:00:00' }

  const [sec, setSec] = useState(() =>
    Math.max(0, Math.floor((new Date(examen.date).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    if (sec <= 0) return
    const t = setInterval(() => {
      setSec(Math.max(0, Math.floor((new Date(examen.date).getTime() - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(t)
  }, [examen.date])

  if (sec <= 0) {
    return (
      <div className="gradient-green rounded-2xl p-5 text-white text-center">
        <p className="font-bold text-lg">{examen.nom} {examen.annee} — Session terminée</p>
        <p className="text-white/70 text-sm mt-1">Retrouvez les sujets et corrigés ci-dessous</p>
      </div>
    )
  }

  const jours   = Math.floor(sec / 86400)
  const mois    = Math.floor(jours / 30)
  const heures  = Math.floor((sec % 86400) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const secs    = sec % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f5c34] to-[#1a7a4a] p-5 text-white shadow-lg">
      {/* Cercle décoratif fond */}
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between gap-4">
        {/* Gauche : label */}
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest font-medium">
            Compte à rebours
          </p>
          <p className="text-white font-bold text-lg mt-0.5">
            {examen.nom} <span className="text-white/70">{examen.annee}</span>
          </p>
          {/* hh:mm:ss en petit en dessous */}
          <p className="font-mono text-white/50 text-xs mt-1 tracking-widest">
            {pad(heures)}:{pad(minutes)}:{pad(secs)}
          </p>
        </div>

        {/* Droite : chiffre principal */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="font-mono font-black text-5xl leading-none tracking-tight">
              {jours}
            </span>
            <span className="text-white/70 font-semibold text-base">J</span>
          </div>
          {mois > 0 && (
            <p className="text-white/50 text-xs font-mono mt-0.5 text-right">
              ~{mois} mois
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch] = useState('')
  const [filtreType, setFiltreType] = useState<'bac' | 'corrige' | null>(null)
  const [anneesOuvertes, setAnneesOuvertes] = useState<Record<string, boolean>>({ '2026-1': true })
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? '3eme'

  // Grouper par année + tour + matière
  // clé : `${annee}-${tour}` ex: "2026-1", "2026-2", "2025-1"
  const grouped: Record<string, Record<string, { sujet?: Epreuve; corrige?: Epreuve }>> = {}

  epreuves.forEach(e => {
    const annee = e.annee ?? 0
    const tour = e.tour ?? 1   // par défaut 1er tour si non renseigné
    const key = `${annee}-${tour}`
    const matiere = e.matiere ?? 'AUTRE'

    if (!grouped[key]) grouped[key] = {}
    if (!grouped[key][matiere]) grouped[key][matiere] = {}

    if (e.type === 'corrige') {
      grouped[key][matiere].corrige = e
    } else {
      grouped[key][matiere].sujet = e
    }
  })

  // Trier : années décroissantes, 1er tour avant 2ème tour
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const [anneeA, tourA] = a.split('-').map(Number)
    const [anneeB, tourB] = b.split('-').map(Number)
    if (anneeB !== anneeA) return anneeB - anneeA
    return tourA - tourB
  })

  const toggleGroupe = (key: string) => {
    setAnneesOuvertes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const matiereMatchSearch = (matiere: string) => {
    if (!search) return true
    const label = MATIERES_LABELS[matiere] ?? matiere
    return label.toLowerCase().includes(search.toLowerCase())
  }

  // Trier les matières selon l'ordre officiel
  const sortMatieres = (matieres: string[]) =>
    [...matieres].sort((a, b) => (MATIERES_ORDER[a] ?? 99) - (MATIERES_ORDER[b] ?? 99))

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

      {/* Contenu groupé par année + tour */}
      <div className="space-y-4">
        {groupKeys.map(key => {
          const [annee, tour] = key.split('-').map(Number)
          const matieresBrutes = Object.keys(grouped[key]).filter(matiereMatchSearch)
          const matieresDuGroupe = sortMatieres(matieresBrutes)
          if (matieresDuGroupe.length === 0) return null
          const isOpen = anneesOuvertes[key] ?? false

          const labelTour = tour === 2 ? '2ème tour' : '1er tour'
          const colorTour = tour === 2
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-green-light text-green'

          return (
            <div key={key} className="bg-white rounded-2xl card-shadow overflow-hidden">

              {/* Header groupe */}
              <button
                onClick={() => toggleGroupe(key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-gray-900 text-base">
                    {classe === '3eme' ? 'BFEM' : 'BAC'} {annee}
                  </span>
                  {/* Badge 1er/2ème tour */}
                  <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold', colorTour)}>
                    {labelTour}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {matieresDuGroupe.length} matières
                  </span>
                </div>
                {isOpen
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
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

                      {/* Lignes matières — triées dans l'ordre officiel */}
                      {matieresDuGroupe.map((matiere, i) => {
                        const { sujet, corrige } = grouped[key][matiere]
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
                            {/* Badge matière coloré */}
                            <span className={cn(
                              'text-xs font-semibold px-2.5 py-1 rounded-lg w-fit',
                              MATIERES_COLORS[matiere] ?? 'bg-gray-100 text-gray-600'
                            )}>
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
                    {pdfOuvert.tour === 2 ? ' · 2ème tour' : ' · 1er tour'}
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
                <PDFViewer url={pdfOuvert.pdf_url} titre={pdfOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
