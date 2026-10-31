'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { Search, X, Eye, ChevronDown, ChevronUp, BookOpen, CheckSquare } from 'lucide-react'
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
  tour?: 1 | 2
  serie?: string | null
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
  HG:    'Histoire-Géo',
  EN:    'Anglais',
  PHILO: 'Philosophie',
  ECO:   'Économie',
  AUTRE: 'Autres',
}

const MATIERES_ABBR: Record<string, string> = {
  MATH:  'MA',
  PC:    'PC',
  SVT:   'SV',
  FR:    'FR',
  HG:    'HG',
  EN:    'EN',
  PHILO: 'PH',
  ECO:   'EC',
  AUTRE: '??',
}

// Couleurs par matière — fond card + texte abbr + accent
const MATIERES_CARD: Record<string, { bg: string; badge: string; accent: string }> = {
  MATH:  { bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700',    accent: 'text-blue-600' },
  PC:    { bg: 'bg-purple-50',  badge: 'bg-purple-100 text-purple-700',accent: 'text-purple-600' },
  SVT:   { bg: 'bg-green-50',   badge: 'bg-green-100 text-green-700',  accent: 'text-green-600' },
  FR:    { bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700',accent: 'text-orange-600' },
  PHILO: { bg: 'bg-pink-50',    badge: 'bg-pink-100 text-pink-700',    accent: 'text-pink-600' },
  HG:    { bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700',  accent: 'text-amber-600' },
  EN:    { bg: 'bg-cyan-50',    badge: 'bg-cyan-100 text-cyan-700',    accent: 'text-cyan-600' },
  ECO:   { bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-600' },
  AUTRE: { bg: 'bg-gray-50',    badge: 'bg-gray-100 text-gray-600',    accent: 'text-gray-500' },
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
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Compte à rebours</p>
          <p className="text-white font-bold text-lg mt-0.5">
            {examen.nom} <span className="text-white/70">{examen.annee}</span>
          </p>
          <p className="font-mono text-white/50 text-xs mt-1 tracking-widest">
            {pad(heures)}:{pad(minutes)}:{pad(secs)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="font-mono font-black text-5xl leading-none tracking-tight">{jours}</span>
            <span className="text-white/70 font-semibold text-base">J</span>
          </div>
          {mois > 0 && (
            <p className="text-white/50 text-xs font-mono mt-0.5 text-right">~{mois} mois</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Carte matière ─────────────────────────────────────────────────────────────

interface MatiereCardProps {
  matiere: string
  annees: {
    annee: number
    tour: number
    serie: string | null
    sujet?: Epreuve
    corrige?: Epreuve
  }[]
  onOpen: (e: Epreuve) => void
  filtreSujet: boolean
  filtreCorrige: boolean
}

function MatiereCard({ matiere, annees, onOpen, filtreSujet, filtreCorrige }: MatiereCardProps) {
  const [expanded, setExpanded] = useState(false)
  const colors = MATIERES_CARD[matiere] ?? MATIERES_CARD.AUTRE
  const abbr = MATIERES_ABBR[matiere] ?? '??'
  const label = MATIERES_LABELS[matiere] ?? matiere

  const hasSujet  = annees.some(a => a.sujet)
  const hasCorrige = annees.some(a => a.corrige)

  // Trier les années décroissantes, puis par tour
  const sortedAnnees = [...annees].sort((a, b) => {
    if (b.annee !== a.annee) return b.annee - a.annee
    return a.tour - b.tour
  })

  return (
    <div className={cn('rounded-2xl overflow-hidden card-shadow transition-all', colors.bg)}>
      {/* En-tête card */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-4 flex flex-col gap-3 hover:brightness-95 transition"
      >
        {/* Badge abbr + label */}
        <div className="flex items-center gap-3">
          <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0', colors.badge)}>
            {abbr}
          </span>
          <span className="font-bold text-gray-900 text-sm leading-tight text-left">{label}</span>
        </div>

        {/* Boutons Sujet / Corrigé */}
        <div className="flex gap-2">
          <span className={cn(
            'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium flex-1 justify-center',
            hasSujet ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
          )}>
            <BookOpen className="w-3 h-3" />
            Sujet
          </span>
          <span className={cn(
            'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium flex-1 justify-center',
            hasCorrige ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
          )}>
            <CheckSquare className="w-3 h-3" />
            Corrigé
          </span>
        </div>

        {/* Expand indicator */}
        <div className={cn('flex items-center justify-center gap-1 text-xs font-medium', colors.accent)}>
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" /> Masquer</>
            : <><ChevronDown className="w-3.5 h-3.5" /> Voir par année</>
          }
        </div>
      </button>

      {/* Liste années */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/60">
              {sortedAnnees.map((a, i) => {
                const tourLabel = a.tour === 2 ? ' · 2ème' : ''
                const serieLabel = a.serie ? ` · ${a.serie}` : ''
                const showSujet   = (!filtreSujet && !filtreCorrige) || filtreSujet
                const showCorrige = (!filtreSujet && !filtreCorrige) || filtreCorrige

                return (
                  <div
                    key={`${a.annee}-${a.tour}-${a.serie ?? ''}`}
                    className={cn(
                      'flex items-center justify-between px-4 py-2.5 gap-2',
                      i % 2 === 0 ? 'bg-white/40' : 'bg-white/20',
                      'border-b border-white/30 last:border-0'
                    )}
                  >
                    <span className="text-xs font-semibold text-gray-700 shrink-0">
                      {a.annee}{tourLabel}{serieLabel}
                    </span>
                    <div className="flex gap-1.5">
                      {showSujet && (
                        a.sujet ? (
                          <button
                            onClick={() => onOpen(a.sujet!)}
                            className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-green-700 transition"
                          >
                            Sujet
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 px-2.5 py-1">—</span>
                        )
                      )}
                      {showCorrige && (
                        a.corrige ? (
                          <button
                            onClick={() => onOpen(a.corrige!)}
                            className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-blue-700 transition"
                          >
                            Corrigé
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 px-2.5 py-1">—</span>
                        )
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
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch]       = useState('')
  const [filtreAnnee, setFiltreAnnee] = useState<number | null>(null)
  const [filtreSerie, setFiltreSerie] = useState<string | null>(null)
  const [filtreSujet, setFiltreSujet]   = useState(false)
  const [filtreCorrige, setFiltreCorrige] = useState(false)
  const [pdfOuvert, setPdfOuvert] = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? 'terminale'

  // ── Construire index : matiere → list d'entrées (annee, tour, serie, sujet, corrige)
  // Clé unique par (matiere, annee, tour, serie)
  type Entry = { annee: number; tour: number; serie: string | null; sujet?: Epreuve; corrige?: Epreuve }
  const matiereMap: Record<string, Record<string, Entry>> = {}

  epreuves.forEach(e => {
    const matiere = e.matiere ?? 'AUTRE'
    const annee   = e.annee ?? 0
    const tour    = e.tour ?? 1
    const serie   = e.serie ?? null
    const entryKey = `${annee}-${tour}-${serie ?? ''}`

    if (!matiereMap[matiere]) matiereMap[matiere] = {}
    if (!matiereMap[matiere][entryKey]) matiereMap[matiere][entryKey] = { annee, tour, serie }

    if (e.type === 'corrige') {
      matiereMap[matiere][entryKey].corrige = e
    } else {
      matiereMap[matiere][entryKey].sujet = e
    }
  })

  // ── Listes de filtres disponibles
  const anneesDispos = Array.from(
    new Set(epreuves.map(e => e.annee).filter(Boolean) as number[])
  ).sort((a, b) => b - a)

  const seriesDispos = Array.from(
    new Set(epreuves.map(e => e.serie).filter(Boolean) as string[])
  ).sort()

  // ── Filtrer les matières
  const matieresFiltrees = Object.keys(matiereMap)
    .filter(m => {
      // Filtre recherche
      if (search) {
        const label = MATIERES_LABELS[m] ?? m
        if (!label.toLowerCase().includes(search.toLowerCase())) return false
      }
      // Filtre année
      if (filtreAnnee !== null) {
        const entries = Object.values(matiereMap[m])
        if (!entries.some(e => e.annee === filtreAnnee)) return false
      }
      // Filtre série
      if (filtreSerie !== null) {
        const entries = Object.values(matiereMap[m])
        if (!entries.some(e => e.serie === filtreSerie)) return false
      }
      return true
    })
    .sort((a, b) => (MATIERES_ORDER[a] ?? 99) - (MATIERES_ORDER[b] ?? 99))

  // Pour chaque matière, filtrer les entrées selon les filtres actifs
  const getEntriesPourMatiere = (matiere: string): Entry[] => {
    return Object.values(matiereMap[matiere]).filter(entry => {
      if (filtreAnnee !== null && entry.annee !== filtreAnnee) return false
      if (filtreSerie !== null && entry.serie !== filtreSerie) return false
      return true
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Sujets {classe === '3eme' ? 'BFEM' : 'BAC'} — Années précédentes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {epreuves.length} documents disponibles
        </p>
      </div>

      <ExamenCountdown classe={classe} />

      {/* Barre de recherche */}
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

      {/* Filtres */}
      <div className="space-y-2">
        {/* Filtre Année */}
        {anneesDispos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltreAnnee(null)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium transition',
                filtreAnnee === null ? 'bg-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Toutes années
            </button>
            {anneesDispos.map(a => (
              <button
                key={a}
                onClick={() => setFiltreAnnee(filtreAnnee === a ? null : a)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium transition',
                  filtreAnnee === a ? 'bg-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {/* Filtre Série */}
        {seriesDispos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltreSerie(null)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium transition',
                filtreSerie === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Toutes séries
            </button>
            {seriesDispos.map(s => (
              <button
                key={s}
                onClick={() => setFiltreSerie(filtreSerie === s ? null : s)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium transition',
                  filtreSerie === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Filtre Sujet / Corrigé */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltreSujet(v => !v)}
            className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition',
              filtreSujet ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <BookOpen className="w-3 h-3" />
            Sujets
          </button>
          <button
            onClick={() => setFiltreCorrige(v => !v)}
            className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition',
              filtreCorrige ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <CheckSquare className="w-3 h-3" />
            Corrigés
          </button>
        </div>
      </div>

      {/* Grille matières */}
      {matieresFiltrees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-medium">Aucune matière trouvée</p>
          <p className="text-sm mt-1">Essaie d'autres filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {matieresFiltrees.map(matiere => (
            <MatiereCard
              key={matiere}
              matiere={matiere}
              annees={getEntriesPourMatiere(matiere)}
              onOpen={setPdfOuvert}
              filtreSujet={filtreSujet}
              filtreCorrige={filtreCorrige}
            />
          ))}
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
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-bold text-gray-900 text-sm truncate">{pdfOuvert.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {MATIERES_LABELS[pdfOuvert.matiere] ?? pdfOuvert.matiere} — {pdfOuvert.annee}
                    {pdfOuvert.tour === 2 ? ' · 2ème tour' : ''}
                    {pdfOuvert.serie ? ` · ${pdfOuvert.serie}` : ''}
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
