import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import SuperAdminClient from '../SuperAdminClient'

export const dynamic = 'force-dynamic'

const SECRET = process.env.SUPERADMIN_SECRET

export default async function SuperAdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sa_token')?.value

  if (!SECRET || token !== SECRET) {
    notFound()
  }

  const supabase = await createClient()

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
    supabase.from('profiles').select('id, full_name, email, role, created_at, banni, nb_avertissements').order('created_at', { ascending: false }).limit(20),
    supabase.from('signalements').select('id, raison, statut, priorite, created_at, post_id').order('created_at', { ascending: false }).limit(10),
    supabase.from('sanctions').select('id, type_sanction, raison, created_at, expire_le, user_id').order('created_at', { ascending: false }).limit(20),
    supabase.from('audit_moderation').select('id, action, cible_type, created_at, moderateur_id').order('created_at', { ascending: false }).limit(30),
    supabase.from('posts').select('id, titre, user_id, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <SuperAdminClient
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
