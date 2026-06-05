'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'

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
    <div className="min-h-screen relative flex flex-col">

      {/* Background plein écran */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/bg-login.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />
      </div>

      {/* Logo + Nom en haut */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-4 px-6">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
          <Image
            src="/logo.png"
            alt="TerangaLearn"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-white">TerangaLearn</h1>
        <p className="text-white/80 text-sm mt-2 text-center">
          Apprendre aujourd'hui,{'\n'}réussir demain.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Formulaire en bas */}
      <div className="relative z-10 bg-black/15 backdrop-blur-[2px] rounded-t-3xl px-6 pt-6 pb-10 border-t border-white/10">

        {/* Onglets Se connecter / S'inscrire */}
        <div className="flex mb-6">
          <div className="flex-1 text-center">
            <span className="text-white font-bold text-base">Se connecter</span>
            <div className="h-0.5 bg-green mt-2 mx-4 rounded-full" />
          </div>
          <Link href="/register" className="flex-1 text-center">
            <span className="text-white/50 font-medium text-base">S'inscrire</span>
            <div className="h-0.5 bg-transparent mt-2 mx-4 rounded-full" />
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5">
            <Mail className="w-5 h-5 text-white/50 flex-shrink-0" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
            />
          </div>

          {/* Mot de passe */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5">
            <Lock className="w-5 h-5 text-white/50 flex-shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/40"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Mot de passe oublié */}
          <div className="text-right">
            <span className="text-white/60 text-xs">Mot de passe oublié ?</span>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green rounded-2xl font-bold text-white text-base hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-green/30"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
              : 'Se connecter'
            }
          </button>
        </form>

        {/* Séparateur */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/40 text-xs">ou continuer avec</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Boutons sociaux */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="flex items-center justify-center gap-2 py-3 bg-white/10 border border-white/20 rounded-2xl text-white text-sm font-medium hover:bg-white/20 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-white/10 border border-white/20 rounded-2xl text-white text-sm font-medium hover:bg-white/20 transition">
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        {/* Créer un compte */}
        <p className="text-center text-white/50 text-sm">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-green font-bold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}