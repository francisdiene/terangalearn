import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ExerciceRunner from '@/components/exercices/ExerciceRunner'

export default async function ExercicesChapPage({
  params
}: {
  params: { chapitreId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chapitre } = await supabase
    .from('chapitres')
    .select('*, matieres(nom, icone, couleur, code)')
    .eq('id', params.chapitreId)
    .single()

  if (!chapitre) notFound()

  const { data: exercices } = await supabase
    .from('exercices')
    .select('*')
    .eq('chapitre_id', params.chapitreId)
    .order('difficulte')

  if (!exercices || exercices.length === 0) notFound()

  const { data: resultats } = await supabase
    .from('resultats_exercices')
    .select('exercice_id, est_correct')
    .eq('user_id', user.id)
    .in('exercice_id', exercices.map(e => e.id))

  const matiere = (chapitre as any).matieres

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/exercices"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Retour aux exercices
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: matiere?.couleur + '20' }}
          >
            {matiere?.icone}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{chapitre.titre}</h1>
            <p className="text-sm text-gray-400">{exercices.length} exercices</p>
          </div>
        </div>
      </div>

      <ExerciceRunner
        exercices={exercices}
        userId={user.id}
        resultatsExistants={resultats ?? []}
      />
    </div>
  )
}