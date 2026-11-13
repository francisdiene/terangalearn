'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function PremiumSuccessPage() {
  const params = useSearchParams()
  const router = useRouter()
  const subscriptionId = params.get('sub')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!subscriptionId) {
      setStatus('error')
      return
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          // Rediriger vers le dashboard après 3 secondes
          setTimeout(() => router.push('/dashboard'), 3000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [subscriptionId])

  if (status === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto" />
          <p className="text-gray-500 text-sm">Activation de ton Premium en cours…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Paiement non confirmé</h1>
          <p className="text-gray-500 text-sm">
            Si tu as bien payé, ton abonnement sera activé dans quelques minutes.
            Contacte-nous si le problème persiste.
          </p>
          <Link
            href="/premium"
            className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm"
          >
            Retour à Premium
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-green-100 dark:bg-green-950/50 rounded-full animate-ping opacity-30" />
          <div className="relative w-20 h-20 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Premium activé !</h1>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-gray-500 text-sm">
            Bienvenue dans TerangaLearn Premium. Toutes les fonctionnalités sont débloquées.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 text-left space-y-2">
          {[
            'Coach IA illimité',
            'Examens simulés illimités',
            'Analyse & Orientation débloqués',
            'Planification intelligente',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">Redirection automatique dans 3 secondes…</p>

        <Link
          href="/dashboard"
          className="inline-block w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition"
        >
          Accéder au dashboard →
        </Link>
      </div>
    </div>
  )
}
