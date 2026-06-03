import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrientationClient from '@/components/orientation/OrientationClient'

export default async function OrientationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const { data: ecoles } = await supabase
    .from('ecoles')
    .select('*')
    .order('nom')

  return (
    <OrientationClient
      userId={user.id}
      profile={profile}
      notesInitiales={notes ?? []}
      ecoles={ecoles ?? []}
    />
  )
}