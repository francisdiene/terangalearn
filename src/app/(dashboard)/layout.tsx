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