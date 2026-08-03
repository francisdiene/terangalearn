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

  // Charger la liste des conversations
  const { data: conversations } = await supabase
    .from('coach_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-80px)]">
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Coach IA</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Pose toutes tes questions sur le programme sénégalais
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <CoachChat
          userId={user.id}
          profile={profile}
          conversationsInitiales={conversations ?? []}
        />
      </div>
    </div>
  )
}