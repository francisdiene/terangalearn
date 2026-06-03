'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Panneau gauche — background image */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-12">
        {/* Background image */}
        <Image
          src="/bg-login.png"
          alt="TerangaLearn Background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay vert semi-transparent */}
        <div className="absolute inset-0 bg-green/60" />

        {/* Contenu par-dessus */}
        <div className="relative z-10 flex flex-col items-center text-white">
          <Image
            src="/logo.png"
            alt="TerangaLearn Logo"
            width={120}
            height={120}
            className="mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold text-center">TerangaLearn</h1>
          <p className="text-white/80 mt-3 text-lg text-center max-w-sm">
            La lumière du savoir pour chaque élève sénégalais
          </p>

          <div className="space-y-3 w-full max-w-sm mt-8">
            {[
              { emoji: '', text: 'Cours conformes au programme sénégalais' },
              { emoji: '', text: 'Coach IA personnalisé 24h/24' },
              { emoji: '', text: 'Gamification et classements nationaux' },
              { emoji: '', text: 'Suivi de progression intelligent' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            <div className="relative w-24 h-24 mb-3">
              <Image
                src="/bg-login.png"
                alt="Background"
                fill
                className="object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-green/60 rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="drop-shadow"
                />
              </div>
            </div>
            <span className="text-xl font-bold text-green">TerangaLearn</span>
            <span className="text-xs text-gray-400 mt-1">Réussis ton BFEM et ton BAC</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bon retour ! 👋</h2>
          <p className="text-gray-500 mb-8">Connecte-toi pour continuer à apprendre</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent transition text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-green font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}