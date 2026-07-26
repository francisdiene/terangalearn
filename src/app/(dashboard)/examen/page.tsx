import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExamenClient from '@/components/examen/ExamenClient'

export default async function ExamenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ExamenClient
      userId={user.id}
      profile={profile}
    />
  )
}