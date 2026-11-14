'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Lock, Bell, ChevronRight,
  Loader2, CheckCircle2, Eye, EyeOff, LogOut
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  email: string
  profile: Profile | null
}

const SERIES = ['S1', 'S2', 'L', 'G', 'STEG']
const CLASSES = [
  { value: '3eme', label: '3ème (BFEM)' },
  { value: 'terminale', label: 'Terminale (BAC)' },
]
const PAYS = [
  { code: 'SN', nom: 'Sénégal' },
  { code: 'ML', nom: 'Mali' },
  { code: 'CI', nom: "Côte d'Ivoire" },
  { code: 'GN', nom: 'Guinée' },
  { code: 'BF', nom: 'Burkina Faso' },
  { code: 'TG', nom: 'Togo' },
  { code: 'BJ', nom: 'Bénin' },
  { code: 'NE', nom: 'Niger' },
  { code: 'MR', nom: 'Mauritanie' },
  { code: 'GM', nom: 'Gambie' },
  { code: 'GW', nom: 'Guinée-Bissau' },
  { code: 'SL', nom: 'Sierra Leone' },
  { code: 'LR', nom: 'Liberia' },
  { code: 'GH', nom: 'Ghana' },
  { code: 'NG', nom: 'Nigeria' },
  { code: 'CV', nom: 'Cap-Vert' },
]

type Onglet = 'profil' | 'securite' | 'preferences'

export default function ParametresClient({ userId, email, profile }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [onglet, setOnglet] = useState<Onglet>('profil')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Profil
  const [nom, setNom] = useState(profile?.full_name ?? '')
  const [classe, setClasse] = useState(profile?.classe ?? '3eme')
  const [serie, setSerie] = useState(profile?.serie ?? '')
  const [pays, setPays] = useState(profile?.pays ?? 'SN')

  // Sécurité
  const [mdpActuel, setMdpActuel] = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmerMdp, setConfirmerMdp] = useState('')
  const [showMdp, setShowMdp] = useState(false)

  // Préférences
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifStreak, setNotifStreak] = useState(true)
  const [langue, setLangue] = useState('fr')

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const showError = (msg: string) => {
    setError(msg)
    setSuccess('')
    setTimeout(() => setError(''), 4000)
  }

  const sauvegarderProfil = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: nom,
        classe,
        serie: classe === 'terminale' ? serie : null,
        pays,
      })
      .eq('id', userId)

    setLoading(false)
    if (error) showError('Erreur lors de la sauvegarde.')
    else showSuccess('Profil mis à jour avec succès !')
  }

  const changerMotDePasse = async () => {
    if (nouveauMdp !== confirmerMdp) {
      showError('Les mots de passe ne correspondent pas.')
      return
    }
    if (nouveauMdp.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp })
    setLoading(false)
    if (error) showError('Erreur lors du changement de mot de passe.')
    else {
      showSuccess('Mot de passe modifié avec succès !')
      setMdpActuel('')
      setNouveauMdp('')
      setConfirmerMdp('')
    }
  }

  const seDeconnecter = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ONGLETS = [
    { key: 'profil', label: 'Profil', icon: User },
    { key: 'securite', label: 'Sécurité', icon: Lock },
    { key: 'preferences', label: 'Préférences', icon: Bell },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-green-light text-green rounded-xl px-4 py-3 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {ONGLETS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key as Onglet)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition',
              onglet === key ? 'bg-white text-green shadow-sm' : 'text-gray-500'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== PROFIL ===== */}
      {onglet === 'profil' && (
        <div className="bg-white rounded-2xl p-6 card-shadow space-y-4">
          <h2 className="font-bold text-gray-900">Informations personnelles</h2>

          {/* Avatar initiale */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {nom.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{nom || 'Élève'}</p>
              <p className="text-sm text-gray-400">{email}</p>
              <p className="text-xs text-green mt-0.5">Niveau {profile?.niveau ?? 1} • {profile?.xp ?? 0} XP</p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
            />
          </div>

          {/* Email (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
            <select
              value={pays}
              onChange={e => setPays(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
            >
              {PAYS.map(p => (
                <option key={p.code} value={p.code}>{p.nom}</option>
              ))}
            </select>
          </div>

          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select
              value={classe}
              onChange={e => {
                const val = e.target.value
                setClasse(val)
                // Réinitialiser la série si on repasse en 3ème
                if (val !== 'terminale') setSerie('')
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
            >
              {CLASSES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Série (Terminale) */}
          {classe === 'terminale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Série</label>
              <select
                value={serie}
                onChange={e => setSerie(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
              >
                <option value="">Sélectionner</option>
                {SERIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={sauvegarderProfil}
            disabled={loading}
            className="w-full py-3 bg-green text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sauvegarder les modifications
          </button>
        </div>
      )}

      {/* ===== SECURITE ===== */}
      {onglet === 'securite' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 card-shadow space-y-4">
            <h2 className="font-bold text-gray-900">Changer le mot de passe</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showMdp ? 'text' : 'password'}
                  value={nouveauMdp}
                  onChange={e => setNouveauMdp(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowMdp(!showMdp)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showMdp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type={showMdp ? 'text' : 'password'}
                value={confirmerMdp}
                onChange={e => setConfirmerMdp(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
              />
            </div>

            {nouveauMdp && confirmerMdp && nouveauMdp !== confirmerMdp && (
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
            )}

            <button
              onClick={changerMotDePasse}
              disabled={loading || !nouveauMdp || !confirmerMdp}
              className="w-full py-3 bg-green text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Changer le mot de passe
            </button>
          </div>

          {/* Déconnexion */}
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="font-bold text-gray-900 mb-1">Déconnexion</h2>
            <p className="text-sm text-gray-500 mb-4">Vous serez redirigé vers la page de connexion.</p>
            <button
              onClick={seDeconnecter}
              className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

          {/* Zone danger */}
          <div className="bg-white rounded-2xl p-6 card-shadow border-2 border-red-100">
            <h2 className="font-bold text-red-600 mb-1">Zone de danger</h2>
            <p className="text-sm text-gray-500 mb-4">
              La suppression de votre compte est irréversible. Toutes vos données seront perdues.
            </p>
            <button className="w-full py-3 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition text-sm">
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}

      {/* ===== PREFERENCES ===== */}
      {onglet === 'preferences' && (
        <div className="bg-white rounded-2xl p-6 card-shadow space-y-5">
          <h2 className="font-bold text-gray-900">Préférences</h2>

          {/* Notifications */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Notifications</h3>
            <div className="space-y-3">
              {[
                { label: 'Rappels de révision par email', value: notifEmail, set: setNotifEmail },
                { label: 'Alertes de streak (série de jours)', value: notifStreak, set: setNotifStreak },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{pref.label}</span>
                  <button
                    onClick={() => pref.set(!pref.value)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors duration-200',
                      pref.value ? 'bg-green' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                      pref.value ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Langue */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Langue de l'interface</h3>
            <div className="flex gap-2">
              {[
                { code: 'fr', label: 'Français' },
                { code: 'wo', label: 'Wolof (bientôt)' },
              ].map(l => (
                <button
                  key={l.code}
                  onClick={() => l.code === 'fr' && setLangue(l.code)}
                  disabled={l.code !== 'fr'}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium transition border-2',
                    langue === l.code
                      ? 'border-green bg-green-light text-green'
                      : 'border-gray-100 text-gray-400'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Infos compte */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Informations du compte</h3>
            <div className="space-y-2">
              {[
                { label: 'Membre depuis', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { label: 'XP total', value: `${profile?.xp ?? 0} points` },
                { label: 'Niveau actuel', value: `Niveau ${profile?.niveau ?? 1}` },
                { label: 'Streak actuel', value: `${profile?.streak ?? 0} jour(s)` },
              ].map((info, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{info.label}</span>
                  <span className="text-sm font-medium text-gray-900">{info.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => showSuccess('Préférences sauvegardées !')}
            className="w-full py-3 bg-green text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            Sauvegarder les préférences
          </button>
        </div>
      )}
    </div>
  )
}