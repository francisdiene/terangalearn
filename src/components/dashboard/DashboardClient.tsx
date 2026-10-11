'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp, Bell, ArrowUpRight, Play, Zap,
  Award, Clock, Target, ChevronRight, Flame,
  BookOpen, BarChart2, Search
} from 'lucide-react'

// ─── Micro-composants ─────────────────────────────────────────────────────────

function ProgressBar({ value, color = 'bg-green-500', thin = false }: {
  value: number; color?: string; thin?: boolean
}) {
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-800 rounded-full ${thin ? 'h-1' : 'h-1.5'}`}>
      <div className={`${color} ${thin ? 'h-1' : 'h-1.5'} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

function MiniBar({ values, active }: { values: number[]; active?: boolean }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-0.5 h-7">
      {values.map((v, i) => (
        <div key={i}
          className={`flex-1 rounded-sm transition-all ${i === values.length - 1 && active
            ? 'bg-green-500'
            : 'bg-gray-200 dark:bg-gray-700'}`}
          style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />
      ))}
    </div>
  )
}

// ─── Config séries ────────────────────────────────────────────────────────────

const SERIE_CONFIG: Record<string, {
  label: string; badge: string; color: string
  bgClass: string; textClass: string
  matieres: string[]; targetNote: number
}> = {
  S: { label: 'Série S', badge: '🔬', color: '#16a34a', bgClass: 'bg-emerald-50 dark:bg-emerald-950', textClass: 'text-emerald-700 dark:text-emerald-400', matieres: ['MATH', 'PC', 'SVT', 'FR'], targetNote: 14 },
  L: { label: 'Série L', badge: '📚', color: '#7c3aed', bgClass: 'bg-violet-50 dark:bg-violet-950', textClass: 'text-violet-700 dark:text-violet-400', matieres: ['FR', 'PHILO', 'HG', 'ANG'], targetNote: 13 },
  G: { label: 'Série G', badge: '📊', color: '#ea580c', bgClass: 'bg-orange-50 dark:bg-orange-950', textClass: 'text-orange-700 dark:text-orange-400', matieres: ['ECO', 'MATH', 'HG', 'FR'], targetNote: 12 },
  T: { label: 'Série T', badge: '🔧', color: '#0891b2', bgClass: 'bg-cyan-50 dark:bg-cyan-950', textClass: 'text-cyan-700 dark:text-cyan-400', matieres: ['MATH', 'PC', 'ECO', 'FR'], targetNote: 13 },
}

const MATIERE_CFG: Record<string, { icon: string; bg: string; text: string; nom: string }> = {
  MATH:  { icon: '📐', bg: 'bg-blue-100 dark:bg-blue-900',   text: 'text-blue-600',   nom: 'Maths' },
  PC:    { icon: '⚗️', bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600', nom: 'Physique' },
  SVT:   { icon: '🌿', bg: 'bg-green-100 dark:bg-green-900',  text: 'text-green-600',  nom: 'SVT' },
  FR:    { icon: '📖', bg: 'bg-violet-100 dark:bg-violet-900', text: 'text-violet-600', nom: 'Français' },
  HG:    { icon: '🌍', bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600', nom: 'Hist-Géo' },
  ANG:   { icon: '🇬🇧', bg: 'bg-pink-100 dark:bg-pink-900',    text: 'text-pink-600',   nom: 'Anglais' },
  PHILO: { icon: '🏛️', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600', nom: 'Philo' },
  ECO:   { icon: '📊', bg: 'bg-teal-100 dark:bg-teal-900',    text: 'text-teal-600',   nom: 'Économie' },
}

const CLASSE_LABEL: Record<string, string> = {
  seconde: 'Seconde', premiere: 'Première', terminale: 'Terminale'
}

function matStyle(code: string) {
  return MATIERE_CFG[code?.toUpperCase()] ?? { icon: '📚', bg: 'bg-gray-100', text: 'text-gray-600', nom: 'Autre' }
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

function greetMsg(prenom: string, streak: number, xp: number): string {
  if (streak >= 7) return `${streak} jours d'affilée 🔥`
  if (xp === 0) return `Bienvenue ${prenom} !`
  const h = new Date().getHours()
  if (h < 12) return `Bonjour ${prenom} 👋`
  if (h < 18) return `Bonne continuation ${prenom} !`
  return `Bonsoir ${prenom} 🌙`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  profile: any; matieres: any[]; progressions: any[]
  examens: any[]; badges: any[]
  objectifsJour: { examens: number; cours: number }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function DashboardClient({ profile, matieres, progressions, examens, badges, objectifsJour }: Props) {
  const [tab, setTab] = useState<'today' | 'stats'>('today')

  const prenom   = profile?.full_name?.split(' ')[0] ?? 'Élève'
  const xp       = profile?.xp ?? 0
  const niveau   = profile?.niveau ?? 1
  const streak   = profile?.streak ?? 0
  const serie    = (profile?.serie ?? 'S').toUpperCase()
  const classe   = profile?.classe ?? 'terminale'
  const sc       = SERIE_CONFIG[serie] ?? SERIE_CONFIG['S']
  const clLabel  = CLASSE_LABEL[classe] ?? 'Terminale'

  const xpCap    = niveau * 200
  const xpPct    = Math.min(Math.round((xp % xpCap) / xpCap * 100), 100)

  const examensCount = examens.length
  const moyenne = examens.length > 0
    ? examens.reduce((a: number, e: any) => a + (e.note ?? 0), 0) / examens.length
    : null

  const coursTermines = progressions.filter((p: any) => p.termine).length
  const enCours = progressions.find((p: any) => !p.termine)
  const titreCours = enCours?.cours?.titre ?? 'Commence ton premier cours'

  // Matières de la série + progression
  const matCodes = sc.matieres
  const matCards = matCodes.map((code, i) => {
    const m = matieres.find((x: any) => x.code?.toUpperCase() === code) ?? { code, nom: matStyle(code).nom }
    const examsM = examens.filter((e: any) => e.matiere_code === code)
    const pct = examsM.length > 0
      ? Math.round((examsM.reduce((a: number, e: any) => a + (e.note ?? 0), 0) / examsM.length / 20) * 100)
      : [72, 58, 81, 65][i] ?? 68
    return { ...m, pct }
  })

  // Matière la plus faible
  const faible = [...matCards].sort((a, b) => a.pct - b.pct)[0]

  // Activité récente
  const activite = [
    ...examens.slice(0, 2).map((e: any) => ({
      icon: '📝',
      titre: e.matiere_code ? matStyle(e.matiere_code).nom : 'Examen BAC',
      note: `${(e.note ?? 0).toFixed(1)}/20`,
      time: relTime(e.created_at),
      ok: (e.note ?? 0) >= 10,
    })),
    ...progressions.slice(0, 2).map((p: any) => ({
      icon: '📚',
      titre: p.cours?.titre ?? 'Cours consulté',
      note: '+30 XP',
      time: relTime(p.updated_at),
      ok: true,
    })),
  ].slice(0, 3)

  const objectifs = [
    { label: 'Faire 3 exercices', done: objectifsJour.cours >= 3, xp: 50, href: '/exercices' },
    { label: `Lire 1 cours ${clLabel}`, done: objectifsJour.cours >= 1, xp: 30, href: '/cours' },
    { label: 'Consulter le Coach IA', done: false, xp: 20, href: '/coach' },
  ]
  const objectifsDone = objectifs.filter(o => o.done).length

  const chartVals = [6, 9, 8, 12, 10, 14, moyenne ?? 13]

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* ══ DESKTOP HEADER ══════════════════════════════════════════════════ */}
      <header className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 items-center gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl ${sc.bgClass} flex items-center justify-center text-xl`}>{sc.badge}</div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">{greetMsg(prenom, streak, xp)}</h1>
            <p className="text-xs text-gray-400">{clLabel} · {sc.label} · Niv. {niveau}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher…" className="bg-transparent text-sm outline-none flex-1 placeholder:text-gray-400 text-gray-700 dark:text-gray-300" />
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1.5 rounded-full font-semibold">🔥 {streak}j</span>}
          <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1.5 rounded-full font-semibold flex items-center gap-1"><Zap className="w-3 h-3" />{xp} XP</span>
          <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className={`w-9 h-9 rounded-xl ${sc.bgClass} flex items-center justify-center font-bold text-sm ${sc.textClass}`}>
            {prenom.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ══ MOBILE LAYOUT ═══════════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 px-4 pt-2 pb-4">

          {/* Salutation + cloche */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{clLabel} · {sc.label}</p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {greetMsg(prenom, streak, xp)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-50 text-orange-500 text-xs font-bold px-2.5 py-1.5 rounded-full">
                  <Flame className="w-3.5 h-3.5" />{streak}
                </div>
              )}
              <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>

          {/* XP card */}
          <div className={`rounded-2xl p-4 ${sc.bgClass}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`text-xs font-semibold ${sc.textClass}`}>Niveau {niveau}</p>
                <p className={`text-2xl font-black ${sc.textClass}`}>{xp} <span className="text-base font-bold">XP</span></p>
              </div>
              <div className="text-3xl">{sc.badge}</div>
            </div>
            <ProgressBar value={xpPct} color="bg-green-500" />
            <div className="flex justify-between mt-1.5">
              <p className="text-[10px] text-gray-500">{xp % xpCap} / {xpCap} XP</p>
              <p className="text-[10px] text-gray-500">Niv. {niveau + 1} →</p>
            </div>
          </div>
        </div>

        {/* ── Quick stats row ─────────────────────────────────────────────── */}
        <div className="px-4 mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Examens', value: examensCount || '—', icon: '📝', color: 'text-green-600' },
            { label: 'Moyenne', value: moyenne !== null ? `${moyenne.toFixed(1)}/20` : '—', icon: '📊', color: moyenne !== null && moyenne >= sc.targetNote ? 'text-green-600' : 'text-blue-600' },
            { label: 'Cours finis', value: coursTermines || '—', icon: '✅', color: 'text-purple-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex flex-col items-center gap-1 border border-gray-100 dark:border-gray-800">
              <span className="text-xl">{s.icon}</span>
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="px-4 mt-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            {(['today', 'stats'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400'}`}>
                {t === 'today' ? "Aujourd'hui" : 'Mes matières'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Aujourd'hui ────────────────────────────────────────────── */}
        {tab === 'today' && (
          <div className="px-4 mt-3 space-y-3 pb-2">

            {/* Cours en cours */}
            <div className="bg-gray-900 rounded-2xl p-4 overflow-hidden relative">
              <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at top right, #14532d, transparent)' }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2">
                      <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                      {enCours ? 'En cours' : 'Prêt à commencer'}
                    </span>
                    <h3 className="text-white font-bold text-sm mb-0.5">
                      {enCours ? 'Continuer' : 'Commencer un cours'}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-1 mb-3">{titreCours}</p>
                    {enCours && <ProgressBar value={68} color="bg-green-500" thin />}
                  </div>
                  <Link href="/cours"
                    className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/40">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Objectifs du jour */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Objectifs du jour</h3>
                </div>
                <span className="text-xs font-bold text-green-600">{objectifsDone}/{objectifs.length}</span>
              </div>
              {/* Progress globale objectifs */}
              <ProgressBar value={(objectifsDone / objectifs.length) * 100} color="bg-green-500" />
              <div className="mt-3 space-y-2">
                {objectifs.map((obj, i) => (
                  <Link key={i} href={obj.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 active:scale-[0.98] transition-transform">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                      ${obj.done ? 'bg-green-500' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                      {obj.done && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <span className={`text-xs flex-1 ${obj.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>
                      {obj.label}
                    </span>
                    <span className="text-[10px] bg-green-50 dark:bg-green-950 text-green-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                      +{obj.xp}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommandation IA */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Coach IA recommande</h3>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
                <div className={`w-12 h-12 ${matStyle(faible?.code).bg.split(' ')[0]} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                  {matStyle(faible?.code).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{matStyle(faible?.code).nom}</p>
                  <p className="text-xs text-gray-400">{faible?.pct < 70 ? 'À renforcer' : 'À approfondir'} · {faible?.pct}%</p>
                  <ProgressBar value={faible?.pct ?? 65} color={faible?.pct < 70 ? 'bg-orange-400' : 'bg-green-500'} />
                </div>
              </div>
              <Link href="/exercices"
                className="flex items-center justify-center gap-2 w-full bg-green-500 active:bg-green-600 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors">
                S'entraîner maintenant →
              </Link>
            </div>

            {/* Activité récente */}
            {activite.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Activité récente</h3>
                  </div>
                  <Link href="/profil" className="text-xs text-green-600 font-medium">Voir tout</Link>
                </div>
                <div className="space-y-2">
                  {activite.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{a.titre}</p>
                        <p className="text-[10px] text-gray-400">{a.time}</p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${a.ok ? 'text-green-600' : 'text-red-400'}`}>
                        {a.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Mes badges</h3>
                  </div>
                  <span className="text-xs text-gray-400">{badges.length} obtenu{badges.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badges.map((ub: any, i: number) => (
                    <div key={i} className="w-12 h-12 bg-yellow-50 dark:bg-yellow-950 rounded-xl flex items-center justify-center text-2xl"
                      title={ub.badges?.nom}>
                      {ub.badges?.icone ?? '🏅'}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Tab: Mes matières ────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="px-4 mt-3 space-y-3 pb-2">

            {/* Graphique 7 jours */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Progression 7 jours</h3>
                </div>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {moyenne !== null ? moyenne.toFixed(1) : niveau}
                </span>
                <span className="text-gray-400 text-sm mb-0.5">{moyenne !== null ? '/20' : 'e niv.'}</span>
                {moyenne !== null && moyenne >= sc.targetNote && (
                  <span className="text-xs text-green-600 font-bold ml-1 mb-0.5">✓ Objectif {sc.targetNote}/20</span>
                )}
              </div>
              <div className="flex items-end gap-1 h-16 mt-3">
                {chartVals.map((v, i) => {
                  const max = Math.max(...chartVals, 1)
                  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${(v / max) * 48}px`,
                          background: i === chartVals.length - 1 ? '#16a34a' : '#e5e7eb',
                          minHeight: 4
                        }} />
                      <span className="text-[9px] text-gray-400">{days[i]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Matières */}
            <div className="space-y-2">
              {matCards.map((m: any, i: number) => {
                const ms = matStyle(m.code)
                const status = m.pct >= 80 ? { label: 'Très bon', color: 'text-green-600', dot: 'bg-green-500' }
                  : m.pct >= 50 ? { label: 'À améliorer', color: 'text-orange-500', dot: 'bg-orange-400' }
                  : { label: 'En difficulté', color: 'text-red-500', dot: 'bg-red-400' }
                return (
                  <Link key={i} href={`/cours?matiere=${m.code?.toLowerCase()}`}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform">
                    <div className={`w-12 h-12 ${ms.bg.split(' ')[0]} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                      {ms.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{m.nom ?? ms.nom}</p>
                        <p className={`text-sm font-black ${ms.text}`}>{m.pct}%</p>
                      </div>
                      <ProgressBar value={m.pct} color={m.pct >= 80 ? 'bg-green-500' : m.pct >= 50 ? 'bg-orange-400' : 'bg-red-400'} />
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className={`text-[10px] ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>

            {/* Lien orientation */}
            <Link href="/orientation"
              className="flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-green-600 font-bold text-sm px-4 py-3.5 rounded-2xl active:scale-[0.98] transition-transform">
              <BarChart2 className="w-4 h-4" />
              Voir mon analyse complète
            </Link>

          </div>
        )}

      </div>

      {/* ══ DESKTOP CONTENT ════════════════════════════════════════════════ */}
      <div className="hidden md:block p-5 max-w-7xl mx-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Examens', value: examensCount || '—', sub: '+3 cette sem.', icon: '📝', color: 'text-green-600', trend: [4,7,5,9,11,14,examensCount||0] },
            { label: 'Moyenne', value: moyenne !== null ? `${moyenne.toFixed(1)}/20` : '—', sub: moyenne !== null && moyenne >= sc.targetNote ? '✓ Objectif atteint' : `Objectif : ${sc.targetNote}/20`, icon: '📊', color: moyenne !== null && moyenne >= sc.targetNote ? 'text-green-600' : 'text-blue-600', trend: [10,11,12,12.5,13,13.8,moyenne??0] },
            { label: 'Niveau XP', value: `Niv. ${niveau}`, sub: `${xp % xpCap}/${xpCap} XP`, icon: '⚡', color: 'text-purple-600', trend: [20,30,40,48,55,65,xpPct] },
            { label: 'Streak', value: streak > 0 ? `${streak}j` : '—', sub: streak >= 7 ? '🔥 En feu !' : `${streak} jours de suite`, icon: '🔥', color: 'text-orange-500', trend: [1,2,3,4,5,6,streak||0] },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
              <MiniBar values={s.trend} active />
              <p className="text-xs text-gray-400 mt-2">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Ligne 2 */}
        <div className="grid grid-cols-3 gap-3">
          {/* Cours */}
          <div className="bg-gray-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at top right, #14532d, transparent)' }} />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {enCours ? 'En cours' : `${clLabel} · ${sc.label}`}
              </span>
              <h3 className="text-white font-bold text-lg mb-1">{enCours ? 'Continuer ton cours' : 'Commence maintenant'}</h3>
              <p className="text-gray-400 text-sm mb-3 line-clamp-1">{titreCours}</p>
              {enCours && (<><p className="text-xs text-gray-400 mb-1">Progression : 68%</p><ProgressBar value={68} color="bg-green-500" /></>)}
              <Link href="/cours" className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                <Play className="w-4 h-4" />{enCours ? 'Continuer' : 'Commencer'}
              </Link>
            </div>
          </div>

          {/* Graphique */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Mes notes (7j)</h3>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{moyenne !== null ? moyenne.toFixed(1) : niveau}</span>
              <span className="text-gray-400 mb-1">{moyenne !== null ? '/20' : 'e niv.'}</span>
            </div>
            <div className="flex items-end gap-1 h-20 mt-3">
              {chartVals.map((v, i) => {
                const max = Math.max(...chartVals, 1)
                const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all"
                      style={{ height: `${(v / max) * 60}px`, background: i === chartVals.length - 1 ? '#16a34a' : '#e5e7eb', minHeight: 3 }} />
                    <span className="text-[10px] text-gray-400">{days[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommandé IA */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Coach IA recommande</h3>
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full font-medium">
                <Zap className="w-3 h-3" /> IA
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-3">
              <div className={`w-14 h-14 ${matStyle(faible?.code).bg.split(' ')[0]} rounded-xl flex items-center justify-center text-3xl`}>
                {matStyle(faible?.code).icon}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{matStyle(faible?.code).nom}</p>
                <p className="text-xs text-gray-400">{faible?.pct < 70 ? 'À renforcer' : 'À approfondir'} · {faible?.pct}%</p>
                <ProgressBar value={faible?.pct ?? 65} color={faible?.pct < 70 ? 'bg-orange-400' : 'bg-green-500'} />
              </div>
            </div>
            <Link href="/exercices" className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
              S'entraîner →
            </Link>
          </div>
        </div>

        {/* Ligne 3 : Matières + Objectifs + Activité */}
        <div className="grid grid-cols-3 gap-3">
          {/* Matières */}
          <div className="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Matières <span className={sc.textClass}>{sc.label}</span>
                </h3>
              </div>
              <Link href="/cours" className="text-xs text-green-600 flex items-center gap-1 font-medium">
                Voir toutes <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {matCards.map((m: any, i: number) => {
                const ms = matStyle(m.code)
                const bar = m.pct >= 80 ? 'bg-green-500' : m.pct >= 50 ? 'bg-orange-400' : 'bg-red-400'
                return (
                  <Link key={i} href={`/cours?matiere=${m.code?.toLowerCase()}`}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-200 hover:shadow-sm transition-all">
                    <div className={`w-9 h-9 ${ms.bg.split(' ')[0]} rounded-lg flex items-center justify-center text-xl mb-2`}>{ms.icon}</div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 truncate">{m.nom ?? ms.nom}</p>
                    <p className={`text-lg font-black ${ms.text}`}>{m.pct}%</p>
                    <ProgressBar value={m.pct} color={bar} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Objectifs + Activité empilés */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Objectifs du jour</h3>
                <span className="ml-auto text-xs font-bold text-green-600">{objectifsDone}/{objectifs.length}</span>
              </div>
              <ProgressBar value={(objectifsDone / objectifs.length) * 100} />
              <div className="mt-2 space-y-1.5">
                {objectifs.map((obj, i) => (
                  <Link key={i} href={obj.href} className="flex items-center gap-2 py-0.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                      ${obj.done ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                      {obj.done && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <span className={`text-xs flex-1 ${obj.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{obj.label}</span>
                    <span className="text-[10px] text-green-600 font-bold">+{obj.xp}</span>
                  </Link>
                ))}
              </div>
            </div>
            {activite.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Activité récente</h3>
                </div>
                <div className="space-y-2">
                  {activite.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-base flex-shrink-0">{a.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{a.titre}</p>
                        <p className="text-[10px] text-gray-400">{a.time}</p>
                      </div>
                      <span className={`text-xs font-bold ${a.ok ? 'text-green-600' : 'text-red-400'}`}>{a.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
