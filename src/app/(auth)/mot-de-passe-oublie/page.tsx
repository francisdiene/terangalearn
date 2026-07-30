'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function MotDePasseOubliePage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    })

    setLoading(false)
    if (error) {
      setError("Une erreur s'est produite. Vérifiez votre email.")
    } else {
      setEnvoye(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-8">

        {!envoye ? (
          <>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>

            <h1 className="text-xl font-bold text-gray-900 mb-1">Mot de passe oublié ?</h1>
            <p className="text-gray-500 text-sm mb-6">
              Entre ton email, on t'enverra un lien pour réinitialiser ton mot de passe.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ton adresse email"
                  required
                  className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green rounded-2xl font-bold text-white text-base hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-6">
              Vérifie ta boîte mail <span className="font-semibold text-gray-700">{email}</span> et clique sur le lien pour réinitialiser ton mot de passe.
            </p>
            <Link
              href="/login"
              className="inline-block bg-green text-white font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}