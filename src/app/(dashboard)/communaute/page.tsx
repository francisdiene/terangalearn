import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunauteClient from '@/components/communaute/CommunauteClient'

export default async function CommunautePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(full_name, niveau, classe)')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: groupes } = await supabase
    .from('groupes')
    .select('*, groupe_membres(user_id)')
    .order('created_at', { ascending: false })

  return (
    <CommunauteClient
      userId={user.id}
      profile={profile}
      postsInitiaux={posts ?? []}
      groupes={groupes ?? []}
    />
  )
}