'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ConnexionPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleDemo = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@terangalearn.sn',
      password: 'demo2025',
    })
    if (error) {
      setError('Compte démo indisponible.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <Image src="/logo.png" alt="TerangaLearn" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">
                  <span className="text-green-400">Teranga</span>
                  <span className="text-yellow-400">Learn</span>
                </p>
                <p className="text-xs text-green-200/60">La plateforme pour ta réussite</p>
              </div>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white mt-4">Bon retour ! 👋</h1>
          <p className="text-green-200/60 text-sm mt-1">Connecte-toi pour continuer ta révision</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          {/* Erreur */}
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-green-100 mb-1.5 block">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-green-100">
                  Mot de passe
                </label>
                <Link href="/mot-de-passe-oublie" className="text-xs text-green-400 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/30 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Compte démo */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white font-semibold py-3 rounded-xl border border-white/20 transition text-sm"
          >
            🎓 Essayer le compte démo
          </button>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-sm text-green-200/50 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-green-400 font-semibold hover:underline">
            S'inscrire gratuitement
          </Link>
        </p>

        {/* Retour landing */}
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition">
            ← Retour à l'accueil
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
