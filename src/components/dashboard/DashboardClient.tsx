'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  TrendingUp, Flame, BookOpen, Target, Bell, Search,
  ChevronDown, ArrowUpRight, Play, Zap, Award, Clock,
  BarChart2, ChevronRight, GraduationCap, Star, Trophy
} from 'lucide-react'

// ─── Composants graphiques ────────────────────────────────────────────────────

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

function ProgressChart({ data }: { data: { day: string, score: number }[] }) {
  const max = Math.max(...data.map(d => d.score), 1)
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

function ProgressBar({ value, color = 'bg-green-500' }: { value: number, color?: string }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ─── Données par série BAC ────────────────────────────────────────────────────

const SERIE_CONFIG: Record<string, {
  label: string
  badge: string
  color: string
  bg: string
  matieresPrincipales: string[]
  objectifNote: number
}> = {
  S: {
    label: 'Série S',
    badge: '🔬',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    matieresPrincipales: ['MATH', 'PC', 'SVT', 'FR'],
    objectifNote: 14,
  },
  L: {
    label: 'Série L',
    badge: '📚',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
    matieresPrincipales: ['FR', 'PHILO', 'HG', 'ANG'],
    objectifNote: 13,
  },
  G: {
    label: 'Série G',
    badge: '📊',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
    matieresPrincipales: ['ECO', 'MATH', 'HG', 'FR'],
    objectifNote: 12,
  },
  T: {
    label: 'Série T',
    badge: '🔧',
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950',
    matieresPrincipales: ['MATH', 'PC', 'ECO', 'FR'],
    objectifNote: 13,
  },
}

const CLASSE_LABELS: Record<string, string> = {
  seconde: 'Seconde',
  premiere: 'Première',
  terminale: 'Terminale',
}

const MATIERE_CONFIG: Record<string, { bg: string, text: string, icon: string, nom: string }> = {
  MATH:  { bg: 'bg-blue-100 dark:bg-blue-900',   text: 'text-blue-600',   icon: '📐', nom: 'Mathématiques' },
  PC:    { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600', icon: '⚗️', nom: 'Physique-Chimie' },
  SVT:   { bg: 'bg-green-100 dark:bg-green-900',  text: 'text-green-600',  icon: '🌿', nom: 'Sciences de la Vie' },
  FR:    { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600', icon: '📖', nom: 'Français' },
  HG:    { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600', icon: '🌍', nom: 'Histoire-Géo' },
  ANG:   { bg: 'bg-pink-100 dark:bg-pink-900',    text: 'text-pink-600',   icon: '🇬🇧', nom: 'Anglais' },
  PHILO: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600', icon: '🏛️', nom: 'Philosophie' },
  ECO:   { bg: 'bg-teal-100 dark:bg-teal-900',    text: 'text-teal-600',   icon: '📊', nom: 'Économie' },
}

function getMatiereStyle(code: string) {
  return MATIERE_CONFIG[code?.toUpperCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600', icon: '📚', nom: 'Autre' }
}

function getProgressLabel(pct: number) {
  if (pct >= 80) return { label: 'Très bon niveau', color: 'text-green-600', dot: 'bg-green-500' }
  if (pct >= 50) return { label: 'À améliorer', color: 'text-orange-500', dot: 'bg-orange-400' }
  return { label: 'En difficulté', color: 'text-red-500', dot: 'bg-red-400' }
}

// Message de motivation selon heure + données utilisateur
function getMotivationMessage(prenom: string, streak: number, xp: number, classe: string): string {
  const h = new Date().getHours()
  if (streak >= 7) return `${prenom}, ${streak} jours d'affilée 🔥 Impressionnant !`
  if (xp === 0) return `Bienvenue ${prenom} ! Ton aventure commence ici 🚀`
  if (h < 12) return `Bonne journée ${prenom}, prêt à apprendre ?`
  if (h < 18) return `Continue comme ça ${prenom}, tu es sur la bonne voie !`
  return `Beau travail aujourd'hui ${prenom} 💪`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  profile: any
  matieres: any[]
  progressions: any[]
  examens: any[]
  badges: any[]
  objectifsJour: { examens: number; cours: number }
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardClient({ profile, matieres, progressions, examens, badges, objectifsJour }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  // Données profil
  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'
  const xp = profile?.xp ?? 0
  const niveau = profile?.niveau ?? 1
  const streak = profile?.streak ?? 0
  const serie = (profile?.serie ?? 'S').toUpperCase()
  const classe = profile?.classe ?? 'terminale'
  const serieConf = SERIE_CONFIG[serie] ?? SERIE_CONFIG['S']
  const classeLabel = CLASSE_LABELS[classe] ?? 'Terminale'

  // Stats réelles
  const examensCount = examens.length
  const moyenneReelle = examens.length > 0
    ? examens.reduce((acc: number, e: any) => acc + (e.note ?? 0), 0) / examens.length
    : null
  const coursTermines = progressions.filter((p: any) => p.termine).length
  const xpPourProchain = niveau * 200
  const progression = Math.min(Math.round((xp % xpPourProchain) / xpPourProchain * 100), 100)

  // Message de salutation personnalisé
  const motivationMsg = getMotivationMessage(prenom, streak, xp, classe)

  // Graphique 7 jours — notes réelles si dispo, sinon tendance progressive
  const jours = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const chartData = jours.map((day, i) => {
    const examenJour = examens[examens.length - 7 + i]
    return {
      day,
      score: examenJour?.note ?? [6, 9, 8, 12, 10, 14, moyenneReelle ?? 13][i],
    }
  })

  // Dernière progression en cours
  const enCours = progressions.find((p: any) => !p.termine)
  const titreCours = enCours?.cours?.titre ?? 'Commence ton premier cours'
  const pctCours = enCours ? Math.min(Math.round(((enCours.chapitre_actuel ?? 1) / (enCours.total_chapitres ?? 10)) * 100), 100) : 0

  // Matières pour ce profil (triées selon série)
  const matieresProfilCodes = serieConf.matieresPrincipales
  const matieresFiltrees = matieres.length > 0
    ? matieresProfilCodes
        .map(code => matieres.find((m: any) => m.code?.toUpperCase() === code) ?? { code, nom: getMatiereStyle(code).nom })
        .filter(Boolean)
        .slice(0, 4)
    : matieresProfilCodes.map(code => ({ code, nom: getMatiereStyle(code).nom }))

  // Progression par matière (basée sur les examens)
  const pctParMatiere = (code: string) => {
    const examsMatiere = examens.filter((e: any) => e.matiere_code === code || (Array.isArray(e.matieres) && e.matieres.includes(code)))
    if (examsMatiere.length === 0) return 65 + Math.round(Math.random() * 20)
    const moy = examsMatiere.reduce((a: number, e: any) => a + (e.note ?? 0), 0) / examsMatiere.length
    return Math.round((moy / 20) * 100)
  }

  const matieresPrincipales = matieresFiltrees.map((m: any) => ({
    ...m,
    pct: pctParMatiere(m.code),
  }))

  // Matière la moins performante → recommandation IA
  const matiereFailble = [...matieresPrincipales].sort((a, b) => a.pct - b.pct)[0]
  const matiereFaibleStyle = getMatiereStyle(matiereFailble?.code ?? 'MATH')

  // Activité récente
  const activiteRecente = [
    ...examens.slice(0, 3).map((e: any) => ({
      type: 'examen',
      titre: `Examen ${e.matiere_code ? getMatiereStyle(e.matiere_code).nom : 'BAC'}`,
      note: `${(e.note ?? 0).toFixed(1)} / 20`,
      time: formatRelativeTime(e.created_at),
      icon: '📝',
      couleur: e.note >= 10 ? 'text-green-600' : 'text-red-500',
    })),
    ...progressions.slice(0, 3).map((p: any) => ({
      type: 'cours',
      titre: p.cours?.titre ?? 'Cours consulté',
      note: '+30 XP',
      time: formatRelativeTime(p.updated_at),
      icon: '📚',
      couleur: 'text-green-600',
    })),
  ].slice(0, 3)

  const activite = activiteRecente.length > 0 ? activiteRecente : [
    { type: 'examen', titre: 'Commence un examen simulé', note: '—', time: 'Maintenant', icon: '📝', couleur: 'text-gray-400' },
    { type: 'cours', titre: 'Explore tes cours', note: '—', time: 'Maintenant', icon: '📚', couleur: 'text-gray-400' },
  ]

  // Objectifs du jour personnalisés
  const objectifsDuJour = [
    {
      label: `Faire ${examensCount >= 3 ? 5 : 3} exercices`,
      done: objectifsJour.cours >= 3,
      xp: 50,
      href: '/exercices',
    },
    {
      label: `Lire 1 cours ${classeLabel}`,
      done: objectifsJour.cours >= 1,
      xp: 30,
      href: '/cours',
    },
    {
      label: 'Consulter le Coach IA',
      done: false,
      xp: 20,
      href: '/coach',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header desktop ──────────────────────────────────────────────── */}
      <header className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl ${serieConf.bg} flex items-center justify-center text-xl`}>
            {serieConf.badge}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-base">{motivationMsg}</h1>
            <p className="text-xs text-gray-400">{classeLabel} · {serieConf.label} · Niveau {niveau}</p>
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
          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950 text-orange-500 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              {streak}j
            </div>
          )}
          {/* XP */}
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            {xp} XP
          </div>
          <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-100 transition">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={`w-9 h-9 rounded-xl ${serieConf.bg} flex items-center justify-center font-bold text-sm ${serieConf.color}`}>
              {prenom.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{prenom}</p>
              <p className="text-xs text-gray-400">{classeLabel} {serieConf.label}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="p-3 sm:p-5 max-w-7xl mx-auto space-y-3 sm:space-y-5">

        {/* Salutation mobile personnalisée */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${serieConf.bg} flex items-center justify-center text-base flex-shrink-0`}>
                {serieConf.badge}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 dark:text-white text-sm truncate">{motivationMsg}</h1>
                <p className="text-[10px] text-gray-400">{classeLabel} · {serieConf.label}</p>
              </div>
            </div>
            <button className="relative w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* ── LIGNE 1 — Stat cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              label: 'Examens',
              value: examensCount || '—',
              sub: examensCount > 0 ? `+${Math.min(examensCount, 3)} cette sem.` : 'Passe ton premier',
              trend: [4, 7, 5, 9, 11, 14, examensCount || 0],
              color: 'text-green-600',
              icon: '📝',
              sparkColor: '#16a34a',
            },
            {
              label: 'Moyenne',
              value: moyenneReelle !== null ? `${moyenneReelle.toFixed(1)}/20` : '—',
              sub: moyenneReelle !== null
                ? moyenneReelle >= serieConf.objectifNote ? '✓ Objectif atteint' : `Objectif : ${serieConf.objectifNote}/20`
                : `Objectif : ${serieConf.objectifNote}/20`,
              trend: [10, 11, 12, 12.5, 13, 13.8, moyenneReelle ?? 0],
              color: moyenneReelle !== null && moyenneReelle >= serieConf.objectifNote ? 'text-green-600' : 'text-blue-600',
              icon: '📊',
              sparkColor: '#2563eb',
            },
            {
              label: 'Niveau XP',
              value: `Niv. ${niveau}`,
              sub: `${xp % xpPourProchain}/${xpPourProchain} XP`,
              trend: [20, 30, 40, 48, 55, 65, progression],
              color: 'text-purple-600',
              icon: '⚡',
              sparkColor: '#9333ea',
            },
            {
              label: 'Streak',
              value: streak > 0 ? `${streak}j` : '—',
              sub: streak > 0 ? `${streak >= 7 ? '🔥 En feu !' : `${streak} jours de suite`}` : 'Lance-toi !',
              trend: [1, 2, 3, 4, 5, 6, streak || 0],
              color: 'text-orange-500',
              icon: '🔥',
              sparkColor: '#f97316',
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
              <Sparkline values={stat.trend} color={stat.sparkColor} />
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── LIGNE 2 — Cours + Graphique + Recommandé ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">

          {/* Cours en cours */}
          <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 overflow-hidden">
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)' }} />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {enCours ? 'En cours' : `${classeLabel} · ${serieConf.label}`}
              </span>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-0.5 truncate">
                    {enCours ? 'Continuer ton cours' : 'Commence maintenant'}
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-1">{titreCours}</p>
                  {enCours && (
                    <>
                      <p className="text-xs text-gray-400 mb-1">Progression : {pctCours}%</p>
                      <ProgressBar value={pctCours} color="bg-green-500" />
                    </>
                  )}
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
                {enCours ? 'Continuer' : 'Commencer'}
              </Link>
            </div>
          </div>

          {/* Graphique + Recommandé côte à côte sur mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:contents">

            {/* Graphique progression 7 jours */}
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                    {moyenneReelle !== null ? 'Mes notes' : 'Progression'}
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">7j</span>
              </div>
              <div className="flex items-end gap-1 mt-1 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {moyenneReelle !== null ? moyenneReelle.toFixed(1) : niveau}
                </span>
                <span className="text-gray-400 text-xs mb-1">
                  {moyenneReelle !== null ? '/20' : 'e niv.'}
                </span>
              </div>
              <ProgressChart data={chartData} />
            </div>

            {/* Recommandé IA — basé sur la matière la moins performante */}
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Recommandé</h3>
                <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-medium">
                  <Zap className="w-2.5 h-2.5" /> IA
                </span>
              </div>
              <div className={`${matiereFaibleStyle.bg.split(' ')[0]} rounded-xl p-3 mb-3`}>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/50 rounded-xl flex items-center justify-center text-xl sm:text-2xl">
                    {matiereFaibleStyle.icon}
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white text-center mb-1 line-clamp-2">
                  {matiereFailble?.pct < 70
                    ? `Révise ${matiereFailble?.nom ?? matiereFaibleStyle.nom}`
                    : `Approfondis en ${matiereFailble?.nom ?? matiereFaibleStyle.nom}`}
                </p>
                <p className="text-[10px] text-gray-500 text-center hidden sm:block">
                  {matiereFailble?.pct < 70
                    ? 'Ce chapitre mérite plus d\'entraînement.'
                    : 'Progresse encore pour viser l\'excellence.'}
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

        {/* ── LIGNE 3 — Matières de la série ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Matières <span className={`${serieConf.color} font-bold`}>{serieConf.label}</span>
              </h3>
            </div>
            <Link href="/cours" className="text-xs text-green-600 font-medium flex items-center gap-1">
              Voir toutes <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {matieresPrincipales.map((m: any, i: number) => {
              const style = getMatiereStyle(m.code)
              const prog = getProgressLabel(m.pct)
              return (
                <Link key={i} href={`/cours?matiere=${m.code?.toLowerCase()}`}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-200 hover:shadow-sm transition-all">
                  <div className={`w-8 h-8 ${style.bg.split(' ')[0]} rounded-lg flex items-center justify-center text-lg mb-2`}>
                    {style.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{m.nom ?? style.nom}</p>
                  <p className={`text-base sm:text-lg font-bold ${style.text}`}>{m.pct}%</p>
                  <ProgressBar value={m.pct} color={m.pct >= 80 ? 'bg-green-500' : m.pct >= 50 ? 'bg-orange-400' : 'bg-red-400'} />
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${prog.dot}`} />
                    <span className={`text-[10px] sm:text-xs truncate ${prog.color}`}>{prog.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── LIGNE 4 — Objectifs du jour + Activité récente ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">

          {/* Objectifs du jour personnalisés */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-green-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Objectifs du jour</h3>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${serieConf.bg} ${serieConf.color}`}>
                {classeLabel}
              </span>
            </div>
            {/* Progression vers le BAC */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="flex-shrink-0 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{progression}%</p>
                <p className="text-[10px] text-gray-400">Bac {serie}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Niveau {niveau} → {niveau + 1}</p>
                  <p className="text-[10px] text-gray-400">{xp % xpPourProchain}/{xpPourProchain} XP</p>
                </div>
                <ProgressBar value={progression} />
              </div>
            </div>
            {/* Liste objectifs */}
            <div className="space-y-2">
              {objectifsDuJour.map((obj, i) => (
                <Link key={i} href={obj.href}
                  className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-1 py-0.5 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${obj.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {obj.done && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <span className={`text-xs truncate ${obj.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {obj.label}
                    </span>
                  </div>
                  <span className="text-[10px] bg-green-50 dark:bg-green-950 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-1">
                    +{obj.xp} XP
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/orientation"
              className="mt-3 flex items-center justify-center gap-2 w-full border border-green-200 dark:border-green-800 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 text-xs font-semibold px-3 py-2 rounded-xl transition">
              <BarChart2 className="w-3.5 h-3.5" />
              Voir mon analyse
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
              {activite.map((act: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{act.titre}</p>
                    <p className="text-[10px] text-gray-400">{act.time}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs font-bold ${act.couleur ?? 'text-green-600'}`}>{act.note}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
            {/* Badges */}
            {badges.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Mes badges</span>
                  <span className="ml-auto text-[10px] text-gray-400">{badges.length} obtenu{badges.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {badges.map((ub: any, i: number) => (
                    <div key={i} className="w-8 h-8 bg-yellow-50 dark:bg-yellow-950 rounded-lg flex items-center justify-center text-base shadow-sm"
                      title={ub.badges?.nom}>
                      {ub.badges?.icone ?? '🏅'}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Link href="/classement" className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 transition">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  Gagne ton premier badge →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Récemment'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Il y a ${minutes || 1} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}
