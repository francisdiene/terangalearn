import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const classe = profile?.classe ?? 'terminale'
  const serie = profile?.serie ?? 'S'

  // Matières adaptées à la classe et série de l'élève
  const { data: matieres } = await supabase
    .from('matieres')
    .select('*')
    .or(`classe.eq.both,classe.eq.${classe}`)
    .order('created_at', { ascending: true })
    .limit(8)

  const { data: progressions } = await supabase
    .from('progression_cours')
    .select('*, cours(titre, chapitre_id, matiere_id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  // Examens récents (les 10 derniers pour calculer la moyenne réelle)
  const { data: examens } = await supabase
    .from('examens_simules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)
    .order('obtained_at', { ascending: false })
    .limit(6)

  // Objectifs du jour — actions faites aujourd'hui
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const { data: examensAujourdhui } = await supabase
    .from('examens_simules')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', todayIso)

  const { data: coursAujourdhui } = await supabase
    .from('progression_cours')
    .select('id')
    .eq('user_id', user.id)
    .gte('updated_at', todayIso)

  const objectifsJour = {
    examens: (examensAujourdhui ?? []).length,
    cours: (coursAujourdhui ?? []).length,
  }

  return (
    <DashboardClient
      profile={profile}
      matieres={matieres ?? []}
      progressions={progressions ?? []}
      examens={examens ?? []}
      badges={badges ?? []}
      objectifsJour={objectifsJour}
    />
  )
}
