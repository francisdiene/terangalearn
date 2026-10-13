'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Users, FileText, Flag, AlertTriangle, CheckCircle2, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'users' | 'signalements' | 'sanctions' | 'audit'

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  banni: boolean
  nb_avertissements: number
}

const ROLE_COLORS: Record<string, string> = {
  eleve: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ambassadeur: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  moderateur: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  admin: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-bold',
}

export default function SuperDashboardClient({
  currentUserId,
  stats,
  recentUsers,
  recentSignalements,
  sanctions,
  auditLog,
  recentPosts,
}: {
  currentUserId: string
  stats: { totalUsers: number; totalPosts: number; signalements: number; sanctionsActives: number }
  recentUsers: Profile[]
  recentSignalements: any[]
  sanctions: any[]
  auditLog: any[]
  recentPosts: any[]
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [users, setUsers] = useState(recentUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

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

  const tabs = [
    { key: 'overview', label: '📊 Vue d\'ensemble' },
    { key: 'users', label: `👥 Users (${stats.totalUsers})` },
    { key: 'signalements', label: `🚩 Signalements (${stats.signalements})` },
    { key: 'sanctions', label: `⚖️ Sanctions (${stats.sanctionsActives})` },
    { key: 'audit', label: '📋 Audit' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Super Administration</h1>
          <p className="text-xs text-gray-400">Supervision complète de TerangaLearn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-semibold transition',
              tab === t.key
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
              { label: 'Publications', value: stats.totalPosts, icon: FileText, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
              { label: 'Signalements en attente', value: stats.signalements, icon: Flag, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
              { label: 'Sanctions totales', value: stats.sanctionsActives, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">📝 Dernières publications</h2>
            <div className="space-y-2">
              {recentPosts.slice(0, 8).map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-400 w-5 font-mono">{i + 1}</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{p.titre}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {users.map(u => (
              <div key={u.id} className={cn('p-4 flex items-center gap-3', u.banni && 'opacity-50')}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.full_name ?? 'Sans nom'}</p>
                    {u.id === currentUserId && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Toi</span>}
                    {u.banni && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">BANNI</span>}
                    {u.nb_avertissements > 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">{u.nb_avertissements} avert.</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={u.role}
                    onChange={e => changerRole(u.id, e.target.value)}
                    disabled={loading === u.id}
                    className={cn('text-xs px-2 py-1.5 rounded-lg border-0 cursor-pointer font-semibold', ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600')}
                  >
                    {['eleve', 'ambassadeur', 'moderateur', 'admin', 'super_admin'].map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={loading === u.id}
                      className={cn('p-1.5 rounded-lg transition', u.banni ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500')}
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

      {/* Signalements */}
      {tab === 'signalements' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {recentSignalements.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucun signalement</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentSignalements.map(s => (
                <div key={s.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold', s.priorite === 'urgente' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600')}>
                        {s.raison.replace('_', ' ')}
                      </span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', s.statut === 'en_attente' ? 'bg-orange-100 text-orange-600' : s.statut === 'resolu' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
                        {s.statut}
                      </span>
                      {s.priorite === 'urgente' && <span className="text-[10px] font-black text-red-500">⚡ URGENT</span>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sanctions */}
      {tab === 'sanctions' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {sanctions.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune sanction</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {sanctions.map(s => (
                <div key={s.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold',
                      s.type_sanction === 'bannissement' ? 'bg-red-100 text-red-700' :
                      s.type_sanction === 'avertissement' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                    )}>
                      {s.type_sanction.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Raison : {s.raison} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                  {s.expire_le && <p className="text-xs text-orange-500 mt-0.5">Expire le {new Date(s.expire_le).toLocaleDateString('fr-FR')}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {auditLog.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune entrée d'audit</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {auditLog.map(a => (
                <div key={a.id} className="p-4 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{a.action}</p>
                    <p className="text-xs text-gray-400">{a.cible_type} · {new Date(a.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
