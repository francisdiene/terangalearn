import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliothequeClient from '@/components/bibliotheque/BibliothequeClient'

export const revalidate = 60 // Cache 60 secondes

export default async function BibliothequePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: livres } = await supabase
    .from('bibliotheque')
    .select('*')
    .or(`classe.eq.${profile?.classe},classe.eq.both`)
    .order('matiere')

  return (
    <BibliothequeClient
      userId={user.id}
      profile={profile}
      livres={livres ?? []}
    />
  )
}