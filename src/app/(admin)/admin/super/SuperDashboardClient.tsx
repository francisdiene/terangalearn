'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Users, FileText, Flag, AlertTriangle, CheckCircle2, Ban,
  Megaphone, Package, Trash2, BookOpen, GraduationCap,
  FileCheck, Activity, TrendingUp, Sparkles, RefreshCw, LayoutDashboard,
  Bell, Search, ChevronRight, Zap, Award, BarChart2,
  Settings, Eye, UserCheck, MessageSquare, Database, Cpu, Lock,
  ChevronDown, ChevronUp, Circle, Server, Wifi, Radio,
  Swords, Trophy, Star, CreditCard, ShoppingCart, PieChart,
  FileBarChart, Clock, Terminal, AlertCircle, UserCog,
  ClipboardList, ToggleLeft, Gauge, Building2,
  X, Check, ArrowUpRight, ArrowDownRight, Minus,
  SlidersHorizontal, Download, Filter, MoreVertical,
  Layers, Map, Target, Notebook
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey =
  | 'overview' | 'analytics' | 'activite'
  | 'services' | 'monitoring_ia' | 'journaux' | 'incidents'
  | 'utilisateurs' | 'apprentissage' | 'contenus' | 'epreuves' | 'progression'
  | 'communaute' | 'signalements' | 'duels' | 'xp' | 'notifications'
  | 'premium' | 'paiements' | 'offres'
  | 'admins' | 'securite' | 'audit' | 'parametres'

interface NavGroup {
  key: string
  label: string
  icon: React.ElementType
  color: string
  items: NavItem[]
}

interface NavItem {
  key: TabKey
  label: string
  icon: React.ElementType
  badge?: (s: AllStats) => number | null
  soon?: boolean
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  banni: boolean
  nb_avertissements: number
  plan?: string
  niveau?: string
  serie?: string
}

interface PostWithAuthor {
  id: string
  titre: string
  user_id: string
  created_at: string
  nb_signalements?: number
  profiles?: { full_name: string } | null
}

interface PlateformeStats {
  totalEleves: number
  nouveaux7j: number
  nouveaux30j: number
  totalCours: number
  coursAvecResume: number
  totalEpreuves: number
  totalExamens: number
  examens7j: number
  actifs7j: number
  actifs30j: number
  totalExercices: number
  inscritsAujourdhui: number
  totalDuels: number
  duels7j: number
  totalPremium: number
}

interface AllStats {
  totalUsers: number
  totalPosts: number
  signalements: number
  sanctionsActives: number
}

// ─── Navigation ──────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'pilotage',
    label: 'Pilotage',
    icon: Gauge,
    color: 'text-emerald-400',
    items: [
      { key: 'overview',   label: 'Vue d\'ensemble',      icon: LayoutDashboard },
      { key: 'analytics',  label: 'Analytics globales',   icon: BarChart2 },
      { key: 'activite',   label: 'Activité récente',     icon: Activity },
    ],
  },
  {
    key: 'supervision',
    label: 'Supervision',
    icon: Server,
    color: 'text-sky-400',
    items: [
      { key: 'services',      label: 'État des services',  icon: Wifi },
      { key: 'monitoring_ia', label: 'Monitoring IA',      icon: Cpu },
      { key: 'journaux',      label: 'Journaux techniques',icon: Terminal, soon: true },
      { key: 'incidents',     label: 'Incidents & alertes',icon: AlertCircle, soon: true },
    ],
  },
  {
    key: 'scolaire',
    label: 'Gestion scolaire',
    icon: GraduationCap,
    color: 'text-violet-400',
    items: [
      { key: 'utilisateurs', label: 'Utilisateurs & élèves', icon: Users,       badge: s => s.totalUsers },
      { key: 'apprentissage',label: 'Apprentissage',         icon: BookOpen },
      { key: 'contenus',     label: 'Contenus pédagogiques', icon: Package },
      { key: 'epreuves',     label: 'Annales & épreuves',    icon: FileCheck },
      { key: 'progression',  label: 'Progression scolaire',  icon: TrendingUp,  soon: true },
    ],
  },
  {
    key: 'engagement',
    label: 'Engagement',
    icon: Radio,
    color: 'text-orange-400',
    items: [
      { key: 'communaute',    label: 'Communauté',           icon: MessageSquare },
      { key: 'signalements',  label: 'Modération',           icon: Flag, badge: s => s.signalements || null },
      { key: 'duels',         label: 'Mode Duel',            icon: Swords },
      { key: 'xp',            label: 'XP & classements',     icon: Trophy, soon: true },
      { key: 'notifications', label: 'Notifications',        icon: Bell },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    icon: CreditCard,
    color: 'text-amber-400',
    items: [
      { key: 'premium',    label: 'Abonnements Premium', icon: Zap },
      { key: 'paiements',  label: 'Paiements',           icon: ShoppingCart, soon: true },
      { key: 'offres',     label: 'Gestion des offres',  icon: Star, soon: true },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Shield,
    color: 'text-red-400',
    items: [
      { key: 'admins',     label: 'Administrateurs',  icon: UserCog },
      { key: 'securite',   label: 'Sécurité',         icon: Lock, soon: true },
      { key: 'audit',      label: 'Audit Log',        icon: ClipboardList },
      { key: 'parametres', label: 'Paramètres',       icon: Settings, soon: true },
    ],
  },
]

const ROLE_COLORS: Record<string, string> = {
  eleve:       'bg-zinc-800 text-zinc-400',
  ambassadeur: 'bg-blue-900/60 text-blue-300',
  moderateur:  'bg-purple-900/60 text-purple-300',
  admin:       'bg-orange-900/60 text-orange-300',
  super_admin: 'bg-red-900/60 text-red-300 font-bold',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function KPICard({
  label, value, sub, icon: Icon, color = 'text-emerald-400', trend, onClick
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color?: string; trend?: 'up' | 'down' | 'flat'; onClick?: () => void
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5',
        'hover:border-white/[0.12] transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-[#111520]'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-zinc-500 font-medium leading-tight">{label}</p>
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', color)} />
      </div>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-black tabular-nums', color)}>
          {typeof value === 'number' ? fmt(value) : value}
        </p>
        {trend && <TrendIcon className={cn('w-4 h-4 mb-1', trendColor)} />}
      </div>
      {sub && <p className="text-[11px] text-zinc-600 mt-1.5 leading-tight">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden', className)}>
      {children}
    </div>
  )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
      <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{title}</p>
      {action}
    </div>
  )
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'error' | 'unknown' }) {
  const cls = {
    ok: 'bg-emerald-400',
    warn: 'bg-amber-400',
    error: 'bg-red-500 animate-pulse',
    unknown: 'bg-zinc-600',
  }[status]
  return <span className={cn('inline-block w-2 h-2 rounded-full', cls)} />
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuperDashboardClient({
  currentUserId, stats, recentUsers, recentSignalements, sanctions,
  auditLog, recentPosts, plateformeStats, topEleves, recentExamens,
  recentSubscriptions, inscriptionsChart, niveauxRepartition,
}: {
  currentUserId: string
  stats: AllStats
  recentUsers: Profile[]
  recentSignalements: any[]
  sanctions: any[]
  auditLog: any[]
  recentPosts: PostWithAuthor[]
  plateformeStats: PlateformeStats
  topEleves: any[]
  recentExamens: any[]
  recentSubscriptions: any[]
  inscriptionsChart: { date: string; count: number }[]
  niveauxRepartition: { niveau: string; count: number }[]
}) {
  const [tab, setTab]           = useState<TabKey>('overview')
  const [users, setUsers]       = useState(recentUsers)
  const [loading, setLoading]   = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pilotage: true, supervision: false, scolaire: false,
    engagement: false, business: false, administration: false,
  })
  const supabase = createClient()

  // Contenu state
  const [posts, setPosts]           = useState<PostWithAuthor[]>(recentPosts)
  const [matieres, setMatieres]     = useState<any[]>([])
  const [chapitres, setChapitres]   = useState<any[]>([])
  const [matieresFetched, setMatieresFetched] = useState(false)
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null)

  // Annonces / notifications
  const [annonces, setAnnonces]         = useState<any[]>([])
  const [annoncesFetched, setAnnoncesFetched] = useState(false)
  const [annonceError, setAnnonceError] = useState<string | null>(null)
  const [annonceSaving, setAnnonceSaving] = useState(false)
  const [annonceTitre, setAnnonceTitre]   = useState('')
  const [annonceMessage, setAnnonceMessage] = useState('')
  const [annonceType, setAnnonceType] = useState<'info' | 'success' | 'warning' | 'alert'>('info')
  const [annoncePushResult, setAnnoncePushResult] = useState<string | null>(null)

  // Premium state
  const [premiumUsers, setPremiumUsers]   = useState<any[]>([])
  const [premiumFetched, setPremiumFetched] = useState(false)

  // Bulk resume state
  const [bulkResumeLoading, setBulkResumeLoading] = useState(false)
  const [bulkResumeResult, setBulkResumeResult]   = useState<string | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const goTab = (key: TabKey) => {
    setTab(key)
    // Ouvrir le groupe qui contient cet onglet
    for (const g of NAV_GROUPS) {
      if (g.items.some(i => i.key === key)) {
        setOpenGroups(prev => ({ ...prev, [g.key]: true }))
        break
      }
    }
    if (key === 'contenus') { fetchMatieres(); fetchAnnonces() }
    if (key === 'notifications') fetchAnnonces()
    if (key === 'premium') fetchPremiumUsers()
  }

  const changerRole = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole !== 'super_admin') {
      if (!confirm('Tu vas changer ton propre rôle. Continuer ?')) return
    }
    setLoading(userId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setLoading(null)
  }

  const toggleBan = async (user: Profile) => {
    if (user.id === currentUserId) return
    setLoading(user.id)
    await supabase.from('profiles').update({ banni: !user.banni }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banni: !user.banni } : u))
    setLoading(null)
  }

  const supprimerPost = async (postId: string) => {
    if (!confirm('Supprimer définitivement ce post ?')) return
    setLoading(`post-${postId}`)
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) setPosts(prev => prev.filter(p => p.id !== postId))
    setLoading(null)
  }

  const fetchMatieres = async () => {
    if (matieresFetched) return
    const { data: matiereData } = await supabase.from('matieres').select('id, nom, code, icone, couleur, classe').order('nom')
    const { data: chapitreData } = await supabase.from('chapitres').select('id, matiere_id, titre, ordre').order('ordre')
    setMatieres(matiereData ?? [])
    setChapitres(chapitreData ?? [])
    setMatieresFetched(true)
  }

  const fetchAnnonces = async () => {
    if (annoncesFetched) return
    try {
      const { data, error } = await supabase.from('annonces')
        .select('id, message, created_at, created_by').order('created_at', { ascending: false }).limit(5)
      if (error) setAnnonceError('Table annonces non créée')
      else setAnnonces(data ?? [])
    } catch { setAnnonceError('Table annonces non créée') }
    setAnnoncesFetched(true)
  }

  const fetchPremiumUsers = async () => {
    if (premiumFetched) return
    const { data } = await supabase.from('profiles')
      .select('id, full_name, email, plan, plan_expires_at, plan_started_at')
      .neq('plan', 'free').order('plan_started_at', { ascending: false })
    setPremiumUsers(data ?? [])
    setPremiumFetched(true)
  }

  const publierAnnonce = async () => {
    if (!annonceMessage.trim()) return
    setAnnonceSaving(true)
    setAnnonceError(null)
    setAnnoncePushResult(null)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: annonceTitre.trim() || 'Annonce TerangaLearn',
          message: annonceMessage.trim(),
          type: annonceType,
          url: '/dashboard',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAnnonceError(data.error ?? 'Erreur lors de l\'envoi')
      } else {
        const pushInfo = data.pushSent > 0
          ? `Envoyé à ${data.pushSent} appareil${data.pushSent > 1 ? 's' : ''}`
          : 'Notification in-app publiée'
        setAnnoncePushResult(pushInfo + (data.warning ? ' (push désactivé)' : ''))
        setAnnonces(prev => [{
          id: data.notificationId,
          message: annonceMessage.trim(),
          created_at: new Date().toISOString(),
          created_by: 'super_admin',
        }, ...prev].slice(0, 5))
        setAnnonceMessage('')
        setAnnonceTitre('')
      }
    } catch { setAnnonceError('Erreur réseau') }
    setAnnonceSaving(false)
  }

  const bulkGenerateResumes = async () => {
    setBulkResumeLoading(true)
    setBulkResumeResult(null)
    try {
      const { data: coursSanResume } = await supabase.from('cours')
        .select('id').or('resume.is.null,resume.lt.30').limit(50)
      if (!coursSanResume || coursSanResume.length === 0) {
        setBulkResumeResult('Tous les cours ont déjà un résumé.')
        setBulkResumeLoading(false)
        return
      }
      let count = 0
      for (const cours of coursSanResume) {
        try {
          const r = await fetch('/api/generate-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coursId: cours.id }),
          })
          if (r.ok) count++
          await new Promise(res => setTimeout(res, 500))
        } catch {}
      }
      setBulkResumeResult(`${count}/${coursSanResume.length} résumés générés`)
    } catch { setBulkResumeResult('Erreur lors de la génération') }
    setBulkResumeLoading(false)
  }

  const filteredUsers = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Current tab info ─────────────────────────────────────────────────────────

  let currentLabel = 'Administration'
  let currentIcon = LayoutDashboard
  for (const g of NAV_GROUPS) {
    const item = g.items.find(i => i.key === tab)
    if (item) { currentLabel = item.label; currentIcon = item.icon; break }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#0A0D14] overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-[#0E1118] border-r border-white/[0.06] transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white leading-none">TerangaLearn</p>
              <p className="text-[10px] text-emerald-400/70 font-semibold mt-0.5 uppercase tracking-wider">Centre de commandement</p>
            </div>
          )}
        </div>

        {/* Nav groupée */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {NAV_GROUPS.map(group => (
            <div key={group.key} className="mb-1">
              {/* Group header */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
                >
                  <group.icon className={cn('w-3 h-3', group.color)} />
                  <span className="flex-1 text-left">{group.label}</span>
                  {openGroups[group.key]
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              {sidebarCollapsed && (
                <div className="px-2 py-1">
                  <div className={cn('w-6 h-0.5 rounded mx-auto', group.color.replace('text-', 'bg-').replace('-400', '-500/30'))} />
                </div>
              )}

              {/* Group items */}
              {(openGroups[group.key] || sidebarCollapsed) && (
                <div>
                  {group.items.map(item => {
                    const active = tab === item.key
                    const badge = item.badge ? item.badge(stats) : null
                    return (
                      <button
                        key={item.key}
                        onClick={() => !item.soon && goTab(item.key)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-xs transition-all relative group/item',
                          active
                            ? 'text-white bg-white/[0.07]'
                            : item.soon
                              ? 'text-zinc-700 cursor-default'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]',
                          sidebarCollapsed && 'justify-center px-0 py-3'
                        )}
                      >
                        {active && !sidebarCollapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-r-full" />
                        )}
                        <item.icon className={cn(
                          'w-3.5 h-3.5 flex-shrink-0',
                          active ? 'text-emerald-400' : item.soon ? 'text-zinc-700' : ''
                        )} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            {item.soon && (
                              <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-wider">Bientôt</span>
                            )}
                            {badge !== null && badge !== undefined && !item.soon && (
                              <span className={cn(
                                'text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                active ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/20 text-red-400'
                              )}>
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </>
                        )}
                        {sidebarCollapsed && badge !== null && badge !== undefined && !item.soon && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[7px] font-black text-white flex items-center justify-center">
                            {badge > 9 ? '9+' : badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            <ChevronRight className="w-4 h-4 rotate-180 flex-shrink-0" />
            {!sidebarCollapsed && 'Retour app'}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform', !sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && 'Réduire le menu'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-[#0A0D14] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {(() => { const Icon = currentIcon; return <Icon className="w-4 h-4 text-zinc-500" /> })()}
            <div>
              <h1 className="text-sm font-bold text-white leading-none">{currentLabel}</h1>
              <p className="text-[10px] text-zinc-600 mt-0.5">Centre de commandement</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="w-52 bg-white/[0.04] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>
            {stats.signalements > 0 && (
              <button
                onClick={() => goTab('signalements')}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition"
              >
                <Bell className="w-4 h-4 text-zinc-400" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {stats.signalements > 9 ? '9+' : stats.signalements}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ════════════════════════════════════════════════════════════
              VUE D'ENSEMBLE
          ════════════════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-7">

              {/* KPI row 1 — Utilisateurs */}
              <div>
                <SectionTitle title="Utilisateurs" sub="Données en direct depuis Supabase" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Élèves inscrits"
                    value={plateformeStats.totalEleves}
                    sub={`+${plateformeStats.nouveaux7j} cette semaine`}
                    icon={Users}
                    color="text-blue-400"
                    trend="up"
                  />
                  <KPICard
                    label="Nouveaux (30 jours)"
                    value={plateformeStats.nouveaux30j}
                    sub={`${plateformeStats.inscritsAujourdhui} inscrits aujourd'hui`}
                    icon={TrendingUp}
                    color="text-emerald-400"
                  />
                  <KPICard
                    label="Actifs (7 jours)"
                    value={plateformeStats.actifs7j}
                    sub={`${plateformeStats.totalEleves > 0 ? Math.round(plateformeStats.actifs7j / plateformeStats.totalEleves * 100) : 0}% des inscrits`}
                    icon={Activity}
                    color="text-violet-400"
                  />
                  <KPICard
                    label="Actifs (30 jours)"
                    value={plateformeStats.actifs30j}
                    sub="via examens simulés"
                    icon={Gauge}
                    color="text-sky-400"
                  />
                </div>
              </div>

              {/* KPI row 2 — Pédagogie */}
              <div>
                <SectionTitle title="Pédagogie & contenu" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Examens simulés"
                    value={plateformeStats.totalExamens}
                    sub={`${plateformeStats.examens7j} cette semaine`}
                    icon={FileCheck}
                    color="text-orange-400"
                  />
                  <KPICard
                    label="Exercices disponibles"
                    value={plateformeStats.totalExercices}
                    sub={`${plateformeStats.totalEpreuves} épreuves`}
                    icon={BookOpen}
                    color="text-pink-400"
                  />
                  <KPICard
                    label="Cours publiés"
                    value={plateformeStats.totalCours}
                    sub={`${plateformeStats.coursAvecResume} avec résumé IA`}
                    icon={Sparkles}
                    color="text-amber-400"
                  />
                  <KPICard
                    label="Duels (total)"
                    value={plateformeStats.totalDuels}
                    sub={`${plateformeStats.duels7j} cette semaine`}
                    icon={Swords}
                    color="text-red-400"
                  />
                </div>
              </div>

              {/* KPI row 3 — Modération & business */}
              <div>
                <SectionTitle title="Modération & business" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Premium actifs"
                    value={plateformeStats.totalPremium}
                    sub="abonnements actifs"
                    icon={Zap}
                    color="text-amber-400"
                    onClick={() => goTab('premium')}
                  />
                  <KPICard
                    label="Signalements en attente"
                    value={stats.signalements}
                    sub={stats.signalements > 0 ? 'À traiter en priorité' : 'Aucun en attente'}
                    icon={Flag}
                    color={stats.signalements > 0 ? 'text-red-400' : 'text-zinc-500'}
                    trend={stats.signalements > 0 ? 'up' : undefined}
                    onClick={() => goTab('signalements')}
                  />
                  <KPICard
                    label="Sanctions actives"
                    value={stats.sanctionsActives}
                    sub="bans et avertissements"
                    icon={Ban}
                    color="text-zinc-400"
                  />
                  <KPICard
                    label="Posts communauté"
                    value={stats.totalPosts}
                    sub="publications totales"
                    icon={MessageSquare}
                    color="text-zinc-400"
                  />
                </div>
              </div>

              {/* Graphique inscriptions + récents inscrits */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Mini bar chart inscriptions */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader title="Inscriptions — 30 derniers jours" />
                    <div className="p-5">
                      <MiniBarChart data={inscriptionsChart} />
                    </div>
                  </Card>
                </div>

                {/* Répartition niveaux */}
                <Card>
                  <CardHeader title="Répartition par niveau" />
                  <div className="p-4 space-y-2">
                    {niveauxRepartition.length === 0 && (
                      <p className="text-xs text-zinc-600 py-4 text-center">Données non disponibles</p>
                    )}
                    {niveauxRepartition.map(({ niveau, count }) => {
                      const total = niveauxRepartition.reduce((a, b) => a + b.count, 0)
                      const pct = total > 0 ? Math.round(count / total * 100) : 0
                      return (
                        <div key={niveau}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-400 capitalize">{niveau || 'Non défini'}</span>
                            <span className="text-zinc-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>

              {/* Derniers examens + derniers inscrits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card>
                  <CardHeader
                    title="Examens récents"
                    action={
                      <span className="text-[10px] text-zinc-600">{recentExamens.length} résultats</span>
                    }
                  />
                  <div className="divide-y divide-white/[0.04]">
                    {recentExamens.slice(0, 8).map((e: any) => (
                      <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-200 font-medium truncate">
                            {e.profiles?.full_name ?? 'Utilisateur inconnu'}
                          </p>
                          <p className="text-[10px] text-zinc-600">{formatDate(e.created_at)}</p>
                        </div>
                        <span className={cn(
                          'text-xs font-black tabular-nums',
                          (e.score ?? 0) >= 50 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {e.score ?? '—'}/100
                        </span>
                      </div>
                    ))}
                    {recentExamens.length === 0 && (
                      <p className="text-xs text-zinc-600 py-6 text-center">Aucun examen encore</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader
                    title="Derniers inscrits"
                    action={
                      <button onClick={() => goTab('utilisateurs')} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition">
                        Voir tous
                      </button>
                    }
                  />
                  <div className="divide-y divide-white/[0.04]">
                    {recentUsers.slice(0, 8).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-black text-blue-400">
                            {(u.full_name ?? '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-200 font-medium truncate">{u.full_name}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600">{formatDate(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ANALYTICS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <SectionTitle title="Analytics globales" sub="Vue agrégée des métriques de la plateforme" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard label="Total utilisateurs" value={stats.totalUsers} icon={Users} color="text-blue-400" />
                <KPICard label="Élèves inscrits" value={plateformeStats.totalEleves} icon={GraduationCap} color="text-violet-400" />
                <KPICard label="Premium actifs" value={plateformeStats.totalPremium} icon={Zap} color="text-amber-400" />
                <KPICard label="Examens simulés" value={plateformeStats.totalExamens} icon={FileCheck} color="text-orange-400" />
                <KPICard label="Cours publiés" value={plateformeStats.totalCours} icon={BookOpen} color="text-pink-400" />
                <KPICard label="Épreuves" value={plateformeStats.totalEpreuves} icon={FileText} color="text-sky-400" />
              </div>
              <Card>
                <CardHeader title="Évolution des inscriptions — 30 jours" />
                <div className="p-6">
                  <MiniBarChart data={inscriptionsChart} height={120} />
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ACTIVITÉ
          ════════════════════════════════════════════════════════════ */}
          {tab === 'activite' && (
            <div className="space-y-6">
              <SectionTitle title="Activité récente" sub="Flux des événements importants sur la plateforme" />
              <ActivityFeed
                recentUsers={recentUsers}
                recentExamens={recentExamens}
                recentSignalements={recentSignalements}
                auditLog={auditLog}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ÉTAT DES SERVICES
          ════════════════════════════════════════════════════════════ */}
          {tab === 'services' && (
            <ServiceStatusTab />
          )}

          {/* ════════════════════════════════════════════════════════════
              MONITORING IA
          ════════════════════════════════════════════════════════════ */}
          {tab === 'monitoring_ia' && (
            <AIMonitoringTab />
          )}

          {/* ════════════════════════════════════════════════════════════
              UTILISATEURS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'utilisateurs' && (
            <div className="space-y-5">
              <SectionTitle title="Utilisateurs & élèves" sub={`${filteredUsers.length} résultats affichés`} />
              <Card>
                <div className="p-4 border-b border-white/[0.06] flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher par nom ou email…"
                      className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-5 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Utilisateur</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Rôle</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Niveau</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Plan</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Inscrit le</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Statut</th>
                        <th className="px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className={cn('hover:bg-white/[0.02] transition', u.banni && 'opacity-50')}>
                          <td className="px-5 py-3">
                            <div>
                              <p className="font-medium text-zinc-200">{u.full_name ?? '—'}</p>
                              <p className="text-zinc-600 text-[10px]">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={u.role}
                              onChange={e => changerRole(u.id, e.target.value)}
                              disabled={loading === u.id}
                              className={cn(
                                'text-[10px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none',
                                ROLE_COLORS[u.role] ?? 'bg-zinc-800 text-zinc-400'
                              )}
                            >
                              {['eleve', 'ambassadeur', 'moderateur', 'admin', 'super_admin'].map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3 text-zinc-500 capitalize">{u.niveau ?? '—'}</td>
                          <td className="px-3 py-3">
                            {u.plan && u.plan !== 'free' ? (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{u.plan}</span>
                            ) : (
                              <span className="text-zinc-700">Gratuit</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-zinc-500">{formatDate(u.created_at)}</td>
                          <td className="px-3 py-3">
                            {u.banni
                              ? <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Banni</span>
                              : <span className="text-[10px] text-emerald-400">Actif</span>}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => toggleBan(u)}
                              disabled={loading === u.id || u.id === currentUserId}
                              className={cn(
                                'text-[10px] px-2 py-1 rounded-lg border transition',
                                u.banni
                                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                  : 'border-red-500/30 text-red-400 hover:bg-red-500/10',
                                (loading === u.id || u.id === currentUserId) && 'opacity-40 cursor-not-allowed'
                              )}
                            >
                              {u.banni ? 'Débannir' : 'Bannir'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <p className="text-xs text-zinc-600 py-10 text-center">Aucun utilisateur trouvé</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              APPRENTISSAGE
          ════════════════════════════════════════════════════════════ */}
          {tab === 'apprentissage' && (
            <div className="space-y-6">
              <SectionTitle title="Apprentissage" sub="Vue pédagogique globale" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Examens simulés" value={plateformeStats.totalExamens} sub={`${plateformeStats.examens7j} cette semaine`} icon={FileCheck} color="text-orange-400" />
                <KPICard label="Cours publiés" value={plateformeStats.totalCours} sub={`${plateformeStats.coursAvecResume} avec résumé IA`} icon={BookOpen} color="text-violet-400" />
                <KPICard label="Épreuves" value={plateformeStats.totalEpreuves} icon={FileText} color="text-sky-400" />
                <KPICard label="Exercices" value={plateformeStats.totalExercices} icon={GraduationCap} color="text-pink-400" />
              </div>
              <Card>
                <CardHeader
                  title="Derniers examens simulés"
                  action={
                    <span className="text-[10px] text-zinc-600">{recentExamens.length} résultats</span>
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-5 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Élève</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Score</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recentExamens.map((e: any) => (
                        <tr key={e.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-5 py-3 text-zinc-200">{e.profiles?.full_name ?? 'Inconnu'}</td>
                          <td className="px-3 py-3">
                            <span className={cn('font-black', (e.score ?? 0) >= 50 ? 'text-emerald-400' : 'text-red-400')}>
                              {e.score ?? '—'}/100
                            </span>
                          </td>
                          <td className="px-3 py-3 text-zinc-500">{formatDate(e.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              CONTENUS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'contenus' && (
            <ContenuTab
              posts={posts}
              matieres={matieres}
              chapitres={chapitres}
              matieresFetched={matieresFetched}
              expandedMatiere={expandedMatiere}
              setExpandedMatiere={setExpandedMatiere}
              loading={loading}
              supprimerPost={supprimerPost}
              bulkResumeLoading={bulkResumeLoading}
              bulkResumeResult={bulkResumeResult}
              bulkGenerateResumes={bulkGenerateResumes}
              onFetchMatieres={fetchMatieres}
            />
          )}

          {/* ════════════════════════════════════════════════════════════
              ÉPREUVES
          ════════════════════════════════════════════════════════════ */}
          {tab === 'epreuves' && (
            <div className="space-y-6">
              <SectionTitle title="Annales & épreuves" sub="Gestion du contenu officiel BFEM et BAC" />
              <div className="grid grid-cols-2 gap-4">
                <KPICard label="Épreuves disponibles" value={plateformeStats.totalEpreuves} icon={FileCheck} color="text-sky-400" />
                <KPICard label="Exercices" value={plateformeStats.totalExercices} icon={FileText} color="text-violet-400" />
              </div>
              <Card>
                <CardHeader title="Répartition par examen" />
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    {['BFEM', 'BAC'].map(exam => (
                      <div key={exam} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                        <p className="text-xs font-bold text-zinc-300 mb-1">{exam}</p>
                        <p className="text-xs text-zinc-600">Données par filtre disponible depuis la gestion des épreuves</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              COMMUNAUTÉ
          ════════════════════════════════════════════════════════════ */}
          {tab === 'communaute' && (
            <div className="space-y-5">
              <SectionTitle title="Communauté" sub="Publications et activité des élèves" />
              <div className="grid grid-cols-2 gap-4">
                <KPICard label="Posts publiés" value={stats.totalPosts} icon={MessageSquare} color="text-blue-400" />
                <KPICard label="Signalements en attente" value={stats.signalements} icon={Flag} color={stats.signalements > 0 ? 'text-red-400' : 'text-zinc-500'} />
              </div>
              <Card>
                <CardHeader title="Posts récents" />
                <div className="divide-y divide-white/[0.04]">
                  {posts.slice(0, 15).map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 font-medium truncate">{p.titre || '(sans titre)'}</p>
                        <p className="text-[10px] text-zinc-600">par {p.profiles?.full_name ?? 'Inconnu'} · {formatDate(p.created_at)}</p>
                      </div>
                      {(p.nb_signalements ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          {p.nb_signalements} sig.
                        </span>
                      )}
                      <button
                        onClick={() => supprimerPost(p.id)}
                        disabled={loading === `post-${p.id}`}
                        className="text-zinc-700 hover:text-red-400 transition p-1 rounded flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              SIGNALEMENTS (MODÉRATION)
          ════════════════════════════════════════════════════════════ */}
          {tab === 'signalements' && (
            <div className="space-y-5">
              <SectionTitle title="Modération & signalements" sub={`${stats.signalements} en attente de traitement`} />
              <Card>
                <CardHeader title="Signalements en attente" />
                <div className="divide-y divide-white/[0.04]">
                  {recentSignalements.map((s: any) => (
                    <div key={s.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Flag className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 font-medium">{s.raison}</p>
                        <p className="text-[10px] text-zinc-600">{formatDate(s.created_at)}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        s.priorite === 'haute'
                          ? 'bg-red-500/20 text-red-400'
                          : s.priorite === 'moyenne'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-zinc-800 text-zinc-500'
                      )}>
                        {s.priorite ?? 'normale'}
                      </span>
                    </div>
                  ))}
                  {recentSignalements.length === 0 && (
                    <div className="flex items-center gap-3 px-5 py-8 text-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-xs text-zinc-500">Aucun signalement en attente</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Sanctions */}
              <Card>
                <CardHeader title="Sanctions récentes" />
                <div className="divide-y divide-white/[0.04]">
                  {sanctions.slice(0, 10).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200">{s.type_sanction} — {s.raison}</p>
                        <p className="text-[10px] text-zinc-600">
                          {formatDate(s.created_at)}{s.expire_le ? ` · expire ${formatDate(s.expire_le)}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sanctions.length === 0 && (
                    <p className="text-xs text-zinc-600 py-6 text-center">Aucune sanction</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              DUELS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'duels' && (
            <div className="space-y-6">
              <SectionTitle title="Mode Duel" sub="Statistiques des duels entre élèves" />
              <div className="grid grid-cols-2 gap-4">
                <KPICard label="Duels total" value={plateformeStats.totalDuels} icon={Swords} color="text-red-400" />
                <KPICard label="Duels cette semaine" value={plateformeStats.duels7j} icon={Activity} color="text-orange-400" />
              </div>
              <Card>
                <CardHeader title="Vue d'ensemble" />
                <div className="p-5">
                  <p className="text-xs text-zinc-500">Les données détaillées des duels (participants, résultats, matières) seront disponibles dans une prochaine mise à jour.</p>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              NOTIFICATIONS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'notifications' && (
            <NotificationsTab
              annonces={annonces}
              annonceError={annonceError}
              annonceSaving={annonceSaving}
              annonceTitre={annonceTitre}
              setAnnonceTitre={setAnnonceTitre}
              annonceMessage={annonceMessage}
              setAnnonceMessage={setAnnonceMessage}
              annonceType={annonceType}
              setAnnonceType={setAnnonceType}
              annoncePushResult={annoncePushResult}
              onPublier={publierAnnonce}
            />
          )}

          {/* ════════════════════════════════════════════════════════════
              PREMIUM
          ════════════════════════════════════════════════════════════ */}
          {tab === 'premium' && (
            <div className="space-y-5">
              <SectionTitle title="Abonnements Premium" sub={`${plateformeStats.totalPremium} abonnement${plateformeStats.totalPremium !== 1 ? 's' : ''} actif${plateformeStats.totalPremium !== 1 ? 's' : ''}`} />
              <KPICard label="Premium actifs" value={plateformeStats.totalPremium} icon={Zap} color="text-amber-400" sub="abonnements non-gratuits" />
              <Card>
                <CardHeader title="Utilisateurs premium" />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-5 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Utilisateur</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Plan</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Depuis</th>
                        <th className="text-left px-3 py-3 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">Expire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {premiumUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-5 py-3">
                            <p className="font-medium text-zinc-200">{u.full_name ?? '—'}</p>
                            <p className="text-[10px] text-zinc-600">{u.email}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{u.plan}</span>
                          </td>
                          <td className="px-3 py-3 text-zinc-500">{u.plan_started_at ? formatDate(u.plan_started_at) : '—'}</td>
                          <td className="px-3 py-3 text-zinc-500">{u.plan_expires_at ? formatDate(u.plan_expires_at) : 'Illimité'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {premiumUsers.length === 0 && !premiumFetched && (
                    <p className="text-xs text-zinc-600 py-6 text-center">Chargement…</p>
                  )}
                  {premiumUsers.length === 0 && premiumFetched && (
                    <p className="text-xs text-zinc-600 py-6 text-center">Aucun abonné premium pour l'instant</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ADMINISTRATEURS
          ════════════════════════════════════════════════════════════ */}
          {tab === 'admins' && (
            <div className="space-y-5">
              <SectionTitle title="Administrateurs" sub="Équipe d'administration de TerangaLearn" />
              <Card>
                <CardHeader title="Comptes administrateurs" />
                <div className="divide-y divide-white/[0.04]">
                  {users.filter(u => ['admin', 'super_admin', 'moderateur'].includes(u.role)).map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 font-medium">{u.full_name ?? '—'}</p>
                        <p className="text-[10px] text-zinc-600">{u.email}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ROLE_COLORS[u.role] ?? 'bg-zinc-800 text-zinc-400')}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                  {users.filter(u => ['admin', 'super_admin', 'moderateur'].includes(u.role)).length === 0 && (
                    <p className="text-xs text-zinc-600 py-6 text-center">Aucun admin dans les 50 derniers inscrits</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              AUDIT LOG
          ════════════════════════════════════════════════════════════ */}
          {tab === 'audit' && (
            <div className="space-y-5">
              <SectionTitle title="Audit Log" sub="Traçabilité des actions de modération" />
              <Card>
                <CardHeader title={`${auditLog.length} entrées récentes`} />
                <div className="divide-y divide-white/[0.04]">
                  {auditLog.map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200">
                          <span className="font-semibold text-emerald-400">{entry.action}</span>
                          {' '}sur{' '}
                          <span className="text-zinc-400">{entry.cible_type ?? '—'}</span>
                        </p>
                        <p className="text-[10px] text-zinc-600">{formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {auditLog.length === 0 && (
                    <p className="text-xs text-zinc-600 py-6 text-center">Aucune entrée dans l'audit log</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              PAGES BIENTÔT DISPONIBLES
          ════════════════════════════════════════════════════════════ */}
          {(['journaux', 'incidents', 'progression', 'xp', 'paiements', 'offres', 'securite', 'parametres'] as TabKey[]).includes(tab) && (
            <ComingSoon tab={tab} />
          )}

        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniBarChart({ data, height = 80 }: { data: { date: string; count: number }[]; height?: number }) {
  if (data.length === 0) return <p className="text-xs text-zinc-600 text-center py-4">Aucune donnée</p>
  const max = Math.max(...data.map(d => d.count), 1)
  // Show every 7th label
  const showLabel = (i: number) => i === 0 || i === data.length - 1 || i % 7 === 0
  return (
    <div>
      <div className="flex items-end gap-0.5" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d.count / max) * (height - 20)))
          return (
            <div
              key={d.date}
              className="flex-1 group relative flex flex-col justify-end"
              style={{ height: '100%' }}
            >
              <div
                className="w-full bg-emerald-500/70 hover:bg-emerald-400 rounded-sm transition-colors"
                style={{ height: `${h}px` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                <div className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[10px] text-zinc-200 whitespace-nowrap">
                  {d.date.slice(5)} · {d.count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-zinc-700">
        {data.map((d, i) => (
          <span key={d.date} className={cn('flex-1 text-center', !showLabel(i) && 'opacity-0 select-none')}>
            {d.date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActivityFeed({
  recentUsers, recentExamens, recentSignalements, auditLog,
}: { recentUsers: any[]; recentExamens: any[]; recentSignalements: any[]; auditLog: any[] }) {
  // Merge events
  const events = [
    ...recentUsers.slice(0, 5).map(u => ({
      type: 'inscription', date: u.created_at, label: `Nouvelle inscription : ${u.full_name ?? u.email}`,
      icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10',
    })),
    ...recentExamens.slice(0, 5).map(e => ({
      type: 'examen', date: e.created_at, label: `Examen terminé par ${e.profiles?.full_name ?? 'élève'} — ${e.score}/100`,
      icon: FileCheck, color: 'text-orange-400', bg: 'bg-orange-500/10',
    })),
    ...recentSignalements.slice(0, 3).map(s => ({
      type: 'signalement', date: s.created_at, label: `Signalement reçu : ${s.raison}`,
      icon: Flag, color: 'text-red-400', bg: 'bg-red-500/10',
    })),
    ...auditLog.slice(0, 5).map(a => ({
      type: 'audit', date: a.created_at, label: `Action admin : ${a.action} sur ${a.cible_type}`,
      icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)

  return (
    <Card>
      <CardHeader title="Flux d'activité" />
      <div className="divide-y divide-white/[0.04]">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', e.bg)}>
              <e.icon className={cn('w-3.5 h-3.5', e.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-200">{e.label}</p>
            </div>
            <span className="text-[10px] text-zinc-600 flex-shrink-0">{formatDate(e.date)}</span>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-xs text-zinc-600 py-6 text-center">Aucune activité récente</p>
        )}
      </div>
    </Card>
  )
}

function ServiceStatusTab() {
  const services = [
    { name: 'Application Next.js', key: 'nextjs', note: 'Vérifié via le rendu de cette page' },
    { name: 'Supabase DB', key: 'supabase_db', note: 'Connexion active si la page a chargé' },
    { name: 'Authentification Supabase', key: 'supabase_auth', note: 'Vérifié via cookie sa' },
    { name: 'Vercel Hosting', key: 'vercel', note: 'Vérifié via le déploiement actif' },
    { name: 'API Groq (Coach IA)', key: 'groq', note: 'État non vérifié en temps réel' },
    { name: 'Supabase Storage', key: 'storage', note: 'État non vérifié en temps réel' },
    { name: 'Web Push (VAPID)', key: 'push', note: 'Actif si clés VAPID configurées' },
  ]

  return (
    <div className="space-y-6">
      <SectionTitle
        title="État des services"
        sub="Supervision de l'infrastructure TerangaLearn"
      />
      <div className="grid gap-3">
        {services.map(svc => {
          const isVerified = ['nextjs', 'supabase_db', 'supabase_auth', 'vercel'].includes(svc.key)
          const status = isVerified ? 'ok' : 'unknown'
          return (
            <Card key={svc.key}>
              <div className="flex items-center gap-4 px-5 py-4">
                <StatusDot status={status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200">{svc.name}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{svc.note}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full',
                  status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' :
                  status === 'warn' ? 'bg-amber-500/15 text-amber-400' :
                  status === 'error' ? 'bg-red-500/15 text-red-400' :
                  'bg-zinc-800 text-zinc-500'
                )}>
                  {status === 'ok' ? 'Opérationnel' :
                   status === 'warn' ? 'Dégradé' :
                   status === 'error' ? 'Indisponible' : 'Non vérifié'}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-xs text-amber-400 font-semibold mb-1">Note sur la supervision</p>
        <p className="text-xs text-zinc-500">
          Les services marqués "Non vérifié" nécessitent des appels API dédiés pour confirmer leur état.
          Un monitoring actif (ping toutes les 5 minutes) sera disponible dans une prochaine mise à jour.
          Aucun service n'est affiché comme opérationnel sans vérification réelle.
        </p>
      </div>
    </div>
  )
}

function AIMonitoringTab() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Monitoring Coach IA"
        sub="Supervision de l'utilisation de Groq API"
      />
      <div className="p-5 bg-sky-500/5 border border-sky-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-zinc-200 mb-1">Table ai_logs requise</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Pour afficher les statistiques du Coach IA (nombre de requêtes, tokens consommés, temps de réponse, taux d'erreur),
              il faut créer une table <code className="text-sky-400 bg-sky-500/10 px-1 rounded">ai_logs</code> dans Supabase
              et enregistrer chaque appel Groq. Cette table n'est pas encore créée.
            </p>
            <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/[0.06]">
              <p className="text-[10px] text-zinc-600 font-mono mb-1">SQL à exécuter dans Supabase :</p>
              <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">{`CREATE TABLE ai_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  feature text,         -- 'coach', 'resume', 'exam'
  model text,
  tokens_in integer,
  tokens_out integer,
  duration_ms integer,
  success boolean,
  error_code text,
  created_at timestamptz DEFAULT now()
);`}</pre>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Requêtes totales', note: 'Nécessite ai_logs' },
          { label: 'Tokens consommés', note: 'Nécessite ai_logs' },
          { label: 'Temps moyen de réponse', note: 'Nécessite ai_logs' },
          { label: 'Taux de réussite', note: 'Nécessite ai_logs' },
          { label: 'Coût estimé', note: 'Estimation uniquement' },
          { label: 'Modèle utilisé', note: 'groq / openai-oss-120b' },
        ].map(item => (
          <div key={item.label} className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-zinc-500 mb-2">{item.label}</p>
            <p className="text-2xl font-black text-zinc-700">—</p>
            <p className="text-[10px] text-zinc-700 mt-1.5">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContenuTab({
  posts, matieres, chapitres, matieresFetched, expandedMatiere,
  setExpandedMatiere, loading, supprimerPost,
  bulkResumeLoading, bulkResumeResult, bulkGenerateResumes, onFetchMatieres,
}: any) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Contenus pédagogiques" sub="Cours, matières et chapitres" />

      {/* Bulk résumés */}
      <Card>
        <CardHeader title="Résumés IA en masse" />
        <div className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-zinc-400">Génère les résumés IA pour tous les cours qui n'en ont pas encore.</p>
            {bulkResumeResult && (
              <p className="text-xs text-emerald-400 mt-1">{bulkResumeResult}</p>
            )}
          </div>
          <button
            onClick={bulkGenerateResumes}
            disabled={bulkResumeLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition disabled:opacity-40"
          >
            <Sparkles className={cn('w-3.5 h-3.5', bulkResumeLoading && 'animate-spin')} />
            {bulkResumeLoading ? 'Génération…' : 'Générer résumés'}
          </button>
        </div>
      </Card>

      {/* Matières */}
      <Card>
        <CardHeader
          title="Matières & chapitres"
          action={
            !matieresFetched && (
              <button
                onClick={onFetchMatieres}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 transition"
              >
                Charger
              </button>
            )
          }
        />
        {!matieresFetched ? (
          <div className="p-5">
            <p className="text-xs text-zinc-600">Cliquez sur "Charger" pour afficher les matières.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {matieres.map((m: any) => {
              const matChapitres = chapitres.filter((c: any) => c.matiere_id === m.id)
              const isOpen = expandedMatiere === m.id
              return (
                <div key={m.id}>
                  <button
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition text-left"
                    onClick={() => setExpandedMatiere(isOpen ? null : m.id)}
                  >
                    <span className="text-lg">{m.icone}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200">{m.nom}</p>
                      <p className="text-[10px] text-zinc-600">{m.code} · {m.classe} · {matChapitres.length} chapitres</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                  </button>
                  {isOpen && (
                    <div className="bg-white/[0.02] border-t border-white/[0.04]">
                      {matChapitres.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 px-8 py-2">
                          <ChevronRight className="w-3 h-3 text-zinc-700" />
                          <span className="text-[10px] text-zinc-500">{c.ordre}.</span>
                          <span className="text-xs text-zinc-400">{c.titre}</span>
                        </div>
                      ))}
                      {matChapitres.length === 0 && (
                        <p className="px-8 py-2 text-[10px] text-zinc-700">Aucun chapitre</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {matieres.length === 0 && (
              <p className="text-xs text-zinc-600 py-6 text-center">Aucune matière trouvée</p>
            )}
          </div>
        )}
      </Card>

      {/* Posts récents */}
      <Card>
        <CardHeader title="Posts communauté récents" />
        <div className="divide-y divide-white/[0.04]">
          {posts.slice(0, 10).map((p: PostWithAuthor) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-200 font-medium truncate">{p.titre || '(sans titre)'}</p>
                <p className="text-[10px] text-zinc-600">par {p.profiles?.full_name ?? 'Inconnu'} · {formatDate(p.created_at)}</p>
              </div>
              {(p.nb_signalements ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  {p.nb_signalements} sig.
                </span>
              )}
              <button
                onClick={() => supprimerPost(p.id)}
                disabled={loading === `post-${p.id}`}
                className="text-zinc-700 hover:text-red-400 transition p-1 rounded flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function NotificationsTab({
  annonces, annonceError, annonceSaving, annonceTitre, setAnnonceTitre,
  annonceMessage, setAnnonceMessage, annonceType, setAnnonceType,
  annoncePushResult, onPublier,
}: any) {
  const TYPE_CONFIG = {
    info:    { label: 'Info',           color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
    success: { label: 'Succès',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    warning: { label: 'Avertissement',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
    alert:   { label: 'Alerte urgente', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  }
  const cfg = TYPE_CONFIG[annonceType as keyof typeof TYPE_CONFIG]

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle title="Notifications & annonces" sub="Envoyer un message à tous les élèves" />

      <Card>
        <CardHeader title="Nouvelle annonce" />
        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Type</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(t => (
                <button
                  key={t}
                  onClick={() => setAnnonceType(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
                    annonceType === t
                      ? cn(TYPE_CONFIG[t].color, TYPE_CONFIG[t].bg, TYPE_CONFIG[t].border)
                      : 'text-zinc-600 bg-transparent border-white/[0.07] hover:border-white/20'
                  )}
                >
                  {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Titre</label>
            <input
              value={annonceTitre}
              onChange={e => setAnnonceTitre(e.target.value)}
              placeholder="ex. Mise à jour des annales BFEM 2025"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 transition"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Message</label>
            <textarea
              value={annonceMessage}
              onChange={e => setAnnonceMessage(e.target.value)}
              rows={4}
              placeholder="Contenu de la notification…"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 transition resize-none"
            />
          </div>

          {/* Prévisualisation */}
          {annonceMessage.trim() && (
            <div className={cn('p-4 rounded-xl border', cfg.bg, cfg.border)}>
              <p className={cn('text-xs font-bold mb-1', cfg.color)}>{annonceTitre || 'Annonce TerangaLearn'}</p>
              <p className="text-xs text-zinc-400">{annonceMessage}</p>
            </div>
          )}

          {/* Erreur / succès */}
          {annonceError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400">{annonceError}</p>
            </div>
          )}
          {annoncePushResult && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400">{annoncePushResult}</p>
            </div>
          )}

          <button
            onClick={onPublier}
            disabled={!annonceMessage.trim() || annonceSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded-xl transition disabled:opacity-40"
          >
            <Megaphone className={cn('w-4 h-4', annonceSaving && 'animate-pulse')} />
            {annonceSaving ? 'Envoi en cours…' : 'Publier l\'annonce'}
          </button>
        </div>
      </Card>

      {/* Annonces précédentes */}
      {annonces.length > 0 && (
        <Card>
          <CardHeader title="Dernières annonces envoyées" />
          <div className="divide-y divide-white/[0.04]">
            {annonces.map((a: any) => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-xs text-zinc-300">{a.message}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{formatDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function ComingSoon({ tab }: { tab: TabKey }) {
  const labels: Partial<Record<TabKey, string>> = {
    journaux: 'Journaux techniques',
    incidents: 'Incidents & alertes',
    progression: 'Progression scolaire',
    xp: 'XP & classements',
    paiements: 'Paiements & transactions',
    offres: 'Gestion des offres',
    securite: 'Sécurité & gouvernance',
    parametres: 'Paramètres système',
  }
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5">
        <Clock className="w-7 h-7 text-zinc-600" />
      </div>
      <p className="text-sm font-bold text-zinc-300 mb-2">{labels[tab] ?? 'Page'}</p>
      <p className="text-xs text-zinc-600 max-w-sm leading-relaxed">
        Cette section est en cours de développement. Elle sera disponible dans une prochaine mise à jour de TerangaLearn.
      </p>
    </div>
  )
}
