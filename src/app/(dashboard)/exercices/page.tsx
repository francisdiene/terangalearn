import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PenTool, Trophy, Zap, FileText, Eye } from 'lucide-react'
import ExercicesPDFSection from '@/components/exercices/ExercicesPDFSection'

export const revalidate = 60 // Cache 60 secondes

export default async function ExercicesPage() {
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
    .select('*, chapitres(id, titre, exercices(id))')
    .or(`classe.eq.both,classe.eq.${profile?.classe}`)

  const { data: resultats } = await supabase
    .from('resultats_exercices')
    .select('exercice_id, est_correct')
    .eq('user_id', user.id)

  const { data: epreuvesPDF } = await supabase
    .from('epreuves')
    .select('*')
    .eq('type', 'exercice')
    .order('matiere')

  const totalFaits = new Set(resultats?.map(r => r.exercice_id)).size
  const totalCorrects = resultats?.filter(r => r.est_correct).length ?? 0
  const tauxReussite = totalFaits > 0 ? Math.round(totalCorrects / totalFaits * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exercices 📝</h1>
        <p className="text-gray-500 mt-1">QCM interactifs et exercices PDF par chapitre</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Exercices faits', value: totalFaits, icon: PenTool, color: 'bg-blue-500' },
          { label: 'Réussis', value: totalCorrects, icon: Trophy, color: 'bg-green' },
          { label: 'Taux de réussite', value: `${tauxReussite}%`, icon: Zap, color: 'bg-orange-500' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4 text-white`}>
            <s.icon className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Section QCM interactifs */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-green" />
          QCM Interactifs
        </h2>
        <div className="space-y-4">
          {matieres?.map(matiere => {
            const totalExos = matiere.chapitres?.reduce(
              (acc: number, ch: any) => acc + (ch.exercices?.length ?? 0), 0
            ) ?? 0
            if (totalExos === 0) return null

            return (
              <div key={matiere.id} className="bg-white rounded-2xl p-5 card-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: matiere.couleur + '20' }}
                  >
                    {matiere.icone}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{matiere.nom}</h3>
                    <p className="text-sm text-gray-400">{totalExos} exercices</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {matiere.chapitres?.filter((ch: any) => ch.exercices?.length > 0).map((ch: any) => (
                    <Link
                      key={ch.id}
                      href={`/exercices/${ch.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green">
                        {ch.titre}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {ch.exercices.length} exo{ch.exercices.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-green">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section PDF d'exercices */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green" />
          Exercices PDF par chapitre
        </h2>
        <ExercicesPDFSection epreuves={epreuvesPDF ?? []} profile={profile} />
      </div>
    </div>
  )
}