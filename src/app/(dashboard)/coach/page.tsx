import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CoachChat from '@/components/coach/CoachChat'

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: historique } = await supabase
    .from('messages_coach')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
  <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-80px)]">
    <div className="mb-3 flex-shrink-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Coach IA 🤖</h1>
      <p className="text-gray-500 text-sm mt-0.5">
        Pose toutes tes questions sur le programme sénégalais
      </p>
    </div>
    <div className="flex-1 min-h-0">
      <CoachChat
        userId={user.id}
        profile={profile}
        historique={historique ?? []}
      />
    </div>
  </div>
)
}