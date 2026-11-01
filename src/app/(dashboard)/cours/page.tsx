import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatiereIcon from '@/components/ui/MatiereIcon'

export const revalidate = 60 // Cache 60 secondes

export default async function CoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: matieres } = await supabase
    .from('matieres')
    .select('*')
    .or(`classe.eq.both,classe.eq.${profile?.classe}`)
    .order('nom')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
        <p className="text-gray-500 mt-1">
          Programme officiel {profile?.classe === '3eme' ? '3ème — BFEM' : 'Terminale — BAC'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matieres?.map(matiere => (
          <Link
            key={matiere.id}
            href={`/cours/${matiere.code.toLowerCase()}`}
            className="bg-white rounded-2xl p-5 card-shadow hover:scale-102 transition-all flex items-center gap-4 group"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: (matiere.couleur || '#10B981') + '20' }}
            >
              <MatiereIcon code={matiere.code} couleur={matiere.couleur || '#10B981'} size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 group-hover:text-green transition-colors">
                {matiere.nom}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {matiere.classe === 'both' ? 'Toutes classes' : matiere.classe}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: matiere.couleur + '20' }}
            >
              <span style={{ color: matiere.couleur }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}