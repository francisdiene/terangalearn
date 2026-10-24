'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Users, FileText, Flag, AlertTriangle, CheckCircle2, Ban, ChevronDown, ChevronRight, Megaphone, Package, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'users' | 'signalements' | 'sanctions' | 'audit' | 'contenu'

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
  recentPosts: PostWithAuthor[]
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [users, setUsers] = useState(recentUsers)
  const [loading, setLoading] = useState<string | null>(null)
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
    if (!confirm('Supprimer définitivement ce post ? Cette action est irréversible.')) return
    setLoading(`post-${postId}`)
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
    setLoading(null)
  }

  const fetchMatieres = async () => {
    if (matieresFetched) return
    const { data: matiereData } = await supabase
      .from('matieres')
      .select('id, nom, code, icone, couleur, classe')
      .order('nom')
    const { data: chapitreData } = await supabase
      .from('chapitres')
      .select('id, matiere_id, titre, ordre')
      .order('ordre')
    setMatieres(matiereData ?? [])
    setChapitres(chapitreData ?? [])
    setMatieresFetched(true)
  }

  const fetchAnnonces = async () => {
    if (annoncesFetched) return
    try {
      const { data, error } = await supabase
        .from('annonces')
        .select('id, message, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) {
        setAnnonceError('Table annonces non créée (exécuter le SQL)')
      } else {
        setAnnonces(data ?? [])
      }
    } catch {
      setAnnonceError('Table annonces non créée (exécuter le SQL)')
    }
    setAnnoncesFetched(true)
  }

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    if (newTab === 'contenu') {
      fetchMatieres()
      fetchAnnonces()
    }
  }

  const publierAnnonce = async () => {
    if (!annonceMessage.trim()) return
    setAnnonceSaving(true)
    setAnnonceError(null)
    try {
      const { data, error } = await supabase
        .from('annonces')
        .insert({ message: annonceMessage.trim(), created_by: 'super_admin' })
        .select('id, message, created_at, created_by')
        .single()
      if (error) {
        setAnnonceError('Table annonces non créée (exécuter le SQL)')
      } else if (data) {
        setAnnonces(prev => [data as Annonce, ...prev].slice(0, 5))
        setAnnonceMessage('')
      }
    } catch {
      setAnnonceError('Table annonces non créée (exécuter le SQL)')
    }
    setAnnonceSaving(false)
  }

  const tabs = [
    { key: 'overview', label: '📊 Vue d\'ensemble' },
    { key: 'users', label: `👥 Users (${stats.totalUsers})` },
    { key: 'signalements', label: `🚩 Signalements (${stats.signalements})` },
    { key: 'sanctions', label: `⚖️ Sanctions (${stats.sanctionsActives})` },
    { key: 'audit', label: '📋 Audit' },
    { key: 'contenu', label: '📦 Contenu' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
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
            onClick={() => handleTabChange(t.key as Tab)}
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
              {recentPosts.slice(0, 8).map((p, i) => (
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
            <p className="text-center py-12 text-gray-400 text-sm">Aucune entrée d&apos;audit</p>
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

      {/* Contenu */}
      {tab === 'contenu' && (
        <div className="space-y-5">

          {/* Posts problématiques */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Posts problématiques</h2>
              <span className="ml-auto text-xs text-gray-400">{posts.length} posts</span>
            </div>
            {posts.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Aucun post</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {posts.map(p => {
                  const authorName = p.profiles
                    ? (p.profiles as { full_name: string }).full_name
                    : p.user_id.slice(0, 8) + '…'
                  return (
                    <div key={p.id} className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.titre}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{authorName}</span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                          {(p.nb_signalements ?? 0) > 0 && (
                            <>
                              <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                                {p.nb_signalements} signalement{(p.nb_signalements ?? 0) > 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => supprimerPost(p.id)}
                        disabled={loading === `post-${p.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition disabled:opacity-50 flex-shrink-0"
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

          {/* Matières & Chapitres */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Matières &amp; Chapitres</h2>
              <span className="ml-auto text-xs text-gray-400">{matieres.length} matières</span>
            </div>
            {!matieresFetched ? (
              <p className="text-center py-10 text-gray-400 text-sm">Chargement…</p>
            ) : matieres.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Aucune matière trouvée</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {matieres.map(m => {
                  const matiereChapitres = chapitres.filter(c => c.matiere_id === m.id)
                  const isExpanded = expandedMatiere === m.id
                  return (
                    <div key={m.id}>
                      <button
                        onClick={() => setExpandedMatiere(isExpanded ? null : m.id)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
                      >
                        <span className="text-xl w-8 text-center">{m.icone}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.nom}</p>
                          <p className="text-xs text-gray-400">{m.code} · {m.classe} · {matiereChapitres.length} chapitre{matiereChapitres.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: m.couleur }}
                        />
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        }
                      </button>
                      {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                          {matiereChapitres.length === 0 ? (
                            <p className="px-6 py-3 text-xs text-gray-400">Aucun chapitre</p>
                          ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {matiereChapitres
                                .sort((a, b) => a.ordre - b.ordre)
                                .map(c => (
                                  <div key={c.id} className="px-6 py-2.5 flex items-center gap-3">
                                    <span className="text-xs text-gray-400 font-mono w-5 text-right">{c.ordre}</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.titre}</p>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Annonce globale */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Annonce globale</h2>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={annonceMessage}
                onChange={e => setAnnonceMessage(e.target.value)}
                placeholder="Écris ton annonce ici… (visible par tous les utilisateurs)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              {annonceError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{annonceError}</p>
              )}
              <button
                onClick={publierAnnonce}
                disabled={!annonceMessage.trim() || annonceSaving}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {annonceSaving ? 'Publication…' : 'Publier l\'annonce'}
              </button>

              {/* Dernières annonces */}
              {annonces.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dernières annonces</p>
                  <div className="space-y-2">
                    {annonces.map(a => (
                      <div key={a.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{a.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString('fr-FR')} · par {a.created_by}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
