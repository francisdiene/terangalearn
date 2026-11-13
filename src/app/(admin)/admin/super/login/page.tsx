'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'

export default function SuperLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const r = await fetch('/api/sa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pw }),
    })
    if (r.ok) {
      window.location.href = '/admin/super'
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white">Super Admin</h1>
          <p className="text-xs text-gray-400 mt-1">Accès restreint</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Mot de passe"
            autoFocus
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-red-400 transition"
          />
          {error && <p className="text-red-500 text-xs text-center">Mot de passe incorrect</p>}
          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition"
          >
            {loading ? '...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  )
}
