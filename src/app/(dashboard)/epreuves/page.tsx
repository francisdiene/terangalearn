import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EpreuvesClient from '@/components/epreuves/EpreuvesClient'

export default async function EpreuvesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Filtrer selon la classe :
  // Tous les docs BAC ont classe='terminale', les BFEM auront classe='troisieme'
  // Ce filtre unique suffit pour séparer les deux populations
  const classe = profile?.classe ?? 'terminale'
  const classeDB = classe === '3eme' ? 'troisieme' : 'terminale'

  const { data: epreuves } = await supabase
    .from('epreuves')
    .select('*')
    .eq('classe', classeDB)
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