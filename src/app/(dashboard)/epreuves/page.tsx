import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'

export default async function EpreuvesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('classe')
    .eq('id', user.id)
    .single()

  const classe = profile?.classe ?? '3eme'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sujets {classe === '3eme' ? 'BFEM' : 'BAC'} — Années précédentes 📋
        </h1>
        <p className="text-gray-500 mt-1">
          Anciens sujets avec corrections officielles
        </p>
      </div>

      {/* Compte à rebours */}
      <ExamenCountdown classe={classe} />

      {/* Contenu à venir */}
      <div className="bg-white rounded-2xl p-12 card-shadow text-center">
        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="font-bold text-gray-700 text-lg mb-2">
          Sujets en cours d'ajout
        </h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Les sujets des années précédentes avec corrections seront disponibles prochainement.
          En attendant, entraîne-toi avec les exercices PDF dans la section Exercices.
        </p>
      </div>
    </div>
  )
}

function ExamenCountdown({ classe }: { classe: string }) {
  const examen = classe === '3eme'
    ? { nom: 'BFEM 2026', date: '2026-06-10' }
    : { nom: 'BAC 2026', date: '2026-06-17' }

  const today = new Date()
  const dateExamen = new Date(examen.date)
  const diff = Math.ceil((dateExamen.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return null

  return (
    <div className="gradient-green rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">Compte à rebours</p>
          <p className="text-2xl font-bold mt-1">{examen.nom}</p>
          <p className="text-white/70 text-sm mt-1">
            {new Date(examen.date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold">{diff}</p>
          <p className="text-white/70 text-sm">jours restants</p>
        </div>
      </div>
      <div className="mt-4 bg-white/20 rounded-full h-2">
        <div
          className="bg-white h-2 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, (1 - diff / 365) * 100))}%` }}
        />
      </div>
    </div>
  )
}