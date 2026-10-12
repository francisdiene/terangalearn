import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

const SECRET = process.env.SUPERADMIN_SECRET

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  if (!SECRET || params.key !== SECRET) {
    redirect('/')
  }

  const supabase = await createClient()

  // Stats globales
  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalSignalements },
    { count: sanctionsActives },
    { data: recentUsers },
    { data: recentSignalements },
    { data: sanctions },
    { data: auditLog },
    { data: topPosters },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('signalements').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    supabase.from('sanctions').select('*', { count: 'exact', head: true }).or('expire_le.is.null,expire_le.gt.' + new Date().toISOString()),
    supabase.from('profiles').select('id, full_name, email, role, created_at, banni, nb_avertissements').order('created_at', { ascending: false }).limit(20),
    supabase.from('signalements').select('*, posts(titre, user_id), profiles!signalements_signale_par_fkey(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('sanctions').select('*, profiles!sanctions_user_id_fkey(full_name, email), profiles!sanctions_applique_par_fkey(full_name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('audit_moderation').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(30),
    supabase.from('posts').select('user_id, profiles(full_name), titre').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <SuperAdminClient
      secretKey={params.key!}
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
      recentPosts={topPosters ?? []}
    />
  )
}
