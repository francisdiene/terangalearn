import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'
import BottomNav from '@/components/dashboard/BottomNav'
import PageTransition from '@/components/ui/PageTransition'
import NuitRevision from '@/components/ui/NuitRevision'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // --- Mise à jour du streak ---
  if (profile) {
    const today = new Date().toISOString().split('T')[0] // "2026-11-09"
    const lastSeen = profile.last_seen_date ?? null

    if (lastSeen !== today) {
      // Vérifie si hier = lastSeen (streak continu)
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const newStreak = lastSeen === yesterday
        ? (profile.streak ?? 0) + 1  // continuité
        : 1                           // rupture ou première fois

      await supabase
        .from('profiles')
        .update({ streak: newStreak, last_seen_date: today })
        .eq('id', user.id)

      // Mettre à jour l'objet local pour que l'UI reflète la valeur fraîche
      profile.streak = newStreak
      profile.last_seen_date = today
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <MobileNav profile={profile} />
        <main className="flex-1 main-content-mobile md:pb-8 w-full min-w-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <BottomNav />
      <NuitRevision />
    </div>
  )
}