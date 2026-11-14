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

  // Récupérer l'utilisateur authentifié pour le currentUserId
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const now = new Date()
  const il_y_a_7j   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const il_y_a_30j  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const il_y_a_90j  = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const debutJour   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    // === Utilisateurs ===
    { count: totalUsers },
    { count: totalEleves },
    { count: nouveaux7j },
    { count: nouveaux30j },
    { count: actifs7j },
    { count: actifs30j },
    { count: inscritsAujourdhui },

    // === Contenu pédagogique ===
    { count: totalCours },
    { count: coursAvecResume },
    { count: totalEpreuves },
    { count: totalExamens },
    { count: examens7j },
    { count: totalExercices },

    // === Communauté / modération ===
    { count: totalPosts },
    { count: totalSignalements },
    { count: sanctionsActives },

    // === Premium ===
    { count: totalPremium },

    // === Données récentes ===
    { data: recentUsers },
    { data: recentSignalements },
    { data: sanctions },
    { data: auditLog },
    { data: recentPosts },
    { data: recentExamens },
    { data: topEleves },

    // === Subscriptions ===
    { data: recentSubscriptions },

    // === Duels ===
    { count: totalDuels },
    { count: duels7j },

    // === Inscriptions par jour (30 derniers jours) ===
    { data: inscriptionsParJour },

  ] = await Promise.all([
    // Tous les utilisateurs (admin inclus)
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    // Élèves seulement
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .not('role', 'in', '("admin","super_admin","moderateur")'),
    // Nouveaux inscrits 7j
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', il_y_a_7j),
    // Nouveaux inscrits 30j
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', il_y_a_30j),
    // Actifs 7j (via examens_simules comme proxy)
    supabase.from('examens_simules').select('user_id', { count: 'exact', head: true })
      .gte('created_at', il_y_a_7j),
    // Actifs 30j
    supabase.from('examens_simules').select('user_id', { count: 'exact', head: true })
      .gte('created_at', il_y_a_30j),
    // Inscrits aujourd'hui
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', debutJour),

    // Cours
    supabase.from('cours').select('*', { count: 'exact', head: true }),
    supabase.from('cours').select('*', { count: 'exact', head: true })
      .not('resume', 'is', null).gt('resume', ''),
    supabase.from('epreuves').select('*', { count: 'exact', head: true }),
    supabase.from('examens_simules').select('*', { count: 'exact', head: true }),
    supabase.from('examens_simules').select('*', { count: 'exact', head: true })
      .gte('created_at', il_y_a_7j),
    supabase.from('exercices').select('*', { count: 'exact', head: true }),

    // Communauté
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('signalements').select('*', { count: 'exact', head: true })
      .eq('statut', 'en_attente'),
    supabase.from('sanctions').select('*', { count: 'exact', head: true }),

    // Premium
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .not('plan', 'in', '("free","")').not('plan', 'is', null),

    // Données récentes
    supabase.from('profiles')
      .select('id, full_name, email, role, created_at, banni, nb_avertissements, plan, niveau, serie')
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('signalements')
      .select('id, raison, statut, priorite, created_at, post_id')
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('sanctions')
      .select('id, type_sanction, raison, created_at, expire_le, user_id')
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('audit_moderation')
      .select('id, action, cible_type, created_at, moderateur_id')
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('posts')
      .select('id, titre, user_id, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('examens_simules')
      .select('id, user_id, score, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('profiles')
      .select('id, full_name, created_at, niveau')
      .order('created_at', { ascending: false }).limit(10),

    // Subscriptions
    supabase.from('subscriptions')
      .select('id, user_id, plan, status, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false }).limit(20),

    // Duels
    supabase.from('duels').select('*', { count: 'exact', head: true }),
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .gte('created_at', il_y_a_7j),

    // Inscriptions par jour (approximation via created_at)
    supabase.from('profiles')
      .select('created_at')
      .gte('created_at', il_y_a_30j)
      .order('created_at', { ascending: true }),
  ])

  // Count signalements per post
  const postIds = (recentPosts ?? []).map((p: any) => p.id)
  let signalementsPerPost: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: sigData } = await supabase
      .from('signalements').select('post_id').in('post_id', postIds)
    if (sigData) {
      for (const s of sigData) {
        if (s.post_id) signalementsPerPost[s.post_id] = (signalementsPerPost[s.post_id] ?? 0) + 1
      }
    }
  }

  const postsWithCounts = (recentPosts ?? []).map((p: any) => ({
    ...p,
    nb_signalements: signalementsPerPost[p.id] ?? 0,
  }))

  // Construire courbe inscriptions par jour
  const inscriptionsChartData = buildInscriptionsChart(inscriptionsParJour ?? [], 30)

  // Répartition par niveau
  const niveauxMap: Record<string, number> = {}
  for (const u of (recentUsers ?? [])) {
    if (u.niveau) niveauxMap[u.niveau] = (niveauxMap[u.niveau] ?? 0) + 1
  }

  return (
    <SuperDashboardClient
      currentUserId={authUser?.id ?? ''}
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
      plateformeStats={{
        totalEleves: totalEleves ?? 0,
        nouveaux7j: nouveaux7j ?? 0,
        nouveaux30j: nouveaux30j ?? 0,
        totalCours: totalCours ?? 0,
        coursAvecResume: coursAvecResume ?? 0,
        totalEpreuves: totalEpreuves ?? 0,
        totalExamens: totalExamens ?? 0,
        examens7j: examens7j ?? 0,
        actifs7j: actifs7j ?? 0,
        actifs30j: actifs30j ?? 0,
        totalExercices: totalExercices ?? 0,
        inscritsAujourdhui: inscritsAujourdhui ?? 0,
        totalDuels: totalDuels ?? 0,
        duels7j: duels7j ?? 0,
        totalPremium: totalPremium ?? 0,
      }}
      topEleves={topEleves ?? []}
      recentExamens={recentExamens ?? []}
      recentSubscriptions={recentSubscriptions ?? []}
      inscriptionsChart={inscriptionsChartData}
      niveauxRepartition={Object.entries(niveauxMap).map(([niveau, count]) => ({ niveau, count }))}
    />
  )
}

/** Groupe les inscriptions par jour sur les N derniers jours */
function buildInscriptionsChart(rows: { created_at: string }[], days: number) {
  const result: { date: string; count: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: 0 })
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10)
    const slot = result.find(r => r.date === key)
    if (slot) slot.count++
  }
  return result
}
