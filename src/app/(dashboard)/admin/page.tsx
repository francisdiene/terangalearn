import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminModerationClient from './AdminModerationClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['moderateur', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: signalements } = await supabase
    .from('signalements')
    .select(`
      *,
      posts(titre, contenu, user_id, profiles(full_name)),
      profiles!signalements_signale_par_fkey(full_name)
    `)
    .order('priorite', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(50)

  const { data: stats } = await supabase
    .from('signalements')
    .select('statut, priorite')

  return (
    <AdminModerationClient
      userId={user.id}
      role={profile.role}
      signalements={signalements ?? []}
      stats={stats ?? []}
    />
  )
}
