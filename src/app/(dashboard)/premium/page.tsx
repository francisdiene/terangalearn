import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/plan'
import PremiumClient from './PremiumClient'

export const dynamic = 'force-dynamic'

export default async function PremiumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const planInfo = await getUserPlan(user.id)

  return <PremiumClient planInfo={planInfo} userId={user.id} />
}
