'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Phone } from 'lucide-react'

const SERIES = ['S1', 'S2', 'L', 'G', 'STEG']

const PAYS_AFRIQUE_OUEST = [
  { code: 'SN', nom: 'Sénégal', indicatif: '+221' },
  { code: 'ML', nom: 'Mali', indicatif: '+223' },
  { code: 'CI', nom: "Côte d'Ivoire", indicatif: '+225' },
  { code: 'GN', nom: 'Guinée', indicatif: '+224' },
  { code: 'BF', nom: 'Burkina Faso', indicatif: '+226' },
  { code: 'TG', nom: 'Togo', indicatif: '+228' },
  { code: 'BJ', nom: 'Bénin', indicatif: '+229' },
  { code: 'NE', nom: 'Niger', indicatif: '+227' },
  { code: 'MR', nom: 'Mauritanie', indicatif: '+222' },
  { code: 'GM', nom: 'Gambie', indicatif: '+220' },
  { code: 'GW', nom: 'Guinée-Bissau', indicatif: '+245' },
  { code: 'SL', nom: 'Sierra Leone', indicatif: '+232' },
  { code: 'LR', nom: 'Liberia', indicatif: '+231' },
  { code: 'GH', nom: 'Ghana', indicatif: '+233' },
  { code: 'NG', nom: 'Nigeria', indicatif: '+234' },
  { code: 'CV', nom: 'Cap-Vert', indicatif: '+238' },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [methode, setMethode] = useState<'email' | 'phone'>('email')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    pays: 'SN',
    password: '',
    classe: '3eme',
    serie: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const paysSelectionne = PAYS_AFRIQUE_OUEST.find(p => p.code === form.pays)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (methode === 'email') {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            classe: form.classe,
            serie: form.serie || null,
            pays: form.pays,
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push('/onboarding')

    } else {
      // Inscription par téléphone
      const phoneComplet = `${paysSelectionne?.indicatif}${form.phone.replace(/^0/, '')}`

      const { error } = await supabase.auth.signUp({
        phone: phoneComplet,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            classe: form.classe,
            serie: form.serie || null,
            pays: form.pays,
          }
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 mb-3">
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
                width={48}
                height={48}
                className="drop-shadow"
              />
            </div>
          </div>
          <span className="text-lg font-bold text-green">TerangaLearn</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Crée ton compte 🎓</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Rejoins des milliers d'élèves sénégalais qui réussissent
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {/* Toggle Email / Téléphone */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setMethode('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              methode === 'email' ? 'bg-white text-green shadow-sm' : 'text-gray-500'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setMethode('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              methode === 'phone' ? 'bg-white text-green shadow-sm' : 'text-gray-500'
            }`}
          >
            <Phone className="w-4 h-4" />
            Téléphone
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Prénom Nom"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm"
            />
          </div>

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
            <select
              name="pays"
              value={form.pays}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm bg-white"
            >
              {PAYS_AFRIQUE_OUEST.map(p => (
                <option key={p.code} value={p.code}>
                  {p.nom} ({p.indicatif})
                </option>
              ))}
            </select>
          </div>

          {/* Email ou Téléphone */}
          {methode === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ton@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Numéro de téléphone
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex-shrink-0">
                  {paysSelectionne?.indicatif}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="77 000 00 00"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm"
                />
              </div>
            </div>
          )}

          {/* Classe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Classe</label>
            <select
              name="classe"
              value={form.classe}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm bg-white"
            >
              <option value="3eme">3ème (BFEM)</option>
              <option value="terminale">Terminale (BAC)</option>
            </select>
          </div>

          {/* Série (Terminale seulement) */}
          {form.classe === 'terminale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Série</label>
              <select
                name="serie"
                value={form.serie}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm bg-white"
              >
                <option value="">Sélectionne ta série</option>
                {SERIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm pr-12"
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
            className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Création...</>
            ) : (
              "C'est parti ! 🚀"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-green font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}