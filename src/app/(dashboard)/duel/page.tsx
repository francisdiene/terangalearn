import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DuelClient from '@/components/duel/DuelClient'

export default async function DuelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DuelClient
      userId={user.id}
      profile={profile}
    />
  )
}