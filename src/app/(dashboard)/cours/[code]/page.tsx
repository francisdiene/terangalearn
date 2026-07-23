import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle } from 'lucide-react'

export default async function MatiereCoursPage({
  params
}: {
  params: { code: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const code = params.code.toUpperCase()

  const { data: matiere } = await supabase
    .from('matieres')
    .select('*')
    .eq('code', code)
    .single()

  if (!matiere) notFound()

  const { data: chapitres } = await supabase
    .from('chapitres')
    .select(`*, cours(id, titre, duree_minutes)`)
    .eq('matiere_id', matiere.id)
    .order('ordre')

  const { data: progressions } = await supabase
    .from('progression_cours')
    .select('cours_id, termine')
    .eq('user_id', user.id)

  const terminesIds = new Set(
    progressions?.filter(p => p.termine).map(p => p.cours_id) ?? []
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/cours"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Retour aux matières
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: matiere.couleur + '20' }}
          >
           <span className="text-xs font-bold text-green">{matiere.code}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{matiere.nom}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {chapitres?.length ?? 0} chapitres
            </p>
          </div>
        </div>
      </div>

      {/* Chapitres */}
      <div className="space-y-4">
        {chapitres?.map((chapitre, index) => {
          const coursDuChapitre = chapitre.cours ?? []
          const termines = coursDuChapitre.filter((c: any) => terminesIds.has(c.id)).length
          const total = coursDuChapitre.length
          const pct = total > 0 ? Math.round(termines / total * 100) : 0

          return (
            <div key={chapitre.id} className="bg-white rounded-2xl p-5 card-shadow">
              {/* Chapitre header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: matiere.couleur }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{chapitre.titre}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{chapitre.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green ml-4 flex-shrink-0">
                  {pct}%
                </span>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: matiere.couleur }}
                />
              </div>

              {/* Liste des cours */}
              {total > 0 ? (
                <div className="space-y-2">
                  {coursDuChapitre.map((c: any) => {
                    const fait = terminesIds.has(c.id)
                    return (
                      <Link
                        key={c.id}
                        href={`/cours/${code.toLowerCase()}/${c.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition group"
                      >
                        <div className="flex items-center gap-3">
                          {fait
                            ? <CheckCircle className="w-4 h-4 text-green flex-shrink-0" />
                            : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          }
                          <span className={`text-sm font-medium ${fait ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-green'}`}>
                            {c.titre}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {c.duree_minutes} min
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Cours en cours d'ajout...</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}