/**
 * Vérification du plan côté SERVEUR uniquement.
 * Ne jamais importer dans un composant client.
 */
import { createClient } from '@/lib/supabase/server'

export type Plan = 'free' | 'premium' | 'school'

export interface PlanInfo {
  plan: Plan
  expiresAt: Date | null
  isActive: boolean
  // Quotas
  coachIaDaily: number | null   // null = illimité
  examsWeekly: number | null
  canOrientation: boolean
  canDownload: boolean
  canPlanifSmart: boolean
}

const FREE_QUOTAS = {
  coachIaDaily: 3,
  examsWeekly: 2,
  canOrientation: false,
  canDownload: false,
  canPlanifSmart: false,
}

const PREMIUM_QUOTAS = {
  coachIaDaily: null,
  examsWeekly: null,
  canOrientation: true,
  canDownload: true,
  canPlanifSmart: true,
}

/**
 * Récupère le plan actif d'un user.
 * Vérifie la date d'expiration côté serveur.
 */
export async function getUserPlan(userId: string): Promise<PlanInfo> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { plan: 'free', expiresAt: null, isActive: true, ...FREE_QUOTAS }
  }

  const plan = (profile.plan ?? 'free') as Plan
  const expiresAt = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null

  // Vérification expiration côté serveur
  const isActive = plan === 'free' || (expiresAt ? expiresAt > new Date() : false)

  // Si plan payant mais expiré → traiter comme free
  const effectivePlan: Plan = isActive ? plan : 'free'

  const quotas = effectivePlan === 'free' ? FREE_QUOTAS : PREMIUM_QUOTAS

  return {
    plan: effectivePlan,
    expiresAt,
    isActive,
    ...quotas,
  }
}

/**
 * Vérifie combien de messages Coach IA un user a envoyé aujourd'hui.
 */
export async function getCoachIaUsageToday(userId: string): Promise<number> {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('messages_coach')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', today.toISOString())

  return count ?? 0
}

/**
 * Vérifie combien d'examens simulés un user a passé cette semaine.
 */
export async function getExamsThisWeek(userId: string): Promise<number> {
  const supabase = await createClient()
  const monday = new Date()
  monday.setDate(monday.getDate() - monday.getDay() + 1)
  monday.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('examens_simules')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monday.toISOString())

  return count ?? 0
}
