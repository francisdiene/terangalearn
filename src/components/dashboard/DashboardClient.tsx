'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp, Play, Zap, Award, Clock,
  Target, ChevronRight, Flame, BookOpen,
  BarChart2, ArrowRight, FileText, CheckSquare, Star
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ value, color = '#16a34a' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function greetMsg(prenom: string, streak: number, xp: number): string {
  if (streak >= 7) return `${streak} jours d'affilée`
  if (xp === 0) return `Bienvenue ${prenom} !`
  const h = new Date().getHours()
  if (h < 12) return `Bonjour ${prenom}`
  if (h < 18) return `Bonne continuation ${prenom} !`
  return `Bonsoir ${prenom}`
}

function relTime(d: string): string {
  if (!d) return 'Récemment'
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins || 1} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  return days === 1 ? 'Hier' : `${days}j`
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SERIE_CONFIG: Record<string, { label: string; color: string; matieres: string[]; targetNote: number }> = {
  S:  { label: 'Série S',  color: '#16a34a', matieres: ['MATH', 'PC', 'SVT', 'FR'],    targetNote: 14 },
  L:  { label: 'Série L',  color: '#7c3aed', matieres: ['FR', 'PHILO', 'HG', 'ANG'],   targetNote: 13 },
  G:  { label: 'Série G',  color: '#ea580c', matieres: ['ECO', 'MATH', 'HG', 'FR'],    targetNote: 12 },
  T:  { label: 'Série T',  color: '#0891b2', matieres: ['MATH', 'PC', 'ECO', 'FR'],    targetNote: 13 },
  S1: { label: 'Série S1', color: '#16a34a', matieres: ['MATH', 'PC', 'SVT', 'FR'],    targetNote: 14 },
  S2: { label: 'Série S2', color: '#059669', matieres: ['MATH', 'SVT', 'PC', 'FR'],    targetNote: 14 },
}

const MATIERE_CFG: Record<string, { color: string; nom: string }> = {
  MATH:  { color: '#3b82f6', nom: 'Mathématiques' },
  PC:    { color: '#f97316', nom: 'Physique-Chimie' },
  SVT:   { color: '#16a34a', nom: 'SVT' },
  FR:    { color: '#7c3aed', nom: 'Français' },
  HG:    { color: '#ca8a04', nom: 'Hist-Géo' },
  ANG:   { color: '#ec4899', nom: 'Anglais' },
  PHILO: { color: '#6366f1', nom: 'Philosophie' },
  ECO:   { color: '#0891b2', nom: 'Économie' },
}

function matStyle(code: string) {
  return MATIERE_CFG[code?.toUpperCase()] ?? { color: '#6b7280', nom: 'Matière' }
}

const CLASSE_LABEL: Record<string, string> = {
  '3eme': '3ème', seconde: 'Seconde', premiere: 'Première', terminale: 'Terminale'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  profile: any; matieres: any[]; progressions: any[]
  examens: any[]; badges: any[]
  objectifsJour: { examens: number; cours: number }
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function DashboardClient({ profile, matieres, progressions, examens, badges, objectifsJour }: Props) {
  const [tab, setTab] = useState<'today' | 'matieres'>('today')

  const prenom  = profile?.full_name?.split(' ')[0] ?? 'Élève'
  const xp      = profile?.xp ?? 0
  const niveau  = profile?.niveau ?? 1
  const streak  = profile?.streak ?? 0
  const serie   = (profile?.serie ?? 'S1').toUpperCase()
  const classe  = profile?.classe ?? 'terminale'
  const sc      = SERIE_CONFIG[serie] ?? SERIE_CONFIG['S1']
  const clLabel = CLASSE_LABEL[classe] ?? 'Terminale'

  const xpCap  = niveau * 200
  const xpPct  = Math.min(Math.round((xp % xpCap) / xpCap * 100), 100)

  const moyenne = examens.length > 0
    ? Math.round((examens.reduce((a: number, e: any) => a + (e.note_finale ?? e.note ?? 0), 0) / examens.length) * 10) / 10
    : null

  const coursTermines = progressions.filter((p: any) => p.termine).length
  const enCours = progressions.find((p: any) => !p.termine)
  const titreCours = enCours?.cours?.titre ?? 'Commence ton premier cours'

  const matCards = sc.matieres.map((code, i) => {
    const m = matieres.find((x: any) => x.code?.toUpperCase() === code) ?? { code, nom: matStyle(code).nom }
    const examsM = examens.filter((e: any) =>
      e.matiere_code === code ||
      (Array.isArray(e.matieres) && e.matieres.some((m: string) => m?.toUpperCase() === code))
    )
    const pct = examsM.length > 0
      ? Math.round((examsM.reduce((a: number, e: any) => a + (e.note_finale ?? e.note ?? 0), 0) / examsM.length / 20) * 100)
      : 0
    return { ...m, pct, hasData: examsM.length > 0 }
  })

  const matCardsAvecData = matCards.filter((m: any) => m.hasData)
  const faible = matCardsAvecData.length > 0
    ? [...matCardsAvecData].sort((a, b) => a.pct - b.pct)[0]
    : null

  const objectifs = [
    { label: 'Faire 3 exercices',        done: objectifsJour.cours >= 3, xp: 50, href: '/exercices' },
    { label: `Lire 1 cours ${clLabel}`,  done: objectifsJour.cours >= 1, xp: 30, href: '/cours' },
    { label: 'Consulter le Coach IA',    done: false,                    xp: 20, href: '/coach' },
  ]
  const objectifsDone = objectifs.filter(o => o.done).length

  const activite = [
    ...examens.slice(0, 2).map((e: any) => {
      // matiere_code ou premier élément de matieres[]
      const mCode = e.matiere_code ?? (Array.isArray(e.matieres) ? e.matieres[0] : null)
      const matiereLabel = Array.isArray(e.matieres) && e.matieres.length > 1
        ? `Examen (${e.matieres.length} matières)`
        : mCode ? matStyle(mCode).nom : 'Examen simulé'
      return ({
      code: mCode ?? '',
      icon: mCode ? (mCode as string).substring(0, 2).toUpperCase() : 'EX',
      titre: matiereLabel,
      note: `${(e.note_finale ?? e.note ?? 0).toFixed(1)}/20`,
      time: relTime(e.created_at),
      ok: (e.note_finale ?? e.note ?? 0) >= 10,
    })}),
    ...progressions.slice(0, 2).map((p: any) => ({
      code: p.cours?.matiere_code ?? '',
      icon: p.cours?.matiere_code ? (p.cours.matiere_code as string).substring(0, 2).toUpperCase() : 'CO',
      titre: p.cours?.titre ?? 'Cours consulté',
      note: '+30 XP',
      time: relTime(p.updated_at),
      ok: true,
    })),
  ].slice(0, 4)

  return (
    <div className="bg-gray-50">

      {/* ══ DESKTOP ════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Salutation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greetMsg(prenom, streak, xp)}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{clLabel} · {sc.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4" /> {streak} jours
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4" /> {xp} XP
            </span>
          </div>
        </div>

        {/* Ligne 1 : 3 stats + XP */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Examens passés', value: examens.length || '—', Icon: FileText, color: '#16a34a' },
            { label: 'Cours terminés', value: coursTermines || '—', Icon: CheckSquare, color: '#7c3aed' },
            { label: 'Niveau', value: `Niv. ${niveau}`, Icon: Zap, color: '#ea580c' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">{s.label}</p>
                <s.Icon className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              {i === 2 && (
                <div className="mt-3">
                  <ProgressBar value={xpPct} color={sc.color} />
                  <p className="text-xs text-gray-400 mt-1">{xp % xpCap} / {xpCap} XP</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ligne 2 : Cours + Matières */}
        <div className="grid grid-cols-3 gap-4">

          {/* Cours en cours */}
          <div className="rounded-2xl p-6 text-white flex flex-col justify-between" style={{ background: `linear-gradient(135deg, #0f172a 0%, #1a2e1a 100%)` }}>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-green-300 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {enCours ? 'En cours' : sc.label}
              </span>
              <h3 className="font-bold text-lg leading-snug mb-1">
                {enCours ? 'Continuer ton cours' : 'Commence maintenant'}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2">{titreCours}</p>
            </div>
            <Link href="/cours"
              className="mt-5 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-fit">
              <Play className="w-4 h-4" />
              {enCours ? 'Continuer' : 'Commencer'}
            </Link>
          </div>

          {/* Matières x2 colonnes */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Matières <span className="font-normal text-gray-400 text-sm">· {sc.label}</span></h3>
              <Link href="/cours" className="text-xs text-green-600 font-medium flex items-center gap-1">
                Voir toutes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {matCards.map((m: any, i: number) => {
                const ms = matStyle(m.code)
                const barColor = m.pct >= 80 ? '#16a34a' : m.pct >= 50 ? '#f97316' : '#ef4444'
                return (
                  <Link key={i} href={`/cours/${m.code?.toLowerCase()}`}
                    className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold mb-2"
                      style={{ backgroundColor: ms.color + '18', color: ms.color }}>
                      {(m.code ?? '').substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{m.nom ?? ms.nom}</p>
                    <p className="text-xl font-bold mb-1.5" style={{ color: m.hasData ? barColor : '#d1d5db' }}>
                      {m.hasData ? `${m.pct}%` : '—'}
                    </p>
                    <ProgressBar value={m.pct} color={m.hasData ? barColor : '#e5e7eb'} />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Ligne 3 : Objectifs + Coach IA + Activité */}
        <div className="grid grid-cols-3 gap-4">

          {/* Objectifs du jour */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-gray-900 text-sm">Objectifs du jour</h3>
              </div>
              <span className="text-xs font-bold text-green-600">{objectifsDone}/{objectifs.length}</span>
            </div>
            <ProgressBar value={(objectifsDone / objectifs.length) * 100} />
            <div className="mt-4 space-y-2">
              {objectifs.map((obj, i) => (
                <Link key={i} href={obj.href} className="flex items-center gap-3 group">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${obj.done ? 'bg-green-500' : 'border-2 border-gray-200 group-hover:border-green-300'}`}>
                    {obj.done && <span className="text-white text-[9px] font-bold">✓</span>}
                  </div>
                  <span className={`text-sm flex-1 ${obj.done ? 'line-through text-gray-300' : 'text-gray-600'}`}>{obj.label}</span>
                  <span className="text-xs text-green-600 font-bold">+{obj.xp}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Coach IA */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Coach IA recommande</h3>
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> IA
              </span>
            </div>
            {faible ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: matStyle(faible.code).color + '18', color: matStyle(faible.code).color }}>
                    {(faible.code ?? '').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{matStyle(faible.code).nom}</p>
                    <p className="text-xs text-gray-400 mb-1.5">{faible.pct < 70 ? 'À renforcer' : 'À approfondir'} · {faible.pct}%</p>
                    <ProgressBar value={faible.pct} color={faible.pct < 70 ? '#f97316' : '#16a34a'} />
                  </div>
                </div>
                <Link href="/exercices"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  S'entraîner →
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Commence par un examen !</p>
                <p className="text-xs text-gray-400 mb-4">Le Coach analysera tes résultats et te guidera.</p>
                <Link href="/examen"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Faire un examen →
                </Link>
              </div>
            )}
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 text-sm">Activité récente</h3>
            </div>
            {activite.length > 0 ? (
              <div className="space-y-3">
                {activite.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: matStyle(a.code).color + '18', color: matStyle(a.code).color }}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.titre}</p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${a.ok ? 'text-green-600' : 'text-red-400'}`}>{a.note}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucune activité récente</p>
            )}
            {badges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-gray-500">{badges.length} badge{badges.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {badges.slice(0, 5).map((ub: any, i: number) => (
                    <span key={i} className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center text-base" title={ub.badges?.nom}>
                      {ub.badges?.icone ?? '🏅'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ══ MOBILE ═════════════════════════════════════════════════════════════ */}
      <div className="md:hidden" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 16px))' }}>

        {/* Hero */}
        <div className="bg-white px-4 pt-3 pb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400">{clLabel} · {sc.label}</p>
              <h1 className="text-lg font-bold text-gray-900">{greetMsg(prenom, streak, xp)}</h1>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-full">
                  <Flame className="w-3.5 h-3.5" />{streak}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />{xp}
              </span>
            </div>
          </div>

          {/* Barre XP */}
          <div className="bg-gray-50 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Niveau {niveau}</span>
              <span className="text-xs text-gray-400">{xp % xpCap} / {xpCap} XP</span>
            </div>
            <ProgressBar value={xpPct} color={sc.color} />
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 mt-3 grid grid-cols-2 gap-2">
          {[
            { label: 'Examens', value: examens.length || '—', color: '#16a34a' },
            { label: 'Cours terminés', value: coursTermines || '—', color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center border border-gray-100">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-4 mt-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {([['today', "Aujourd'hui"], ['matieres', 'Mes matières']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Aujourd'hui */}
        {tab === 'today' && (
          <div className="px-4 mt-3 space-y-3 pb-4">

            {/* Cours */}
            <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2e1a 100%)' }}>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-green-300 text-[11px] font-medium px-2 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {enCours ? 'En cours' : sc.label}
              </span>
              <p className="font-bold mb-1">{enCours ? 'Continuer ton cours' : 'Commence maintenant'}</p>
              <p className="text-gray-400 text-xs mb-4 line-clamp-1">{titreCours}</p>
              <Link href="/cours"
                className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                <Play className="w-4 h-4" />{enCours ? 'Continuer' : 'Commencer'}
              </Link>
            </div>

            {/* Objectifs */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-900 text-sm">Objectifs du jour</span>
                </div>
                <span className="text-xs font-bold text-green-600">{objectifsDone}/{objectifs.length}</span>
              </div>
              <ProgressBar value={(objectifsDone / objectifs.length) * 100} />
              <div className="mt-3 space-y-2.5">
                {objectifs.map((obj, i) => (
                  <Link key={i} href={obj.href} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${obj.done ? 'bg-green-500' : 'border-2 border-gray-200'}`}>
                      {obj.done && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <span className={`text-sm flex-1 ${obj.done ? 'line-through text-gray-300' : 'text-gray-600'}`}>{obj.label}</span>
                    <span className="text-xs text-green-600 font-bold">+{obj.xp}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Coach IA */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 text-sm">Coach IA recommande</span>
                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">IA</span>
              </div>
              {faible ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: matStyle(faible.code).color + '18', color: matStyle(faible.code).color }}>
                      {(faible.code ?? '').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{matStyle(faible.code).nom}</p>
                      <p className="text-xs text-gray-400">{faible.pct}% · {faible.pct < 70 ? 'À renforcer' : 'Bon niveau'}</p>
                    </div>
                  </div>
                  <Link href="/exercices"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 text-white text-sm font-semibold py-2.5 rounded-xl">
                    S'entraîner →
                  </Link>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-3">Fais ton premier examen pour que le Coach t'aide !</p>
                  <Link href="/examen"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 text-white text-sm font-semibold py-2.5 rounded-xl">
                    Faire un examen →
                  </Link>
                </div>
              )}
            </div>

            {/* Activité */}
            {activite.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-900 text-sm">Activité récente</span>
                </div>
                <div className="space-y-3">
                  {activite.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: matStyle(a.code).color + '18', color: matStyle(a.code).color }}>
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.titre}</p>
                        <p className="text-xs text-gray-400">{a.time}</p>
                      </div>
                      <span className={`text-sm font-bold ${a.ok ? 'text-green-600' : 'text-red-400'}`}>{a.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab: Mes matières */}
        {tab === 'matieres' && (
          <div className="px-4 mt-3 space-y-2 pb-4">
            {matCards.map((m: any, i: number) => {
              const ms = matStyle(m.code)
              const barColor = !m.hasData ? '#e5e7eb' : m.pct >= 80 ? '#16a34a' : m.pct >= 50 ? '#f97316' : '#ef4444'
              const status = !m.hasData ? 'Pas encore démarré' : m.pct >= 80 ? 'Très bon' : m.pct >= 50 ? 'À améliorer' : 'En difficulté'
              return (
                <Link key={i} href={`/cours/${m.code?.toLowerCase()}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: ms.color + '18', color: ms.color }}>
                    {(m.code ?? '').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{m.nom ?? ms.nom}</p>
                      <p className="text-base font-bold" style={{ color: m.hasData ? barColor : '#d1d5db' }}>
                        {m.hasData ? `${m.pct}%` : '—'}
                      </p>
                    </div>
                    <ProgressBar value={m.pct} color={barColor} />
                    <p className="text-xs text-gray-400 mt-1">{status}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              )
            })}
            <Link href="/orientation"
              className="flex items-center justify-center gap-2 w-full bg-white border border-green-200 text-green-600 font-semibold text-sm py-3.5 rounded-2xl mt-2">
              <BarChart2 className="w-4 h-4" />
              Voir mon analyse complète
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
