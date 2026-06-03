import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanificationClient from '@/components/planification/PlanificationClient'

export default async function PlanificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: planning } = await supabase
    .from('planning')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('heure_debut', { ascending: true })

  return (
    <PlanificationClient
      userId={user.id}
      profile={profile}
      planningInitial={planning ?? []}
    />
  )
}