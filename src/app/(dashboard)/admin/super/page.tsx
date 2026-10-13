import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperDashboardClient from './SuperDashboardClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalSignalements },
    { count: sanctionsActives },
    { data: recentUsers },
    { data: recentSignalements },
    { data: sanctions },
    { data: auditLog },
    { data: recentPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('signalements').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    supabase.from('sanctions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, email, role, created_at, banni, nb_avertissements').order('created_at', { ascending: false }).limit(30),
    supabase.from('signalements').select('id, raison, statut, priorite, created_at, post_id').order('created_at', { ascending: false }).limit(15),
    supabase.from('sanctions').select('id, type_sanction, raison, created_at, expire_le, user_id').order('created_at', { ascending: false }).limit(20),
    supabase.from('audit_moderation').select('id, action, cible_type, created_at, moderateur_id').order('created_at', { ascending: false }).limit(30),
    supabase.from('posts').select('id, titre, user_id, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <SuperDashboardClient
      currentUserId={user.id}
      stats={{
        totalUsers: totalUsers ?? 0,
        totalPosts: totalPosts ?? 0,
        signalements: totalSignalements ?? 0,
        sanctionsActives: sanctionsActives ?? 0,
      }}
      recentUsers={recentUsers ?? []}
      recentSignalements={recentSignalements ?? []}
      sanctions={sanctions ?? []}
      auditLog={auditLog ?? []}
      recentPosts={recentPosts ?? []}
    />
  )
}
