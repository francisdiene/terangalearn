import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EpreuvesClient from '@/components/epreuves/EpreuvesClient'

export default async function EpreuvesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('classe')
    .eq('id', user.id)
    .single()

  const { data: epreuves } = await supabase
    .from('epreuves')
    .select('*')
    .in('type', ['bac', 'bfem', 'corrige'])
    .order('annee', { ascending: false })
    .order('matiere')

  return (
    <EpreuvesClient
      userId={user.id}
      profile={profile}
      epreuves={epreuves ?? []}
    />
  )
}