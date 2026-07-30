'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ReinitialiserMotDePassePage() {
  const supabase = createClient()
  const router = useRouter()
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmerMdp, setConfirmerMdp] = useState('')
  const [showMdp, setShowMdp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (nouveauMdp !== confirmerMdp) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (nouveauMdp.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp })
    setLoading(false)

    if (error) {
      setError('Erreur lors de la réinitialisation. Le lien a peut-être expiré.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-8">

        {!success ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Nouveau mot de passe</h1>
            <p className="text-gray-500 text-sm mb-6">
              Choisis un nouveau mot de passe pour ton compte.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type={showMdp ? 'text' : 'password'}
                  value={nouveauMdp}
                  onChange={e => setNouveauMdp(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  required
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
                />
                <button type="button" onClick={() => setShowMdp(!showMdp)} className="text-gray-400">
                  {showMdp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type={showMdp ? 'text' : 'password'}
                  value={confirmerMdp}
                  onChange={e => setConfirmerMdp(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  required
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green rounded-2xl font-bold text-white text-base hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe modifié !</h2>
            <p className="text-gray-500 text-sm">Redirection vers la connexion...</p>
          </div>
        )}
      </div>
    </div>
  )
}