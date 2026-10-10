'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp, Flame, BookOpen, Target, Bell, Search,
  ChevronDown, ArrowUpRight, Play, Zap, Award, Clock,
  BarChart2, ChevronRight
} from 'lucide-react'

// Sparkline SVG simple
function Sparkline({ values, color = '#16a34a' }: { values: number[], color?: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80, h = 32
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Mini bar chart pour le graphique progression 7 jours
function ProgressChart({ data }: { data: { day: string, score: number }[] }) {
  const max = Math.max(...data.map(d => d.score))
  return (
    <div className="flex items-end gap-1 h-20 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-sm bg-green-500 transition-all"
            style={{ height: `${(d.score / max) * 64}px`, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5 }}
          />
          <span className="text-xs text-gray-400">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

// Barre de progression
function ProgressBar({ value, color = 'bg-green-500' }: { value: number, color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

const MATIERE_COLORS: Record<string, { bg: string, text: string, icon: string }> = {
  MATH: { bg: 'bg-blue-100', text: 'text-blue-600', icon: '📐' },
  PC:   { bg: 'bg-orange-100', text: 'text-orange-600', icon: '⚗️' },
  SVT:  { bg: 'bg-green-100', text: 'text-green-600', icon: '🌿' },
  FR:   { bg: 'bg-purple-100', text: 'text-purple-600', icon: '📖' },
  HG:   { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '🌍' },
  ANG:  { bg: 'bg-pink-100', text: 'text-pink-600', icon: '🇬🇧' },
  PHILO:{ bg: 'bg-indigo-100', text: 'text-indigo-600', icon: '🏛️' },
  ECO:  { bg: 'bg-teal-100', text: 'text-teal-600', icon: '📊' },
}

function getMatiereStyle(code: string) {
  return MATIERE_COLORS[code?.toUpperCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: '📚' }
}

function getProgressLabel(pct: number) {
  if (pct >= 80) return { label: 'Très bon niveau', color: 'text-green-600', dot: 'bg-green-500' }
  if (pct >= 50) return { label: 'À améliorer', color: 'text-orange-500', dot: 'bg-orange-400' }
  return { label: 'En difficulté', color: 'text-red-500', dot: 'bg-red-400' }
}

interface Props {
  profile: any
  matieres: any[]
  progressions: any[]
  examens: any[]
  badges: any[]
}

export default function DashboardClient({ profile, matieres, progressions, examens, badges }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'
  const xp = profile?.xp ?? 0
  const niveau = profile?.niveau ?? 1
  const streak = profile?.streak ?? 0
  const serie = profile?.serie ?? 'S'
  const classe = profile?.classe ?? 'terminale'

  // Stats calculées
  const examensCount = examens.length
  const moyenneGenerale = examens.length > 0
    ? examens.reduce((acc: number, e: any) => acc + (e.note ?? 0), 0) / examens.length
    : 0
  const progression = Math.min(Math.round((xp / (niveau * 200)) * 100), 100)
  const coursTermines = progressions.filter((p: any) => p.termine).length

  // Données graphique 7 jours (simulées si pas de données réelles)
  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const chartData = jours.map((day, i) => ({
    day,
    score: examens.length > 0
      ? [6, 9, 8, 12, 10, 15, 17][i] ?? 12
      : [6, 9, 8, 12, 10, 15, 17][i]
  }))

  // Dernière progression en cours
  const enCours = progressions.find((p: any) => !p.termine)
  const titreCours = enCours?.cours?.titre ?? 'Commence ton premier cours'
  const pctCours = enCours ? 68 : 0

  // Activité récente — examens + cours
  const activiteRecente = [
    ...examens.slice(0, 3).map((e: any) => ({
      type: 'examen',
      titre: `Examen de ${e.matieres?.[0] ?? 'BAC'}`,
      note: `${(e.note ?? 0).toFixed(1)} / 20`,
      time: 'Il y a 2 heures',
      icon: '📝',
    })),
    ...progressions.slice(0, 2).map((p: any) => ({
      type: 'cours',
      titre: p.cours?.titre ?? 'Cours terminé',
      note: '+30 XP',
      time: 'Hier',
      icon: '📚',
    })),
  ].slice(0, 3)

  // Si pas d'activité, données exemples
  const activite = activiteRecente.length > 0 ? activiteRecente : [
    { type: 'examen', titre: 'Examen de Mathématiques', note: '14,5 / 20', time: 'Il y a 2 heures', icon: '📝' },
    { type: 'examen', titre: 'Mini-examen de Physique', note: '12 / 20', time: 'Hier', icon: '📝' },
    { type: 'cours', titre: 'Quiz Français', note: '16 / 20', time: 'Il y a 2 jours', icon: '📚' },
  ]

  // 4 matières principales avec progression simulée
  const matieresPrincipales = matieres.slice(0, 4).map((m: any, i: number) => ({
    ...m,
    pct: [78, 61, 80, 88][i] ?? [65, 70, 75, 80][i] ?? 70,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header — masqué sur mobile (MobileNav s'en charge) */}
      <header className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🎓</div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-base">Bonjour, {prenom} 👋</h1>
            <p className="text-xs text-gray-400">Prêt à continuer ton apprentissage ?</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-80">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher une matière, un exercice..."
            className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none flex-1 placeholder:text-gray-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-100 transition">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-sm">{prenom.charAt(0)}</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{prenom}</p>
              <p className="text-xs text-gray-400">Élève</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-3 sm:p-5 max-w-7xl mx-auto space-y-3 sm:space-y-5">

        {/* Salutation mobile */}
        <div className="md:hidden flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-base">Bonjour, {prenom} 👋</h1>
            <p className="text-xs text-gray-400">Prêt à continuer ?</p>
          </div>
          <button className="relative w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* LIGNE 1 — 4 stat cards (2×2 mobile, 4 colonnes desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              label: 'Examens',
              value: examensCount || 18,
              sub: '+3 cette sem.',
              trend: [4, 7, 5, 9, 11, 14, examensCount || 18],
              color: 'text-green-600',
              icon: '📝',
            },
            {
              label: 'Moyenne',
              value: examens.length > 0 ? `${moyenneGenerale.toFixed(1)}/20` : '14,2/20',
              sub: '+0,8 cette sem.',
              trend: [10, 11, 12, 12.5, 13, 13.8, moyenneGenerale || 14.2],
              color: 'text-blue-600',
              icon: '📊',
            },
            {
              label: 'Progression',
              value: `${progression || 72}%`,
              sub: '+6% cette sem.',
              trend: [40, 48, 52, 58, 63, 68, progression || 72],
              color: 'text-purple-600',
              icon: '📈',
            },
            {
              label: 'Streak',
              value: `${streak || 7}j`,
              sub: `+${Math.max(streak - 5, 2)} jours`,
              trend: [1, 2, 3, 4, 5, 6, streak || 7],
              color: 'text-orange-500',
              icon: '🔥',
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{stat.label}</p>
                  <p className={`text-lg sm:text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
                <span className="text-lg sm:text-2xl flex-shrink-0">{stat.icon}</span>
              </div>
              <Sparkline values={stat.trend} color={
                i === 0 ? '#16a34a' : i === 1 ? '#2563eb' : i === 2 ? '#9333ea' : '#f97316'
              } />
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-green-600 font-medium truncate">{stat.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* LIGNE 2 — mobile: Cours pleine largeur + Graphique/Recommandé côte à côte */}
        {/* desktop: 3 colonnes égales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">

          {/* Cours en cours — pleine largeur mobile */}
          <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #0f2d1f 100%)' }} />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Parcours en cours
              </span>
              {/* Mobile : disposition horizontale compacte */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-0.5 truncate">Continuer ton parcours</h3>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-1">{titreCours}</p>
                  <p className="text-xs text-gray-400 mb-1">Progression : {pctCours || 68}%</p>
                  <ProgressBar value={pctCours || 68} color="bg-green-500" />
                </div>
                <Link
                  href="/cours"
                  className="flex-shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition sm:hidden"
                >
                  <Play className="w-3.5 h-3.5" />
                  Go
                </Link>
              </div>
              <Link
                href="/cours"
                className="hidden sm:inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <Play className="w-4 h-4" />
                Commencer
              </Link>
            </div>
          </div>

          {/* Graphique + Recommandé : 2 cols sur mobile, chacun sa propre col sur lg */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:contents">

            {/* Graphique progression 7 jours */}
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Progression</h3>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">7j</span>
              </div>
              <div className="flex items-end gap-1 mt-1 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {chartData[chartData.length - 1].score.toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs mb-1">/20</span>
              </div>
              <ProgressChart data={chartData} />
            </div>

            {/* Recommandé par IA */}
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Recommandé</h3>
                <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-medium">
                  <Zap className="w-2.5 h-2.5" /> IA
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-xl sm:text-2xl">🧮</div>
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white text-center mb-1 line-clamp-2">
                  10 exercices sur les probabilités
                </p>
                <p className="text-[10px] text-gray-500 text-center hidden sm:block">
                  Tes derniers résultats montrent que ce chapitre mérite un entraînement.
                </p>
              </div>
              <Link
                href="/exercices"
                className="w-full flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold px-3 py-2 sm:py-2.5 rounded-xl transition"
              >
                S'entraîner →
              </Link>
            </div>
          </div>
        </div>

        {/* LIGNE 3 — mobile: Matières full width, puis Objectif+Activité côte à côte */}
        {/* desktop: 3 colonnes */}

        {/* Tes matières — toujours pleine largeur, grille 2×2 interne */}
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Tes matières</h3>
            </div>
            <Link href="/cours" className="text-xs text-green-600 font-medium flex items-center gap-1">
              Voir toutes <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {(matieresPrincipales.length > 0 ? matieresPrincipales : [
              { code: 'MATH', nom: 'Mathématiques', pct: 78 },
              { code: 'PC', nom: 'Physique-Chimie', pct: 61 },
              { code: 'SVT', nom: 'Sciences de la Vie', pct: 80 },
              { code: 'FR', nom: 'Français', pct: 88 },
            ]).map((m: any, i: number) => {
              const style = getMatiereStyle(m.code)
              const prog = getProgressLabel(m.pct)
              return (
                <Link key={i} href={`/cours/${m.code?.toLowerCase()}`}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-200 transition-colors">
                  <div className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center text-lg mb-2`}>
                    {style.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{m.nom}</p>
                  <p className={`text-base sm:text-lg font-bold ${style.text}`}>{m.pct}%</p>
                  <ProgressBar value={m.pct} color={m.pct >= 80 ? 'bg-green-500' : 'bg-orange-400'} />
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${prog.dot}`} />
                    <span className={`text-[10px] sm:text-xs truncate ${prog.color}`}>{prog.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Objectif BAC + Activité récente — 2 cols sur mobile, 2/3 sur desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3">

          {/* Objectif BAC */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Objectif Bac</h3>
            </div>
            {/* Mobile : progress + objectifs horizontaux */}
            <div className="flex items-center gap-3 mb-3">
              <p className="text-3xl sm:text-4xl font-bold text-green-600 flex-shrink-0">{progression || 72}%</p>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Niveau actuel</p>
                <ProgressBar value={progression || 72} />
                <p className="text-[10px] text-gray-400 mt-1">Continue régulièrement.</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Faire 10 exercices', done: false, xp: 50 },
                { label: 'Lire 1 cours', done: coursTermines > 0, xp: 30 },
                { label: 'Consulter Coach IA', done: false, xp: 20 },
              ].map((obj, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${obj.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {obj.done && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`text-xs truncate ${obj.done ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                      {obj.label}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-1">+{obj.xp} XP</span>
                </div>
              ))}
            </div>
            <Link href="/orientation"
              className="mt-3 flex items-center justify-center gap-2 w-full border border-green-200 text-green-600 hover:bg-green-50 text-xs font-semibold px-3 py-2 rounded-xl transition">
              <BarChart2 className="w-3.5 h-3.5" />
              Ma progression
            </Link>
          </div>

          {/* Activité récente */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Activité récente</h3>
              </div>
              <Link href="/profil" className="text-xs text-green-600 font-medium flex items-center gap-1">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {activite.map((act, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{act.titre}</p>
                    <p className="text-[10px] text-gray-400">{act.time}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">{act.note}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
            {badges.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Badges</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badges.map((ub: any, i: number) => (
                    <div key={i} className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center text-base" title={ub.badges?.nom}>
                      {ub.badges?.icone ?? '🏅'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
