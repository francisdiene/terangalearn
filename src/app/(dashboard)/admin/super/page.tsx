import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperDashboardClient from './SuperDashboardClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const cookieStore = await cookies()
  const sa = cookieStore.get('sa')?.value
  const secret = process.env.SUPERADMIN_SECRET

  if (!secret || sa !== secret) {
    redirect('/admin/super/login')
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
    supabase.from('profiles').select('id, full_name, email, role, created_at, banni, nb_avertissements').order('created_at', { ascending: false }).limit(30),
    supabase.from('signalements').select('id, raison, statut, priorite, created_at, post_id').order('created_at', { ascending: false }).limit(15),
    supabase.from('sanctions').select('id, type_sanction, raison, created_at, expire_le, user_id').order('created_at', { ascending: false }).limit(20),
    supabase.from('audit_moderation').select('id, action, cible_type, created_at, moderateur_id').order('created_at', { ascending: false }).limit(30),
    supabase
      .from('posts')
      .select('id, titre, user_id, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Count signalements per post
  const postIds = (recentPosts ?? []).map((p: any) => p.id)
  let signalementsPerPost: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: sigData } = await supabase
      .from('signalements')
      .select('post_id')
      .in('post_id', postIds)
    if (sigData) {
      for (const s of sigData) {
        if (s.post_id) {
          signalementsPerPost[s.post_id] = (signalementsPerPost[s.post_id] ?? 0) + 1
        }
      }
    }
  }

  const postsWithCounts = (recentPosts ?? []).map((p: any) => ({
    ...p,
    nb_signalements: signalementsPerPost[p.id] ?? 0,
  }))

  return (
    <SuperDashboardClient
      currentUserId=""
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
      recentPosts={postsWithCounts}
    />
  )
}
