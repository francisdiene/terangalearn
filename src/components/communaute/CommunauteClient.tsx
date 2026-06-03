'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Users, Plus, Send, X, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'

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

const MATIERES = ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO', 'ECO']
const MATIERE_LABELS: Record<string, string> = {
  MATH: '📐 Maths', PC: '⚗️ Physique-Chimie', SVT: '🧬 SVT',
  FR: '📖 Français', HG: '🌍 Histoire-Géo', EN: '🇬🇧 Anglais',
  PHILO: '🧠 Philo', ECO: '📊 Économie'
}

export default function CommunauteClient({ userId, profile, postsInitiaux, groupes }: Props) {
  const [onglet, setOnglet] = useState<'forum' | 'groupes'>('forum')
  const [posts, setPosts] = useState<Post[]>(postsInitiaux)
  const [showNewPost, setShowNewPost] = useState(false)
  const [showNewGroupe, setShowNewGroupe] = useState(false)
  const [groupesMembres, setGroupesMembres] = useState<Groupe[]>(groupes)
  const [filtreMatiere, setFiltreMatiere] = useState<string | null>(null)

  const [newPost, setNewPost] = useState({ titre: '', contenu: '', matiere: '' })
  const [newGroupe, setNewGroupe] = useState({ nom: '', description: '', matiere: '' })
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleCreatePost = async () => {
    if (!newPost.titre.trim() || !newPost.contenu.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        titre: newPost.titre,
        contenu: newPost.contenu,
        matiere: newPost.matiere || null,
      })
      .select('*, profiles(full_name, niveau, classe)')
      .single()

    if (!error && data) {
      setPosts(p => [data, ...p])
      setNewPost({ titre: '', contenu: '', matiere: '' })
      setShowNewPost(false)
    }
    setLoading(false)
  }

  const handleJoinGroupe = async (groupeId: string) => {
    const { error } = await supabase
      .from('groupe_membres')
      .insert({ groupe_id: groupeId, user_id: userId })

    if (!error) {
      setGroupesMembres(prev => prev.map(g =>
        g.id === groupeId
          ? { ...g, groupe_membres: [...g.groupe_membres, { user_id: userId }] }
          : g
      ))
    }
  }

  const handleLeaveGroupe = async (groupeId: string) => {
    await supabase
      .from('groupe_membres')
      .delete()
      .eq('groupe_id', groupeId)
      .eq('user_id', userId)

    setGroupesMembres(prev => prev.map(g =>
      g.id === groupeId
        ? { ...g, groupe_membres: g.groupe_membres.filter(m => m.user_id !== userId) }
        : g
    ))
  }

  const handleCreateGroupe = async () => {
    if (!newGroupe.nom.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('groupes')
      .insert({
        nom: newGroupe.nom,
        description: newGroupe.description,
        matiere: newGroupe.matiere || null,
        createur_id: userId,
      })
      .select('*, groupe_membres(user_id)')
      .single()

    if (!error && data) {
      setGroupesMembres(prev => [data, ...prev])
      setNewGroupe({ nom: '', description: '', matiere: '' })
      setShowNewGroupe(false)
    }
    setLoading(false)
  }

  const postsFiltres = filtreMatiere
    ? posts.filter(p => p.matiere === filtreMatiere)
    : posts

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communauté 👥</h1>
        <p className="text-gray-500 mt-1">Échange avec tes camarades et révise ensemble</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'forum', label: 'Forum', icon: MessageSquare },
          { key: 'groupes', label: 'Groupes de révision', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition',
              onglet === key ? 'bg-white text-green shadow-sm' : 'text-gray-500'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== FORUM ===== */}
      {onglet === 'forum' && (
        <div className="space-y-4">
          {/* Bouton nouveau post */}
          <button
            onClick={() => setShowNewPost(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 card-shadow hover:border-green border-2 border-transparent transition text-left"
          >
            <div className="w-9 h-9 bg-green rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-gray-400 text-sm">Pose une question ou partage une astuce...</span>
            <Plus className="w-5 h-5 text-green ml-auto flex-shrink-0" />
          </button>

          {/* Formulaire nouveau post */}
          {showNewPost && (
            <div className="bg-white rounded-2xl p-5 card-shadow border-2 border-green">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Nouveau post</h3>
                <button onClick={() => setShowNewPost(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Titre de ta question..."
                  value={newPost.titre}
                  onChange={e => setNewPost(p => ({ ...p, titre: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                />
                <textarea
                  placeholder="Explique ta question en détail..."
                  value={newPost.contenu}
                  onChange={e => setNewPost(p => ({ ...p, contenu: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm resize-none"
                />
                <select
                  value={newPost.matiere}
                  onChange={e => setNewPost(p => ({ ...p, matiere: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
                >
                  <option value="">Sélectionner une matière (optionnel)</option>
                  {MATIERES.map(m => (
                    <option key={m} value={m}>{MATIERE_LABELS[m]}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreatePost}
                  disabled={loading || !newPost.titre.trim()}
                  className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Publier
                </button>
              </div>
            </div>
          )}

          {/* Filtre matières */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFiltreMatiere(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                !filtreMatiere ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              Tous
            </button>
            {MATIERES.map(m => (
              <button
                key={m}
                onClick={() => setFiltreMatiere(filtreMatiere === m ? null : m)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0',
                  filtreMatiere === m ? 'bg-green text-white' : 'bg-gray-100 text-gray-600'
                )}
              >
                {MATIERE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Liste des posts */}
          {postsFiltres.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun post pour l'instant</p>
              <p className="text-sm mt-1">Sois le premier à poser une question !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postsFiltres.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green/10 rounded-xl flex items-center justify-center text-green font-bold text-sm flex-shrink-0">
                        {post.profiles?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {post.profiles?.full_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Niv. {post.profiles?.niveau} •{' '}
                          {new Date(post.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {post.matiere && (
                      <span className="text-xs bg-green-light text-green px-2 py-1 rounded-full font-medium flex-shrink-0">
                        {MATIERE_LABELS[post.matiere]}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{post.titre}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{post.contenu}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== GROUPES ===== */}
      {onglet === 'groupes' && (
        <div className="space-y-4">
          {/* Bouton créer groupe */}
          <button
            onClick={() => setShowNewGroupe(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Créer un groupe de révision
          </button>

          {/* Formulaire nouveau groupe */}
          {showNewGroupe && (
            <div className="bg-white rounded-2xl p-5 card-shadow border-2 border-green">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Nouveau groupe</h3>
                <button onClick={() => setShowNewGroupe(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom du groupe..."
                  value={newGroupe.nom}
                  onChange={e => setNewGroupe(g => ({ ...g, nom: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                />
                <textarea
                  placeholder="Description (optionnel)..."
                  value={newGroupe.description}
                  onChange={e => setNewGroupe(g => ({ ...g, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm resize-none"
                />
                <select
                  value={newGroupe.matiere}
                  onChange={e => setNewGroupe(g => ({ ...g, matiere: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
                >
                  <option value="">Matière principale...</option>
                  {MATIERES.map(m => (
                    <option key={m} value={m}>{MATIERE_LABELS[m]}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreateGroupe}
                  disabled={loading || !newGroupe.nom.trim()}
                  className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
                >
                  Créer le groupe
                </button>
              </div>
            </div>
          )}

          {/* Liste des groupes */}
          {groupesMembres.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun groupe pour l'instant</p>
              <p className="text-sm mt-1">Crée le premier groupe de révision !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupesMembres.map(groupe => {
                const isMembre = groupe.groupe_membres.some(m => m.user_id === userId)
                const nbMembres = groupe.groupe_membres.length

                return (
                  <div key={groupe.id} className="bg-white rounded-2xl p-5 card-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-green" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{groupe.nom}</h3>
                          {groupe.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{groupe.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {groupe.matiere && (
                              <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full">
                                {MATIERE_LABELS[groupe.matiere]}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              👥 {nbMembres} / {groupe.max_membres} membres
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => isMembre ? handleLeaveGroupe(groupe.id) : handleJoinGroupe(groupe.id)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0',
                          isMembre
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-green text-white hover:opacity-90'
                        )}
                      >
                        {isMembre ? 'Quitter' : 'Rejoindre'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}