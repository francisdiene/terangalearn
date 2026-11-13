'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Flag, AlertTriangle, Clock, CheckCircle2,
  XCircle, Shield, User, FileText, ChevronDown, ChevronUp
} from 'lucide-react'

interface Signalement {
  id: string
  post_id: string
  raison: string
  statut: string
  priorite: string
  description: string | null
  created_at: string
  posts: {
    titre: string
    contenu: string
    user_id: string
    profiles: { full_name: string } | null
  } | null
  profiles: { full_name: string } | null
}

const RAISON_LABELS: Record<string, string> = {
  spam: '🚫 Spam',
  harcelement: '😡 Harcèlement',
  hors_sujet: 'Hors-sujet',
  triche: '📋 Triche',
  contenu_sexuel: '🔞 Contenu inapproprié',
  autre: '❓ Autre',
}

const SANCTIONS = [
  { value: 'avertissement', label: 'Avertissement', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'suspension_7j', label: '⏸️ Suspension 7 jours', color: 'text-orange-600 bg-orange-50' },
  { value: 'suspension_30j', label: '⏹️ Suspension 30 jours', color: 'text-red-600 bg-red-100' },
  { value: 'bannissement', label: '🚫 Bannissement définitif', color: 'text-red-700 bg-red-200' },
]

export default function AdminModerationClient({ userId, role, signalements: initial, stats }: {
  userId: string
  role: string
  signalements: Signalement[]
  stats: { statut: string; priorite: string }[]
}) {
  const supabase = createClient()
  const [signalements, setSignalements] = useState(initial)
  const [filtre, setFiltre] = useState<'tous' | 'en_attente' | 'urgente'>('en_attente')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const enAttente = stats.filter(s => s.statut === 'en_attente').length
  const urgents = stats.filter(s => s.priorite === 'urgente' && s.statut === 'en_attente').length
  const resolus = stats.filter(s => s.statut === 'resolu').length

  const filtres = signalements.filter(s => {
    if (filtre === 'en_attente') return s.statut === 'en_attente'
    if (filtre === 'urgente') return s.priorite === 'urgente' && s.statut === 'en_attente'
    return true
  })

  const appliquerSanction = async (signalement: Signalement, typeSanction: string, rejeter = false) => {
    if (!signalement.posts) return
    setLoading(signalement.id)

    if (!rejeter) {
      // Calculer expiration
      const expire = typeSanction === 'suspension_7j'
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : typeSanction === 'suspension_30j'
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : null

      // Insérer sanction
      await supabase.from('sanctions').insert({
        user_id: signalement.posts.user_id,
        type_sanction: typeSanction,
        raison: signalement.raison,
        signalement_id: signalement.id,
        applique_par: userId,
        expire_le: expire,
      })

      // Supprimer le post si grave
      if (['harcelement', 'contenu_sexuel', 'spam'].includes(signalement.raison)) {
        await supabase.from('posts').delete().eq('id', signalement.post_id)
      }
    }

    // Mettre à jour le signalement
    await supabase.from('signalements').update({
      statut: rejeter ? 'rejete' : 'resolu',
      traite_par: userId,
      traite_le: new Date().toISOString(),
      decision: rejeter ? 'Signalement rejeté' : `Sanction : ${typeSanction}`,
    }).eq('id', signalement.id)

    // Journal audit
    await supabase.from('audit_moderation').insert({
      moderateur_id: userId,
      action: rejeter ? 'signalement_rejete' : `sanction_${typeSanction}`,
      cible_type: 'signalement',
      cible_id: signalement.id,
      details: { post_id: signalement.post_id, user_id: signalement.posts.user_id },
    })

    setSignalements(prev => prev.map(s =>
      s.id === signalement.id ? { ...s, statut: rejeter ? 'rejete' : 'resolu' } : s
    ))
    setExpanded(null)
    setLoading(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-green" />
          Modération
        </h1>
        <p className="text-gray-400 text-sm mt-1">Rôle : <span className="font-semibold text-green capitalize">{role.replace('_', ' ')}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'En attente', value: enAttente, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
          { label: 'Urgents', value: urgents, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
          { label: 'Résolus', value: resolus, color: 'text-green', bg: 'bg-green-light' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { key: 'en_attente', label: 'En attente' },
          { key: 'urgente', label: '🚨 Urgents' },
          { key: 'tous', label: 'Tous' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key as any)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition',
              filtre === f.key ? 'bg-green text-white' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste signalements */}
      {filtres.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-sm">Aucun signalement en attente</p>
          <p className="text-xs mt-1">La communauté est calme.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map(s => (
            <div
              key={s.id}
              className={cn(
                'bg-white dark:bg-gray-900 rounded-2xl border-2 overflow-hidden',
                s.priorite === 'urgente' ? 'border-red-200 dark:border-red-900' : 'border-gray-100 dark:border-gray-800',
                s.statut !== 'en_attente' && 'opacity-60'
              )}
            >
              {/* Header */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                {s.priorite === 'urgente' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Flag className="w-5 h-5 text-orange-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {RAISON_LABELS[s.raison] ?? s.raison}
                    </span>
                    {s.priorite === 'urgente' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">URGENT</span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-full',
                      s.statut === 'en_attente' ? 'bg-orange-100 text-orange-600' :
                      s.statut === 'resolu' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      {s.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Post : {s.posts?.titre ?? 'Supprimé'} · Signalé par {s.profiles?.full_name ?? '?'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  {expanded === s.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Détail */}
              {expanded === s.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {/* Contenu du post */}
                  {s.posts && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contenu signalé</p>
                        <span className="text-xs text-gray-400">— par {s.posts.profiles?.full_name ?? 'Inconnu'}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{s.posts.titre}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-3">{s.posts.contenu}</p>
                    </div>
                  )}

                  {/* Actions — seulement si en attente */}
                  {s.statut === 'en_attente' && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Appliquer une sanction</p>
                        <div className="grid grid-cols-2 gap-2">
                          {SANCTIONS.map(sanction => (
                            <button
                              key={sanction.value}
                              onClick={() => appliquerSanction(s, sanction.value)}
                              disabled={loading === s.id}
                              className={cn(
                                'text-xs font-bold px-3 py-2.5 rounded-xl transition active:scale-95 disabled:opacity-50',
                                sanction.color
                              )}
                            >
                              {sanction.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => appliquerSanction(s, '', true)}
                        disabled={loading === s.id}
                        className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold hover:border-gray-300 transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Rejeter le signalement (contenu valide)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
