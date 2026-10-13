'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Users, FileText, Flag, AlertTriangle,
  CheckCircle2, Ban
} from 'lucide-react'
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

export default function SuperAdminClient({
  stats,
  recentUsers,
  recentSignalements,
  sanctions,
  auditLog,
  recentPosts,
}: {
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

  const ROLE_COLORS: Record<string, string> = {
    eleve: 'bg-gray-100 text-gray-600',
    ambassadeur: 'bg-blue-100 text-blue-600',
    moderateur: 'bg-purple-100 text-purple-600',
    admin: 'bg-orange-100 text-orange-600',
    super_admin: 'bg-red-100 text-red-700 font-bold',
  }

  const changerRole = async (userId: string, newRole: string) => {
    setLoading(userId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setLoading(null)
  }

  const toggleBan = async (user: Profile) => {
    setLoading(user.id)
    await supabase.from('profiles').update({ banni: !user.banni }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banni: !user.banni } : u))
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-400" />
            <div>
              <h1 className="text-lg font-black tracking-tight">TerangaLearn — Super Admin</h1>
              <p className="text-xs text-gray-500">Accès total à la plateforme</p>
            </div>
          </div>
          <span className="text-xs text-gray-600 font-mono">session sécurisée</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl w-fit">
          {[
            { key: 'overview', label: '📊 Vue d\'ensemble' },
            { key: 'users', label: '👥 Utilisateurs' },
            { key: 'signalements', label: '🚩 Signalements' },
            { key: 'sanctions', label: '⚖️ Sanctions' },
            { key: 'audit', label: '📋 Audit' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition',
                tab === t.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                { label: 'Publications', value: stats.totalPosts, icon: FileText, color: 'text-green-400' },
                { label: 'Signalements', value: stats.signalements, icon: Flag, color: 'text-orange-400' },
                { label: 'Sanctions actives', value: stats.sanctionsActives, icon: AlertTriangle, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                  <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                  <p className="text-3xl font-black">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Derniers posts */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-bold text-gray-300 mb-4">📝 Dernières publications</h2>
              <div className="space-y-2">
                {recentPosts.slice(0, 8).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs text-gray-500 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.titre}</p>
                      <p className="text-xs text-gray-500">{p.profiles?.full_name ?? 'Inconnu'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-gray-300">👥 Utilisateurs récents ({users.length})</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {users.map(u => (
                <div key={u.id} className={cn('p-4 flex items-center gap-4', u.banni && 'opacity-50')}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{u.full_name ?? 'Sans nom'}</p>
                      {u.banni && <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">BANNI</span>}
                      {u.nb_avertissements > 0 && (
                        <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">{u.nb_avertissements} avert.</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <p className="text-xs text-gray-600">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={u.role}
                      onChange={e => changerRole(u.id, e.target.value)}
                      disabled={loading === u.id}
                      className={cn(
                        'text-xs px-2 py-1.5 rounded-lg border-0 cursor-pointer',
                        ROLE_COLORS[u.role] ?? 'bg-gray-700 text-gray-300'
                      )}
                    >
                      {['eleve', 'ambassadeur', 'moderateur', 'admin', 'super_admin'].map(r => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={loading === u.id}
                      className={cn(
                        'p-1.5 rounded-lg transition',
                        u.banni ? 'bg-green-900 text-green-400 hover:bg-green-800' : 'bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400'
                      )}
                      title={u.banni ? 'Débannir' : 'Bannir'}
                    >
                      {u.banni ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signalements */}
        {tab === 'signalements' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-gray-300">🚩 Derniers signalements</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {recentSignalements.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">Aucun signalement</p>
              ) : recentSignalements.map(s => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-bold',
                          s.priorite === 'urgente' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
                        )}>
                          {s.raison.replace('_', ' ')}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          s.statut === 'en_attente' ? 'bg-orange-900 text-orange-300' :
                          s.statut === 'resolu' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                        )}>
                          {s.statut}
                        </span>
                      </div>
                      <p className="text-sm">Post : <span className="text-gray-300">{s.posts?.titre ?? 'Supprimé'}</span></p>
                      <p className="text-xs text-gray-500">Signalé par {s.profiles?.full_name ?? '?'} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sanctions */}
        {tab === 'sanctions' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-gray-300">⚖️ Historique des sanctions</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {sanctions.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">Aucune sanction</p>
              ) : sanctions.map(s => (
                <div key={s.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-bold',
                        s.type_sanction === 'bannissement' ? 'bg-red-900 text-red-300' :
                        s.type_sanction === 'avertissement' ? 'bg-yellow-900 text-yellow-300' : 'bg-orange-900 text-orange-300'
                      )}>
                        {s.type_sanction.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm">
                      Utilisateur : <span className="text-gray-300">{s.profiles?.full_name ?? '?'}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Raison : {s.raison} · Par {s.profiles?.full_name ?? '?'} · {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {s.expire_le && (
                      <p className="text-xs text-orange-400 mt-0.5">
                        Expire le {new Date(s.expire_le).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit */}
        {tab === 'audit' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-gray-300">📋 Journal d'audit complet</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {auditLog.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">Aucune entrée d'audit</p>
              ) : auditLog.map(a => (
                <div key={a.id} className="p-4 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-mono text-gray-300">{a.action}</p>
                    <p className="text-xs text-gray-500">
                      {a.profiles?.full_name ?? 'Modérateur'} · {a.cible_type} · {new Date(a.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
