'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Users, FileText, Flag, AlertTriangle, CheckCircle2, Ban,
  ChevronDown, Megaphone, Package, Trash2, BookOpen, GraduationCap,
  FileCheck, Activity, TrendingUp, Sparkles, RefreshCw, LayoutDashboard,
  LogOut, Bell, Search, ChevronRight, Zap, Award, BarChart2,
  Settings, Eye, UserCheck, MessageSquare, Database, Cpu, Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Tab = 'overview' | 'users' | 'signalements' | 'sanctions' | 'audit' | 'contenu' | 'plateforme' | 'premium'

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  banni: boolean
  nb_avertissements: number
}

interface PostWithAuthor {
  id: string
  titre: string
  user_id: string
  created_at: string
  nb_signalements?: number
  profiles?: { full_name: string } | null
}

interface Matiere {
  id: string
  nom: string
  code: string
  icone: string
  couleur: string
  classe: string
}

interface Chapitre {
  id: string
  matiere_id: string
  titre: string
  ordre: number
}

interface Annonce {
  id: string
  message: string
  created_at: string
  created_by: string
}

interface PlateformeStats {
  totalEleves: number
  nouveaux7j: number
  totalCours: number
  coursAvecResume: number
  totalEpreuves: number
  totalExamens: number
  actifs7j: number
}

const ROLE_COLORS: Record<string, string> = {
  eleve: 'bg-zinc-800 text-zinc-400',
  ambassadeur: 'bg-blue-900/60 text-blue-300',
  moderateur: 'bg-purple-900/60 text-purple-300',
  admin: 'bg-orange-900/60 text-orange-300',
  super_admin: 'bg-red-900/60 text-red-300 font-bold',
}

const NAV_ITEMS: { key: Tab; label: string; icon: React.ElementType; badge?: (s: any) => number | null }[] = [
  { key: 'overview',      label: 'Vue globale',     icon: LayoutDashboard },
  { key: 'plateforme',    label: 'Apprentissage',   icon: BookOpen },
  { key: 'premium',       label: 'Premium',         icon: Zap },
  { key: 'users',         label: 'Utilisateurs',    icon: Users,       badge: s => s.totalUsers },
  { key: 'signalements',  label: 'Signalements',    icon: Flag,        badge: s => s.signalements || null },
  { key: 'sanctions',     label: 'Sanctions',       icon: Lock,        badge: s => s.sanctionsActives || null },
  { key: 'contenu',       label: 'Contenu',         icon: Package },
  { key: 'audit',         label: 'Audit Log',       icon: Database },
]

export default function SuperDashboardClient({
  currentUserId,
  stats,
  recentUsers,
  recentSignalements,
  sanctions,
  auditLog,
  recentPosts,
  plateformeStats,
  topEleves,
  recentExamens,
}: {
  currentUserId: string
  stats: { totalUsers: number; totalPosts: number; signalements: number; sanctionsActives: number }
  recentUsers: Profile[]
  recentSignalements: any[]
  sanctions: any[]
  auditLog: any[]
  recentPosts: PostWithAuthor[]
  plateformeStats: PlateformeStats
  topEleves: any[]
  recentExamens: any[]
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [users, setUsers] = useState(recentUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [bulkResumeLoading, setBulkResumeLoading] = useState(false)
  const [bulkResumeResult, setBulkResumeResult] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const supabase = createClient()

  // Contenu state
  const [posts, setPosts] = useState<PostWithAuthor[]>(recentPosts)
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [chapitres, setChapitres] = useState<Chapitre[]>([])
  const [matieresFetched, setMatieresFetched] = useState(false)
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null)
  const [annonceMessage, setAnnonceMessage] = useState('')
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [annoncesFetched, setAnnoncesFetched] = useState(false)
  const [annonceError, setAnnonceError] = useState<string | null>(null)
  const [annonceSaving, setAnnonceSaving] = useState(false)

  // Premium state
  const [premiumUsers, setPremiumUsers] = useState<any[]>([])
  const [premiumFetched, setPremiumFetched] = useState(false)

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
      const { data, error } = await supabase.from('annonces').select('id, message, created_at, created_by').order('created_at', { ascending: false }).limit(5)
      if (error) setAnnonceError('Table annonces non créée')
      else setAnnonces(data ?? [])
    } catch { setAnnonceError('Table annonces non créée') }
    setAnnoncesFetched(true)
  }

  const fetchPremiumUsers = async () => {
    if (premiumFetched) return
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, plan, plan_expires_at, plan_started_at')
      .neq('plan', 'free')
      .order('plan_started_at', { ascending: false })
    setPremiumUsers(data ?? [])
    setPremiumFetched(true)
  }

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    if (newTab === 'contenu') { fetchMatieres(); fetchAnnonces() }
    if (newTab === 'premium') fetchPremiumUsers()
  }

  const publierAnnonce = async () => {
    if (!annonceMessage.trim()) return
    setAnnonceSaving(true)
    setAnnonceError(null)
    try {
      const { data, error } = await supabase.from('annonces').insert({ message: annonceMessage.trim(), created_by: 'super_admin' }).select('id, message, created_at, created_by').single()
      if (error) setAnnonceError('Table annonces non créée')
      else if (data) { setAnnonces(prev => [data as Annonce, ...prev].slice(0, 5)); setAnnonceMessage('') }
    } catch { setAnnonceError('Table annonces non créée') }
    setAnnonceSaving(false)
  }

  const bulkGenerateResumes = async () => {
    setBulkResumeLoading(true)
    setBulkResumeResult(null)
    try {
      const { data: coursSanResume } = await supabase.from('cours').select('id').or('resume.is.null,resume.lt.30').limit(50)
      if (!coursSanResume || coursSanResume.length === 0) { setBulkResumeResult('Tous les cours ont déjà un résumé ✅'); setBulkResumeLoading(false); return }
      let count = 0
      for (const cours of coursSanResume) {
        try {
          const r = await fetch('/api/generate-resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coursId: cours.id }) })
          if (r.ok) count++
          await new Promise(res => setTimeout(res, 500))
        } catch {}
      }
      setBulkResumeResult(`${count}/${coursSanResume.length} résumés générés ✅`)
    } catch { setBulkResumeResult('Erreur lors de la génération') }
    setBulkResumeLoading(false)
  }

  const filteredUsers = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const currentTab = NAV_ITEMS.find(n => n.key === tab)

  return (
    <div className="flex h-screen bg-[#0A0D14] overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-[#0E1118] border-r border-white/[0.06] transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-black text-white leading-none">TerangaLearn</p>
              <p className="text-[10px] text-red-400/70 font-semibold mt-0.5 uppercase tracking-wider">Super Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = tab === item.key
            const badge = item.badge ? item.badge(stats) : null
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative group',
                  active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-400 rounded-r-full" />}
                <item.icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-red-400')} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {badge !== null && badge !== undefined && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-red-500/30 text-red-300' : 'bg-zinc-800 text-zinc-400')}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            href="/dashboard"
            className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition', sidebarCollapsed && 'justify-center px-0')}
          >
            <ChevronRight className="w-4 h-4 rotate-180 flex-shrink-0" />
            {!sidebarCollapsed && 'Retour app'}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition', sidebarCollapsed && 'justify-center px-0')}
          >
            <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform', !sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && 'Réduire'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] bg-[#0A0D14] flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold text-white">{currentTab?.label ?? 'Administration'}</h1>
            <p className="text-[11px] text-zinc-500">TerangaLearn · Super Administration</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="w-48 bg-white/[0.05] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition"
              />
            </div>
            {/* Alertes signalements */}
            {stats.signalements > 0 && (
              <button onClick={() => handleTabChange('signalements')} className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition">
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

          {/* ── OVERVIEW ──────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Élèves inscrits', value: plateformeStats.totalEleves, sub: `+${plateformeStats.nouveaux7j} cette semaine`, icon: Users, color: 'text-blue-400', glow: 'shadow-blue-500/10' },
                  { label: 'Actifs (7 jours)', value: plateformeStats.actifs7j, sub: `${plateformeStats.totalEleves > 0 ? Math.round(plateformeStats.actifs7j / plateformeStats.totalEleves * 100) : 0}% de rétention`, icon: Activity, color: 'text-green-400', glow: 'shadow-green-500/10' },
                  { label: 'Examens simulés', value: plateformeStats.totalExamens, sub: 'total depuis lancement', icon: FileCheck, color: 'text-orange-400', glow: 'shadow-orange-500/10' },
                  { label: 'Signalements', value: stats.signalements, sub: stats.signalements > 0 ? '⚠️ En attente de modération' : '✅ Aucun en attente', icon: Flag, color: stats.signalements > 0 ? 'text-red-400' : 'text-zinc-500', glow: 'shadow-red-500/10' },
                ].map(s => (
                  <div key={s.label} className={cn('bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5 shadow-xl', s.glow)}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
                      <s.icon className={cn('w-4 h-4', s.color)} />
                    </div>
                    <p className={cn('text-3xl font-black', s.color)}>{s.value.toLocaleString('fr-FR')}</p>
                    <p className="text-[11px] text-zinc-600 mt-1.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Deux colonnes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Derniers examens */}
                <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                    <GraduationCap className="w-4 h-4 text-orange-400" />
                    <h2 className="text-sm font-semibold text-zinc-200">Derniers examens</h2>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {recentExamens.slice(0, 6).map((e: any) => {
                      const name = e.profiles?.full_name ?? e.user_id?.slice(0, 8) + '…'
                      const score = e.score != null ? Math.round(e.score) : null
                      return (
                        <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-zinc-400">{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-200 truncate">{name}</p>
                            <p className="text-[10px] text-zinc-600">{new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          {score !== null && (
                            <span className={cn('text-sm font-black', score >= 10 ? 'text-green-400' : 'text-red-400')}>
                              {score}/20
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Derniers inscrits */}
                <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <h2 className="text-sm font-semibold text-zinc-200">Derniers inscrits</h2>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {topEleves.slice(0, 6).map((u: any, i: number) => (
                      <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-[10px] text-zinc-700 font-mono w-4">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-400">{(u.full_name ?? 'E').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{u.full_name ?? 'Sans nom'}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">
                          {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenu stat */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Cours publiés', value: plateformeStats.totalCours, icon: BookOpen, color: 'text-indigo-400' },
                  { label: 'Résumés IA', value: plateformeStats.coursAvecResume, icon: Sparkles, color: 'text-yellow-400', sub: `${plateformeStats.totalCours > 0 ? Math.round(plateformeStats.coursAvecResume / plateformeStats.totalCours * 100) : 0}%` },
                  { label: 'Épreuves', value: plateformeStats.totalEpreuves, icon: FileText, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={cn('w-4 h-4', s.color)} />
                      <p className="text-xs text-zinc-500">{s.label}</p>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
                      {'sub' in s && s.sub && <span className={cn('text-xs font-bold opacity-60', s.color)}>{s.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── APPRENTISSAGE ─────────────────────────────────────── */}
          {tab === 'plateforme' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Élèves', value: plateformeStats.totalEleves, icon: GraduationCap, color: 'text-green-400' },
                  { label: 'Nouveaux 7j', value: plateformeStats.nouveaux7j, icon: TrendingUp, color: 'text-blue-400' },
                  { label: 'Actifs 7j', value: plateformeStats.actifs7j, icon: Activity, color: 'text-purple-400' },
                  { label: 'Examens total', value: plateformeStats.totalExamens, icon: FileCheck, color: 'text-orange-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5">
                    <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
                    <p className={cn('text-3xl font-black', s.color)}>{s.value.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Génération résumés */}
              <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100">Résumés IA en masse</h2>
                      <p className="text-xs text-zinc-500">{plateformeStats.totalCours - plateformeStats.coursAvecResume} cours sans résumé · {plateformeStats.coursAvecResume}/{plateformeStats.totalCours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={bulkGenerateResumes}
                      disabled={bulkResumeLoading || plateformeStats.totalCours === plateformeStats.coursAvecResume}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-yellow-400 text-xs font-bold transition"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', bulkResumeLoading && 'animate-spin')} />
                      {bulkResumeLoading ? 'En cours…' : 'Générer les résumés manquants'}
                    </button>
                    {bulkResumeResult && <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg">{bulkResumeResult}</span>}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-zinc-600 mb-1.5">
                    <span>Couverture résumés IA</span>
                    <span>{plateformeStats.totalCours > 0 ? Math.round(plateformeStats.coursAvecResume / plateformeStats.totalCours * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-yellow-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${plateformeStats.totalCours > 0 ? plateformeStats.coursAvecResume / plateformeStats.totalCours * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Annonce */}
              <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-zinc-100">Publier une annonce</h2>
                </div>
                {annonceError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-3">{annonceError}</p>}
                <div className="flex gap-3">
                  <input
                    value={annonceMessage}
                    onChange={e => setAnnonceMessage(e.target.value)}
                    placeholder="Message pour tous les élèves…"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition"
                  />
                  <button
                    onClick={publierAnnonce}
                    disabled={annonceSaving || !annonceMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 text-blue-400 text-sm font-bold transition flex-shrink-0"
                  >
                    {annonceSaving ? '…' : 'Publier'}
                  </button>
                </div>
                {annonces.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {annonces.map(a => (
                      <div key={a.id} className="flex items-start gap-3 bg-white/[0.02] rounded-xl px-4 py-3">
                        <Bell className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-200 leading-relaxed">{a.message}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">{new Date(a.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PREMIUM ───────────────────────────────────────────── */}
          {tab === 'premium' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Abonnés Premium', value: premiumUsers.length, icon: Zap, color: 'text-yellow-400' },
                  { label: 'Revenus estimés', value: `${(premiumUsers.length * 1900).toLocaleString('fr-FR')} FCFA`, icon: BarChart2, color: 'text-green-400' },
                  { label: 'Taux conversion', value: `${plateformeStats.totalEleves > 0 ? (premiumUsers.length / plateformeStats.totalEleves * 100).toFixed(1) : 0}%`, icon: TrendingUp, color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0E1118] border border-white/[0.06] rounded-2xl p-5">
                    <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
                    <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
                    <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">Abonnés actifs</h2>
                  <span className="ml-auto text-xs text-zinc-600">{premiumUsers.length} comptes</span>
                </div>
                {!premiumFetched ? (
                  <p className="text-center py-12 text-zinc-600 text-sm">Chargement…</p>
                ) : premiumUsers.length === 0 ? (
                  <p className="text-center py-12 text-zinc-600 text-sm">Aucun abonné Premium pour l'instant</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {premiumUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-yellow-400">{(u.full_name ?? 'E').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{u.full_name ?? 'Sans nom'}</p>
                          <p className="text-xs text-zinc-600 truncate">{u.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-semibold">
                            {u.plan}
                          </span>
                          {u.plan_expires_at && (
                            <p className="text-[10px] text-zinc-600 mt-1">
                              exp. {new Date(u.plan_expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS ─────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                <Users className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Utilisateurs</h2>
                <span className="ml-auto text-xs text-zinc-600">{filteredUsers.length} résultats</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {filteredUsers.map(u => (
                  <div key={u.id} className={cn('flex items-center gap-4 px-5 py-3.5', u.banni && 'opacity-40')}>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-zinc-400">{(u.full_name ?? 'E').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{u.full_name ?? 'Sans nom'}</p>
                        {u.id === currentUserId && <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">Toi</span>}
                        {u.banni && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">BANNI</span>}
                        {u.nb_avertissements > 0 && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">{u.nb_avertissements} avert.</span>}
                      </div>
                      <p className="text-xs text-zinc-600 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={u.role}
                        onChange={e => changerRole(u.id, e.target.value)}
                        disabled={loading === u.id}
                        className={cn('text-xs px-2.5 py-1.5 rounded-lg border-0 cursor-pointer font-semibold focus:outline-none', ROLE_COLORS[u.role] ?? 'bg-zinc-800 text-zinc-400')}
                      >
                        {['eleve', 'ambassadeur', 'moderateur', 'admin', 'super_admin'].map(r => (
                          <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                      </select>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => toggleBan(u)}
                          disabled={loading === u.id}
                          className={cn('p-1.5 rounded-lg transition', u.banni ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:text-red-400')}
                          title={u.banni ? 'Débannir' : 'Bannir'}
                        >
                          {u.banni ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SIGNALEMENTS ──────────────────────────────────────── */}
          {tab === 'signalements' && (
            <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                <Flag className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Signalements</h2>
              </div>
              {recentSignalements.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="w-10 h-10 text-green-500/30 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Aucun signalement en attente</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {recentSignalements.map(s => (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold', s.priorite === 'urgente' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-400')}>
                            {s.raison?.replace('_', ' ')}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', s.statut === 'en_attente' ? 'bg-orange-500/10 text-orange-400' : s.statut === 'resolu' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500')}>
                            {s.statut}
                          </span>
                          {s.priorite === 'urgente' && <span className="text-[10px] font-black text-red-400">⚡ URGENT</span>}
                        </div>
                        <p className="text-xs text-zinc-600">{new Date(s.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SANCTIONS ─────────────────────────────────────────── */}
          {tab === 'sanctions' && (
            <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                <Lock className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Sanctions actives</h2>
                <span className="ml-auto text-xs text-zinc-600">{sanctions.length} entrées</span>
              </div>
              {sanctions.length === 0 ? (
                <div className="text-center py-16">
                  <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Aucune sanction</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {sanctions.map(s => (
                    <div key={s.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold border',
                          s.type_sanction === 'bannissement' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          s.type_sanction === 'avertissement' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        )}>
                          {s.type_sanction?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">Raison : {s.raison} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                      {s.expire_le && <p className="text-xs text-orange-400 mt-0.5">Expire le {new Date(s.expire_le).toLocaleDateString('fr-FR')}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTENU ───────────────────────────────────────────── */}
          {tab === 'contenu' && (
            <div className="space-y-5">
              {/* Posts */}
              <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                  <MessageSquare className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">Posts communauté</h2>
                  <span className="ml-auto text-xs text-zinc-600">{posts.length} posts</span>
                </div>
                {posts.length === 0 ? (
                  <p className="text-center py-10 text-zinc-600 text-sm">Aucun post</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {posts.map(p => {
                      const authorName = p.profiles ? (p.profiles as { full_name: string }).full_name : p.user_id.slice(0, 8) + '…'
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-200 truncate">{p.titre}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-zinc-600">{authorName}</span>
                              <span className="text-zinc-700">·</span>
                              <span className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                              {(p.nb_signalements ?? 0) > 0 && (
                                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                                  {p.nb_signalements} signalement{(p.nb_signalements ?? 0) > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => supprimerPost(p.id)}
                            disabled={loading === `post-${p.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Matières */}
              <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                  <Package className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">Matières & Chapitres</h2>
                  <span className="ml-auto text-xs text-zinc-600">{matieres.length} matières</span>
                </div>
                {!matieresFetched ? (
                  <p className="text-center py-10 text-zinc-600 text-sm">Chargement…</p>
                ) : matieres.length === 0 ? (
                  <p className="text-center py-10 text-zinc-600 text-sm">Aucune matière</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {matieres.map(m => {
                      const matiereChapitres = chapitres.filter(c => c.matiere_id === m.id)
                      const isExpanded = expandedMatiere === m.id
                      return (
                        <div key={m.id}>
                          <button
                            onClick={() => setExpandedMatiere(isExpanded ? null : m.id)}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition text-left"
                          >
                            <span className="text-lg w-8 text-center">{m.icone}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-200">{m.nom}</p>
                              <p className="text-xs text-zinc-600">{m.code} · {m.classe} · {matiereChapitres.length} chapitres</p>
                            </div>
                            <ChevronDown className={cn('w-4 h-4 text-zinc-600 transition-transform', isExpanded && 'rotate-180')} />
                          </button>
                          {isExpanded && matiereChapitres.length > 0 && (
                            <div className="border-t border-white/[0.04] bg-white/[0.01] px-5 py-3 space-y-1">
                              {matiereChapitres.map(c => (
                                <div key={c.id} className="flex items-center gap-2 py-1">
                                  <span className="text-zinc-700 text-xs font-mono w-5">{c.ordre}.</span>
                                  <p className="text-xs text-zinc-400">{c.titre}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIT ─────────────────────────────────────────────── */}
          {tab === 'audit' && (
            <div className="bg-[#0E1118] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
                <Database className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Journal d'audit</h2>
                <span className="ml-auto text-xs text-zinc-600">{auditLog.length} entrées</span>
              </div>
              {auditLog.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Aucune entrée d'audit</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] font-mono">
                  {auditLog.map(a => (
                    <div key={a.id} className="flex items-start gap-4 px-5 py-3.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300">{a.action}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{a.cible_type} · {new Date(a.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
