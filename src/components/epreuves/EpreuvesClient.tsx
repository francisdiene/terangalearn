'use client'

import { useState, useEffect } from 'react'
import { Search, X, BookOpen, CheckSquare, ChevronDown, FileText, Sparkles } from 'lucide-react'
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

const MATIERES_ORDER: Record<string, number> = {
  MATH: 1, PC: 2, SVT: 3, FR: 4, PHILO: 5, HG: 6, EN: 7, ECO: 8, AUTRE: 99,
}

const MATIERES_LABELS: Record<string, string> = {
  MATH: 'Mathématiques', PC: 'Physique-Chimie', SVT: 'SVT',
  FR: 'Français', HG: 'Histoire-Géo', EN: 'Anglais',
  PHILO: 'Philosophie', ECO: 'Économie', AUTRE: 'Autres',
}

const MATIERES_STYLE: Record<string, { icon: string; color: string; light: string; ring: string }> = {
  MATH:  { icon: '∑',  color: 'text-blue-600',    light: 'bg-blue-50',    ring: 'ring-blue-200' },
  PC:    { icon: '⚛',  color: 'text-purple-600',  light: 'bg-purple-50',  ring: 'ring-purple-200' },
  SVT:   { icon: '🌿', color: 'text-emerald-600', light: 'bg-emerald-50', ring: 'ring-emerald-200' },
  FR:    { icon: 'A',  color: 'text-orange-600',  light: 'bg-orange-50',  ring: 'ring-orange-200' },
  PHILO: { icon: '?',  color: 'text-pink-600',    light: 'bg-pink-50',    ring: 'ring-pink-200' },
  HG:    { icon: '🗺',  color: 'text-amber-600',   light: 'bg-amber-50',   ring: 'ring-amber-200' },
  EN:    { icon: 'E',  color: 'text-cyan-600',    light: 'bg-cyan-50',    ring: 'ring-cyan-200' },
  ECO:   { icon: '€',  color: 'text-teal-600',    light: 'bg-teal-50',    ring: 'ring-teal-200' },
  AUTRE: { icon: '·',  color: 'text-gray-500',    light: 'bg-gray-50',    ring: 'ring-gray-200' },
}

// ─── Compte à rebours ──────────────────────────────────────────────────────────
function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM', annee: 2027, date: '2027-06-10T08:00:00' }
    : { nom: 'BAC',  annee: 2027, date: '2027-06-17T08:00:00' }

  const [sec, setSec] = useState(() =>
    Math.max(0, Math.floor((new Date(examen.date).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    if (sec <= 0) return
    const t = setInterval(() =>
      setSec(Math.max(0, Math.floor((new Date(examen.date).getTime() - Date.now()) / 1000)))
    , 1000)
    return () => clearInterval(t)
  }, [examen.date])

  const jours   = Math.floor(sec / 86400)
  const mois    = Math.floor(jours / 30)
  const heures  = Math.floor((sec % 86400) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const secs    = sec % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  if (sec <= 0) return (
    <div className="gradient-green rounded-2xl p-5 text-white text-center">
      <p className="font-bold text-lg">{examen.nom} {examen.annee} — Session terminée</p>
      <p className="text-white/70 text-sm mt-1">Retrouvez les sujets et corrigés ci-dessous</p>
    </div>
  )

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a3d22] to-[#166534] p-5 text-white shadow-lg">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-white/50 text-[11px] uppercase tracking-[0.15em] font-semibold">Compte à rebours</p>
          <p className="text-white font-bold text-xl mt-1">
            {examen.nom} <span className="text-white/60 font-normal">{examen.annee}</span>
          </p>
          <p className="font-mono text-white/40 text-xs mt-2 tracking-widest">
            {pad(heures)}:{pad(minutes)}:{pad(secs)}
          </p>
          {mois > 0 && (
            <p className="text-white/40 text-[11px] mt-1">~{mois} mois restants</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="font-mono font-black text-6xl leading-none tracking-tight tabular-nums">
              {jours}
            </span>
          </div>
          <p className="text-white/50 text-sm font-semibold mt-1">jours</p>
        </div>
      </div>
    </div>
  )
}

// ─── Card matière ─────────────────────────────────────────────────────────────
type Entry = { annee: number; tour: number; serie: string | null; sujet?: Epreuve; corrige?: Epreuve }

interface MatiereCardProps {
  matiere: string
  annees: Entry[]
  onOpen: (e: Epreuve) => void
  filtreSujet: boolean
  filtreCorrige: boolean
}

function MatiereCard({ matiere, annees, onOpen, filtreSujet, filtreCorrige }: MatiereCardProps) {
  const [expanded, setExpanded] = useState(false)
  const style = MATIERES_STYLE[matiere] ?? MATIERES_STYLE.AUTRE
  const label = MATIERES_LABELS[matiere] ?? matiere

  const totalSujets   = annees.filter(a => a.sujet).length
  const totalCorrigés = annees.filter(a => a.corrige).length

  const sortedAnnees = [...annees].sort((a, b) =>
    b.annee !== a.annee ? b.annee - a.annee : a.tour - b.tour
  )

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left"
      >
        <div className="p-4 flex items-center gap-3">
          {/* Icône matière */}
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ring-1', style.light, style.color, style.ring)}>
            {style.icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm leading-tight">{label}</p>
            {/* Compteurs */}
            <div className="flex items-center gap-2 mt-1.5">
              {totalSujets > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <BookOpen className="w-3 h-3" />
                  {totalSujets} sujet{totalSujets > 1 ? 's' : ''}
                </span>
              )}
              {totalCorrigés > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <CheckSquare className="w-3 h-3" />
                  {totalCorrigés} corrigé{totalCorrigés > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Années */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-50 divide-y divide-gray-50">
              {sortedAnnees.map(a => {
                const tourLabel  = a.tour === 2 ? ' · 2ème' : ''
                const serieLabel = a.serie ? ` · ${a.serie}` : ''
                const showSujet   = (!filtreSujet && !filtreCorrige) || filtreSujet
                const showCorrige = (!filtreSujet && !filtreCorrige) || filtreCorrige

                return (
                  <div key={`${a.annee}-${a.tour}-${a.serie ?? ''}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-700 tabular-nums">
                      {a.annee}
                      <span className="font-normal text-gray-400">{tourLabel}{serieLabel}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {showSujet && (
                        a.sujet ? (
                          <button
                            onClick={() => onOpen(a.sujet!)}
                            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                          >
                            <FileText className="w-3 h-3" />
                            Sujet
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 w-16 text-center">—</span>
                        )
                      )}
                      {showCorrige && (
                        a.corrige ? (
                          <button
                            onClick={() => onOpen(a.corrige!)}
                            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Corrigé
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 w-16 text-center">—</span>
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
    </motion.div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function EpreuvesClient({ userId, profile, epreuves }: Props) {
  const [search, setSearch]           = useState('')
  const [filtreAnnee, setFiltreAnnee] = useState<number | null>(null)
  const [filtreSerie, setFiltreSerie] = useState<string | null>(null)
  const [filtreSujet, setFiltreSujet]     = useState(false)
  const [filtreCorrige, setFiltreCorrige] = useState(false)
  const [pdfOuvert, setPdfOuvert]     = useState<Epreuve | null>(null)

  const classe = profile?.classe ?? 'terminale'

  // Index matiere → (annee, tour, serie) → Entry
  const matiereMap: Record<string, Record<string, Entry>> = {}
  epreuves.forEach(e => {
    const matiere  = e.matiere ?? 'AUTRE'
    const annee    = e.annee ?? 0
    const tour     = e.tour ?? 1
    const serie    = e.serie ?? null
    const key      = `${annee}-${tour}-${serie ?? ''}`
    if (!matiereMap[matiere]) matiereMap[matiere] = {}
    if (!matiereMap[matiere][key]) matiereMap[matiere][key] = { annee, tour, serie }
    if (e.type === 'corrige') matiereMap[matiere][key].corrige = e
    else                      matiereMap[matiere][key].sujet   = e
  })

  const anneesDispos = [...new Set(epreuves.map(e => e.annee).filter(Boolean) as number[])].sort((a, b) => b - a)
  const seriesDispos = [...new Set(epreuves.map(e => e.serie).filter(Boolean) as string[])].sort()

  const matieresFiltrees = Object.keys(matiereMap)
    .filter(m => {
      if (search && !(MATIERES_LABELS[m] ?? m).toLowerCase().includes(search.toLowerCase())) return false
      const entries = Object.values(matiereMap[m])
      if (filtreAnnee !== null && !entries.some(e => e.annee === filtreAnnee)) return false
      if (filtreSerie !== null && !entries.some(e => e.serie === filtreSerie)) return false
      return true
    })
    .sort((a, b) => (MATIERES_ORDER[a] ?? 99) - (MATIERES_ORDER[b] ?? 99))

  const getEntries = (m: string): Entry[] =>
    Object.values(matiereMap[m]).filter(e => {
      if (filtreAnnee !== null && e.annee !== filtreAnnee) return false
      if (filtreSerie !== null && e.serie !== filtreSerie) return false
      return true
    })

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Épreuves {classe === '3eme' ? 'BFEM' : 'BAC'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Sujets et corrigés des années précédentes</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-green" />
          <span>{epreuves.length} documents</span>
        </div>
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
          className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green text-sm transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="space-y-2">
        {/* Années */}
        {anneesDispos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <button
              onClick={() => setFiltreAnnee(null)}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition',
                filtreAnnee === null ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              )}
            >
              Toutes années
            </button>
            {anneesDispos.map(a => (
              <button key={a}
                onClick={() => setFiltreAnnee(filtreAnnee === a ? null : a)}
                className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition tabular-nums',
                  filtreAnnee === a ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                )}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {/* Séries */}
        {seriesDispos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <button
              onClick={() => setFiltreSerie(null)}
              className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition',
                filtreSerie === null ? 'bg-green text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              )}
            >
              Toutes séries
            </button>
            {seriesDispos.map(s => (
              <button key={s}
                onClick={() => setFiltreSerie(filtreSerie === s ? null : s)}
                className={cn('px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition',
                  filtreSerie === s ? 'bg-green text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                )}
              >
                Série {s}
              </button>
            ))}
          </div>
        )}

        {/* Sujet / Corrigé */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltreSujet(v => !v)}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition',
              filtreSujet ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            )}
          >
            <BookOpen className="w-3 h-3" /> Sujets
          </button>
          <button
            onClick={() => setFiltreCorrige(v => !v)}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition',
              filtreCorrige ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            )}
          >
            <CheckSquare className="w-3 h-3" /> Corrigés
          </button>
        </div>
      </div>

      {/* Liste matières */}
      {matieresFiltrees.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">Aucune matière trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Essaie d'autres filtres</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          {matieresFiltrees.map((m, i) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MatiereCard
                matiere={m}
                annees={getEntries(m)}
                onOpen={setPdfOuvert}
                filtreSujet={filtreSujet}
                filtreCorrige={filtreCorrige}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal PDF */}
      <AnimatePresence>
        {pdfOuvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6"
            onClick={() => setPdfOuvert(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                {/* Badge type */}
                <span className={cn(
                  'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0',
                  pdfOuvert.type === 'corrige' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                )}>
                  {pdfOuvert.type === 'corrige'
                    ? <><CheckSquare className="w-3.5 h-3.5" /> Corrigé</>
                    : <><FileText className="w-3.5 h-3.5" /> Sujet</>
                  }
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{pdfOuvert.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {MATIERES_LABELS[pdfOuvert.matiere] ?? pdfOuvert.matiere}
                    {pdfOuvert.annee && ` · ${pdfOuvert.annee}`}
                    {pdfOuvert.tour === 2 && ' · 2ème tour'}
                    {pdfOuvert.serie && ` · Série ${pdfOuvert.serie}`}
                  </p>
                </div>

                <button
                  onClick={() => setPdfOuvert(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-50">
                <PDFViewer url={pdfOuvert.pdf_url} titre={pdfOuvert.titre} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
