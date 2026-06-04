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
  <div className="relative min-h-screen overflow-hidden">

    {/* Background fullscreen */}
    <Image
      src="/bg-login.png"
      alt="Background"
      fill
      priority
      className="object-cover"
    />

    {/* Overlay sombre vert */}
    <div
  className="
    absolute inset-0
    bg-gradient-to-b
    from-transparent
    via-green-900/15
    to-black/50
  "
/>

    {/* Contenu */}
    <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
          <Image
            src="/logo.png"
            alt="logo"
            width={60}
            height={60}
          />
        </div>

        <h1 className="mt-5 text-white text-4xl font-bold">
          TerangaLearn
        </h1>

        <p className="text-white/80 mt-2">
          Réussis ton BFEM et ton BAC
        </p>
      </div>

      {/* Formulaire glass */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">

        <h2 className="text-3xl font-bold text-white mb-2">
          Bienvenue 👋
        </h2>

        <p className="text-white/70 mb-6">
          Connectez-vous pour continuer
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-white rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full
              bg-white/10
              border border-white/20
              text-white
              placeholder:text-white/50
              rounded-2xl
              px-4
              py-4
              outline-none
              focus:border-green-400
            "
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full
              bg-white/10
              border border-white/20
              text-white
              placeholder:text-white/50
              rounded-2xl
              px-4
              py-4
              pr-12
              outline-none
            "
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {/* Mot de passe oublié */}
        <div className="text-right mb-5">
          <Link
            href="/forgot-password"
            className="text-green-300 text-sm"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-2xl
            py-4
            bg-green-500
            text-white
            font-semibold
            hover:bg-green-600
            transition
          "
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Connexion...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="h-px flex-1 bg-white/20" />
          <span className="px-3 text-white/60 text-sm">
            ou continuer avec
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white/10 border border-white/20 rounded-2xl py-3 text-white">
            Google
          </button>

          <button className="bg-white/10 border border-white/20 rounded-2xl py-3 text-white">
            Facebook
          </button>
        </div>

        <p className="text-center text-white/70 mt-6">
          Pas encore de compte ?
          <Link
            href="/register"
            className="text-green-300 font-semibold ml-1"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  </div>
)
}