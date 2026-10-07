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

  const { data: matieres } = await supabase
    .from('matieres')
    .select('*')
    .or(`classe.eq.both,classe.eq.${profile?.classe}`)
    .limit(6)

  const { data: progressions } = await supabase
    .from('progression_cours')
    .select('*, cours(titre, chapitre_id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  const { data: examens } = await supabase
    .from('examens_simules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)
    .limit(4)

  return (
    <DashboardClient
      profile={profile}
      matieres={matieres ?? []}
      progressions={progressions ?? []}
      examens={examens ?? []}
      badges={badges ?? []}
    />
  )
}
