'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, Users, Plus, Send, X, BookOpen,
  Heart, ChevronRight, Search, Flame, Hash, Flag, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string
  titre: string
  contenu: string
  matiere: string | null
  likes: number
  created_at: string
  profiles: { full_name: string; niveau: number; classe: string } | null
}

interface Groupe {
  id: string
  nom: string
  description: string
  matiere: string | null
  max_membres: number
  groupe_membres: { user_id: string }[]
}

interface Props {
  userId: string
  profile: Profile | null
  postsInitiaux: Post[]
  groupes: Groupe[]
}

// ─── Config matières ──────────────────────────────────────────────────────────

const MATIERES = ['MATH', 'PC', 'SVT', 'FR', 'HG', 'ANG', 'PHILO', 'ECO']

const MAT: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  MATH:  { label: 'Maths',       icon: '📐', color: 'text-blue-600',   bg: 'bg-blue-50' },
  PC:    { label: 'Physique',    icon: '⚗️', color: 'text-orange-600', bg: 'bg-orange-50' },
  SVT:   { label: 'SVT',        icon: '🌿', color: 'text-green-600',  bg: 'bg-green-50' },
  FR:    { label: 'Français',   icon: '📖', color: 'text-violet-600', bg: 'bg-violet-50' },
  HG:    { label: 'Hist-Géo',   icon: '🌍', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ANG:   { label: 'Anglais',    icon: '🇬🇧', color: 'text-pink-600',   bg: 'bg-pink-50' },
  PHILO: { label: 'Philo',      icon: '🏛️', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ECO:   { label: 'Économie',   icon: '📊', color: 'text-teal-600',   bg: 'bg-teal-50' },
}

function matInfo(code: string | null) {
  return code ? MAT[code] ?? { label: code, icon: '📚', color: 'text-gray-600', bg: 'bg-gray-50' } : null
}

function relTime(d: string): string {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  return days === 1 ? 'Hier' : `${days}j`
}

function initials(name: string | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// Avatar coloré déterministe
const AVATAR_COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-violet-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
]
function avatarColor(name: string = ''): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// ─── Composant PostCard ───────────────────────────────────────────────────────

const RAISONS_SIGNALEMENT = [
  { value: 'spam', label: '🚫 Spam' },
  { value: 'harcelement', label: '😡 Harcèlement' },
  { value: 'hors_sujet', label: '📌 Hors-sujet' },
  { value: 'triche', label: '📋 Triche' },
  { value: 'contenu_sexuel', label: '🔞 Contenu inapproprié' },
  { value: 'autre', label: '❓ Autre' },
]

function PostCard({ post, onLike, alreadyLiked, userId, supabase }: {
  post: Post; onLike: (id: string) => void; alreadyLiked: boolean
  userId: string; supabase: ReturnType<typeof createClient>
}) {
  const [liked, setLiked] = useState(alreadyLiked)
  const [showSignalement, setShowSignalement] = useState(false)
  const [raisonSignalement, setRaisonSignalement] = useState('')
  const [signalementEnvoye, setSignalementEnvoye] = useState(false)
  const mi = matInfo(post.matiere)

  const handleSignaler = async () => {
    if (!raisonSignalement) return
    const { error } = await supabase.from('signalements').insert({
      post_id: post.id,
      signale_par: userId,
      raison: raisonSignalement,
    })
    if (!error || error.code === '23505') {
      setSignalementEnvoye(true)
      setTimeout(() => setShowSignalement(false), 2000)
    }
  }

  const handleLike = () => {
    setLiked(l => !l)
    onLike(post.id)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 active:scale-[0.99] transition-transform">
      {/* Auteur */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 ${avatarColor(post.profiles?.full_name)} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {initials(post.profiles?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {post.profiles?.full_name ?? 'Utilisateur'}
          </p>
          <p className="text-[10px] text-gray-400">
            Niv. {post.profiles?.niveau ?? 1} · {relTime(post.created_at)}
          </p>
        </div>
        {mi && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${mi.bg} ${mi.color}`}>
            <span>{mi.icon}</span>{mi.label}
          </span>
        )}
      </div>

      {/* Contenu */}
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 leading-snug">{post.titre}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{post.contenu}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-all',
            liked ? 'text-red-500' : 'text-gray-400 active:scale-110'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-all', liked && 'fill-red-500')} />
          {post.likes ?? 0}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <MessageSquare className="w-4 h-4" />
          Répondre
        </button>
        <button
          onClick={() => setShowSignalement(true)}
          className="ml-auto flex items-center gap-1 text-xs text-gray-300 hover:text-orange-400 transition"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal signalement */}
      {showSignalement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowSignalement(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {signalementEnvoye ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Signalement envoyé</p>
                <p className="text-xs text-gray-400 mt-1">Notre équipe va examiner ce contenu</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Signaler ce post</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {RAISONS_SIGNALEMENT.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setRaisonSignalement(r.value)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition border-2',
                        raisonSignalement === r.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSignalement(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 font-medium">
                    Annuler
                  </button>
                  <button
                    onClick={handleSignaler}
                    disabled={!raisonSignalement}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-40"
                  >
                    Signaler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Composant GroupeCard ─────────────────────────────────────────────────────

function GroupeCard({ groupe, userId, onJoin, onLeave }: {
  groupe: Groupe; userId: string
  onJoin: (id: string) => void; onLeave: (id: string) => void
}) {
  const isMembre = groupe.groupe_membres.some(m => m.user_id === userId)
  const nb = groupe.groupe_membres.length
  const mi = matInfo(groupe.matiere)
  const pct = groupe.max_membres ? Math.round((nb / groupe.max_membres) * 100) : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 ${mi ? mi.bg : 'bg-green-50'} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
          {mi ? mi.icon : '📚'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{groupe.nom}</h3>
          {groupe.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{groupe.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {mi && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mi.bg} ${mi.color}`}>
                {mi.label}
              </span>
            )}
            <span className="text-[10px] text-gray-400">👥 {nb}/{groupe.max_membres}</span>
          </div>
          {/* Barre membres */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mt-2">
            <div className="bg-green-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => isMembre ? onLeave(groupe.id) : onJoin(groupe.id)}
          className={cn(
            'flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95',
            isMembre
              ? 'bg-red-50 text-red-500 dark:bg-red-950'
              : 'bg-green-500 text-white shadow-sm shadow-green-200'
          )}
        >
          {isMembre ? 'Quitter' : 'Rejoindre'}
        </button>
      </div>
      {isMembre && (
        <button className="mt-3 w-full flex items-center justify-center gap-1.5 border border-green-200 dark:border-green-800 text-green-600 text-xs font-semibold py-2 rounded-xl active:scale-[0.98] transition-transform">
          <MessageSquare className="w-3.5 h-3.5" />
          Ouvrir le chat du groupe
        </button>
      )}
    </div>
  )
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl md:hidden animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto pb-8">
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CommunauteClient({ userId, profile, postsInitiaux, groupes }: Props) {
  const [tab, setTab] = useState<'forum' | 'groupes'>('forum')
  const [posts, setPosts] = useState<Post[]>(postsInitiaux)
  const [groupesMembres, setGroupesMembres] = useState<Groupe[]>(groupes)
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [showNewGroupe, setShowNewGroupe] = useState(false)
  const [newPost, setNewPost] = useState({ titre: '', contenu: '', matiere: '' })
  const [newGroupe, setNewGroupe] = useState({ nom: '', description: '', matiere: '' })
  const [loading, setLoading] = useState(false)
  const [mesLikes, setMesLikes] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const prenom = profile?.full_name?.split(' ')[0] ?? 'Toi'

  // Charger les likes de l'utilisateur
  useEffect(() => {
    supabase.from('post_likes').select('post_id').eq('user_id', userId).then(({ data }) => {
      if (data) setMesLikes(new Set(data.map(l => l.post_id)))
    })
  }, [userId])

  // Actions
  const handleCreatePost = async () => {
    if (!newPost.titre.trim() || !newPost.contenu.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: userId, titre: newPost.titre, contenu: newPost.contenu, matiere: newPost.matiere || null })
      .select('*, profiles(full_name, niveau, classe)')
      .single()
    if (!error && data) { setPosts(p => [data, ...p]); setNewPost({ titre: '', contenu: '', matiere: '' }); setShowNewPost(false) }
    setLoading(false)
  }

  const handleLike = async (postId: string) => {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    }
    // Si error = doublon (déjà liké), on unlike
    if (error?.code === '23505') {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(p.likes - 1, 0) } : p))
    }
  }

  const handleJoin = async (id: string) => {
    const { error } = await supabase.from('groupe_membres').insert({ groupe_id: id, user_id: userId })
    if (!error) setGroupesMembres(prev => prev.map(g => g.id === id ? { ...g, groupe_membres: [...g.groupe_membres, { user_id: userId }] } : g))
  }

  const handleLeave = async (id: string) => {
    await supabase.from('groupe_membres').delete().eq('groupe_id', id).eq('user_id', userId)
    setGroupesMembres(prev => prev.map(g => g.id === id ? { ...g, groupe_membres: g.groupe_membres.filter(m => m.user_id !== userId) } : g))
  }

  const handleCreateGroupe = async () => {
    if (!newGroupe.nom.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('groupes')
      .insert({ nom: newGroupe.nom, description: newGroupe.description, matiere: newGroupe.matiere || null, createur_id: userId })
      .select('*, groupe_membres(user_id)')
      .single()
    if (!error && data) { setGroupesMembres(prev => [data, ...prev]); setNewGroupe({ nom: '', description: '', matiere: '' }); setShowNewGroupe(false) }
    setLoading(false)
  }

  // Filtres
  const postsFiltres = posts.filter(p => {
    if (filtreMatiere && p.matiere !== filtreMatiere) return false
    if (search && !p.titre.toLowerCase().includes(search.toLowerCase()) && !p.contenu.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const mesGroupes = groupesMembres.filter(g => g.groupe_membres.some(m => m.user_id === userId))
  const autresGroupes = groupesMembres.filter(g => !g.groupe_membres.some(m => m.user_id === userId))

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen pb-4">

      {/* ══ HEADER MOBILE ═══════════════════════════════════════════════════ */}
      <div className="md:hidden bg-white dark:bg-gray-900 px-4 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Communauté</h1>
            <p className="text-xs text-gray-400">Révise avec tes camarades</p>
          </div>
          <button
            onClick={() => tab === 'forum' ? setShowNewPost(true) : setShowNewGroupe(true)}
            className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md shadow-green-200 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Barre recherche */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: 'forum', icon: MessageSquare, label: 'Forum' },
            { key: 'groupes', icon: Users, label: 'Groupes' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
                tab === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ HEADER DESKTOP ══════════════════════════════════════════════════ */}
      <div className="hidden md:block px-6 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Communauté</h1>
            <p className="text-sm text-gray-400">Échange avec tes camarades et révise ensemble</p>
          </div>
          <button onClick={() => tab === 'forum' ? setShowNewPost(true) : setShowNewGroupe(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
            <Plus className="w-4 h-4" />
            {tab === 'forum' ? 'Nouveau post' : 'Nouveau groupe'}
          </button>
        </div>
      </div>

      {/* ══ CONTENU ═════════════════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3 pb-24 md:pb-8">

        {/* Tabs desktop */}
        <div className="hidden md:flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {[
            { key: 'forum', icon: MessageSquare, label: 'Forum' },
            { key: 'groupes', icon: Users, label: 'Groupes de révision' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition',
                tab === key ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500'
              )}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── FORUM ──────────────────────────────────────────────────────── */}
        {tab === 'forum' && (
          <>
            {/* Filtre matières scroll horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <button onClick={() => setFiltreMatiere(null)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition',
                  !filtreMatiere ? 'bg-green-500 text-white shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-200 dark:border-gray-700')}>
                Tout
              </button>
              {MATIERES.map(m => {
                const mi = MAT[m]
                return (
                  <button key={m} onClick={() => setFiltreMatiere(filtreMatiere === m ? null : m)}
                    className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition',
                      filtreMatiere === m ? 'bg-green-500 text-white shadow-sm' : `${mi.bg} ${mi.color}`)}>
                    {mi.icon} {mi.label}
                  </button>
                )
              })}
            </div>

            {/* Composer (desktop) */}
            <div className="hidden md:block">
              <button onClick={() => setShowNewPost(true)}
                className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 hover:border-green-300 transition text-left">
                <div className={`w-9 h-9 ${avatarColor(profile?.full_name)} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {initials(profile?.full_name)}
                </div>
                <span className="text-gray-400 text-sm flex-1">Pose une question ou partage une astuce, {prenom}...</span>
                <Plus className="w-5 h-5 text-green-500 flex-shrink-0" />
              </button>
            </div>

            {/* Posts */}
            {postsFiltres.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-sm">{search ? 'Aucun résultat' : 'Aucun post pour l\'instant'}</p>
                <p className="text-xs mt-1">{search ? 'Essaie un autre mot-clé' : 'Sois le premier à poser une question !'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {postsFiltres.map(post => (
                  <PostCard key={post.id} post={post} onLike={handleLike} alreadyLiked={mesLikes.has(post.id)} userId={userId} supabase={supabase} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GROUPES ────────────────────────────────────────────────────── */}
        {tab === 'groupes' && (
          <>
            {/* Mes groupes */}
            {mesGroupes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mes groupes</h2>
                </div>
                <div className="space-y-3">
                  {mesGroupes.map(g => (
                    <GroupeCard key={g.id} groupe={g} userId={userId} onJoin={handleJoin} onLeave={handleLeave} />
                  ))}
                </div>
              </div>
            )}

            {/* Autres groupes */}
            {autresGroupes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Groupes disponibles</h2>
                </div>
                <div className="space-y-3">
                  {autresGroupes.map(g => (
                    <GroupeCard key={g.id} groupe={g} userId={userId} onJoin={handleJoin} onLeave={handleLeave} />
                  ))}
                </div>
              </div>
            )}

            {groupesMembres.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-sm">Aucun groupe pour l'instant</p>
                <p className="text-xs mt-1">Crée le premier groupe de révision !</p>
                <button onClick={() => setShowNewGroupe(true)}
                  className="mt-4 flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl mx-auto">
                  <Plus className="w-4 h-4" /> Créer un groupe
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ BOTTOM SHEET — Nouveau post ══════════════════════════════════ */}
      <BottomSheet open={showNewPost} onClose={() => setShowNewPost(false)} title="Nouveau post">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-9 h-9 ${avatarColor(profile?.full_name)} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {initials(profile?.full_name)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{profile?.full_name ?? 'Moi'}</p>
              <p className="text-xs text-gray-400">Niveau {profile?.niveau ?? 1}</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Titre de ta question..."
            value={newPost.titre}
            onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900 dark:text-white"
          />
          <textarea
            placeholder="Explique ta question en détail..."
            value={newPost.contenu}
            onChange={e => setNewPost(p => ({ ...p, contenu: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none text-gray-900 dark:text-white"
          />
          {/* Matière chips */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Matière concernée</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setNewPost(p => ({ ...p, matiere: '' }))}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition',
                  !newPost.matiere ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                Général
              </button>
              {MATIERES.map(m => (
                <button key={m} onClick={() => setNewPost(p => ({ ...p, matiere: m }))}
                  className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition',
                    newPost.matiere === m ? 'bg-green-500 text-white' : `${MAT[m].bg} ${MAT[m].color}`)}>
                  {MAT[m].icon} {MAT[m].label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreatePost}
            disabled={loading || !newPost.titre.trim() || !newPost.contenu.trim()}
            className="w-full py-3.5 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </BottomSheet>

      {/* Desktop modal nouveau post */}
      {showNewPost && (
        <div className="hidden md:flex fixed inset-0 bg-black/40 z-50 items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Nouveau post</h3>
              <button onClick={() => setShowNewPost(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Titre..." value={newPost.titre} onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <textarea placeholder="Contenu..." value={newPost.contenu} onChange={e => setNewPost(p => ({ ...p, contenu: e.target.value }))} rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
              <select value={newPost.matiere} onChange={e => setNewPost(p => ({ ...p, matiere: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <option value="">Matière (optionnel)</option>
                {MATIERES.map(m => <option key={m} value={m}>{MAT[m].icon} {MAT[m].label}</option>)}
              </select>
              <button onClick={handleCreatePost} disabled={loading || !newPost.titre.trim()}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-green-600 transition">
                <Send className="w-4 h-4" />{loading ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BOTTOM SHEET — Nouveau groupe ════════════════════════════════ */}
      <BottomSheet open={showNewGroupe} onClose={() => setShowNewGroupe(false)} title="Créer un groupe">
        <div className="space-y-3">
          <input type="text" placeholder="Nom du groupe..." value={newGroupe.nom} onChange={e => setNewGroupe(g => ({ ...g, nom: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900 dark:text-white" />
          <textarea placeholder="Description (optionnel)..." value={newGroupe.description} onChange={e => setNewGroupe(g => ({ ...g, description: e.target.value }))} rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none text-gray-900 dark:text-white" />
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Matière principale</p>
            <div className="flex gap-2 flex-wrap">
              {MATIERES.map(m => (
                <button key={m} onClick={() => setNewGroupe(g => ({ ...g, matiere: newGroupe.matiere === m ? '' : m }))}
                  className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition',
                    newGroupe.matiere === m ? 'bg-green-500 text-white' : `${MAT[m].bg} ${MAT[m].color}`)}>
                  {MAT[m].icon} {MAT[m].label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleCreateGroupe} disabled={loading || !newGroupe.nom.trim()}
            className="w-full py-3.5 bg-green-500 text-white rounded-xl font-bold disabled:opacity-40 active:scale-[0.98] transition-transform">
            {loading ? 'Création...' : 'Créer le groupe'}
          </button>
        </div>
      </BottomSheet>

    </div>
  )
}
