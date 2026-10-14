'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Image, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, X, GraduationCap, Briefcase, BookOpen, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Analyse {
  eleve: { nom: string | null; classe: string | null; etablissement: string | null }
  moyennes: {
    generale: number
    semestre: string
    matieres: { matiere: string; moyenne: number; coefficient: number }[]
  }
  analyse: {
    points_forts: string[]
    points_faibles: string[]
    appreciation_globale: string
  }
  orientation: {
    serie_recommandee: string
    serie_explication: string
    series_alternatives: string[]
    filieres_universitaires: { filiere: string; adequation: number; etablissements: string[] }[]
    metiers: { metier: string; description: string }[]
  }
  conseils: string[]
}

const SERIE_COLORS: Record<string, string> = {
  S1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  S2: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  L: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  G: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  STEG: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

function MoyenneBar({ matiere, moyenne, coefficient }: { matiere: string; moyenne: number; coefficient: number }) {
  const pct = Math.min((moyenne / 20) * 100, 100)
  const color = moyenne >= 14 ? 'bg-green-500' : moyenne >= 10 ? 'bg-blue-500' : moyenne >= 7 ? 'bg-orange-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 flex-shrink-0">
        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{matiere}</p>
        <p className="text-[10px] text-gray-400">Coef. {coefficient}</p>
      </div>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-xs font-bold w-10 text-right', moyenne >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>{moyenne.toFixed(1)}</span>
    </div>
  )
}

export default function BulletinAnalyse() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [showMatieres, setShowMatieres] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) {
      setError('Format non supporté. Utilisez PDF, JPG ou PNG.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10MB)')
      return
    }
    setFile(f)
    setError(null)
    setAnalyse(null)
  }

  const analyser = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('bulletin', file)
      const r = await fetch('/api/analyse-bulletin', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setAnalyse(data.analyse)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setAnalyse(null)
    setError(null)
  }

  return (
    <div className="space-y-5">
      {/* Zone upload */}
      {!analyse && (
        <div className="space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer',
              dragging ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                {file.type === 'application/pdf'
                  ? <FileText className="w-8 h-8 text-orange-500" />
                  : <Image className="w-8 h-8 text-orange-500" />
                }
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); reset() }} className="ml-2 p-1 hover:bg-red-100 rounded-lg">
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Dépose ton bulletin ici</p>
                <p className="text-xs text-gray-400">PDF, JPG ou PNG · max 10MB</p>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {file && (
            <button
              onClick={analyser}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Analyser mon bulletin
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Résultats */}
      {analyse && (
        <div className="space-y-4">
          {/* Header résultat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm font-bold text-gray-800 dark:text-white">Analyse terminée</p>
            </div>
            <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Analyser un autre bulletin
            </button>
          </div>

          {/* Infos élève */}
          {analyse.eleve.nom && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {analyse.eleve.nom} · {analyse.eleve.classe} · {analyse.eleve.etablissement}
            </div>
          )}

          {/* Moyenne générale */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wide">Moyenne générale</p>
              <p className="text-4xl font-black text-orange-600 dark:text-orange-400 mt-1">{analyse.moyennes.generale.toFixed(2)}<span className="text-lg font-normal text-orange-400">/20</span></p>
              <p className="text-xs text-gray-400 mt-1">{analyse.moyennes.semestre}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 dark:border-orange-800 flex items-center justify-center">
              {analyse.moyennes.generale >= 10
                ? <TrendingUp className="w-7 h-7 text-green-500" />
                : <TrendingDown className="w-7 h-7 text-red-400" />
              }
            </div>
          </div>

          {/* Matières */}
          {analyse.moyennes.matieres?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowMatieres(!showMatieres)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <span>📊 Notes par matière</span>
                {showMatieres ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showMatieres && (
                <div className="px-4 pb-4 space-y-3">
                  {analyse.moyennes.matieres.map((m, i) => (
                    <MoyenneBar key={i} {...m} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Points forts / faibles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Points forts
              </p>
              <ul className="space-y-1">
                {analyse.analyse.points_forts.map((p, i) => (
                  <li key={i} className="text-xs text-green-700 dark:text-green-300">✓ {p}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> À améliorer
              </p>
              <ul className="space-y-1">
                {analyse.analyse.points_faibles.map((p, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">× {p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Appréciation */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">💬 Appréciation</p>
            <p className="text-sm text-blue-800 dark:text-blue-300">{analyse.analyse.appreciation_globale}</p>
          </div>

          {/* Série recommandée */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Série recommandée</p>
            <div className="flex items-center gap-3">
              <span className={cn('text-2xl font-black px-4 py-2 rounded-xl', SERIE_COLORS[analyse.orientation.serie_recommandee] ?? 'bg-gray-100 text-gray-700')}>
                {analyse.orientation.serie_recommandee}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{analyse.orientation.serie_explication}</p>
            </div>
            {analyse.orientation.series_alternatives?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Alternatives :</span>
                {analyse.orientation.series_alternatives.map(s => (
                  <span key={s} className={cn('text-xs px-2 py-1 rounded-lg font-semibold', SERIE_COLORS[s] ?? 'bg-gray-100 text-gray-600')}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Filières universitaires */}
          {analyse.orientation.filieres_universitaires?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Filières universitaires
              </p>
              {analyse.orientation.filieres_universitaires.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{f.filiere}</p>
                    <span className={cn('text-xs font-bold', f.adequation >= 75 ? 'text-green-600' : f.adequation >= 50 ? 'text-orange-500' : 'text-gray-400')}>
                      {f.adequation}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', f.adequation >= 75 ? 'bg-green-500' : f.adequation >= 50 ? 'bg-orange-400' : 'bg-gray-300')}
                      style={{ width: `${f.adequation}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{f.etablissements.join(', ')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Métiers */}
          {analyse.orientation.metiers?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Débouchés professionnels
              </p>
              <div className="grid grid-cols-1 gap-2">
                {analyse.orientation.metiers.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{m.metier}</p>
                      <p className="text-xs text-gray-400">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseils */}
          {analyse.conseils?.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">💡 Conseils personnalisés</p>
              <ul className="space-y-2">
                {analyse.conseils.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
