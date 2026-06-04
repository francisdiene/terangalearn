'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Profile } from '@/types'
import {
  Menu, X, LayoutDashboard, BookOpen, PenTool,
  Bot, Users, GraduationCap, Trophy, User,
  Calendar, FileText, Library, LogOut, Zap, Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cours', icon: BookOpen, label: 'Cours' },
  { href: '/exercices', icon: PenTool, label: 'Exercices' },
  { href: '/epreuves', icon: FileText, label: 'Épreuves & Annales' },
  { href: '/bibliotheque', icon: Library, label: 'Bibliothèque' },
  { href: '/coach', icon: Bot, label: 'Coach IA' },
  { href: '/communaute', icon: Users, label: 'Communauté' },
  { href: '/planification', icon: Calendar, label: 'Planification' },
  { href: '/orientation', icon: GraduationCap, label: 'Analyse & Orientation' },
  { href: '/classement', icon: Trophy, label: 'Classement' },
  { href: '/profil', icon: User, label: 'Mon Profil' },
]

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const niveau = profile?.niveau ?? 1
  const xp = profile?.xp ?? 0
  const xpPourProchain = niveau * 200
  const pct = Math.min((xp % xpPourProchain) / xpPourProchain * 100, 100)

  return (
    <>
      {/* Header mobile */}
<header className="md:hidden glass border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
  {/* Hamburger */}
  <button
    onClick={() => setOpen(true)}
    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
  >
    <Menu className="w-5 h-5 text-gray-700" />
  </button>

  {/* Logo centré */}
  <div className="flex items-center gap-2">
    <Image
      src="/logo.png"
      alt="TerangaLearn"
      width={28}
      height={28}
      className="object-contain"
    />
    <span className="font-bold text-green text-base">TerangaLearn</span>
  </div>

  {/* XP + Streak */}
  <div className="flex items-center gap-1.5">
    {(profile?.streak ?? 0) > 0 && (
      <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-medium">
        🔥{profile?.streak}
      </span>
    )}
    <div className="bg-green text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
      <Zap className="w-3 h-3" />
      {profile?.xp ?? 0}
    </div>
  </div>
</header>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header drawer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-green">TerangaLearn</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Profil XP */}
        <div className="mx-4 mt-4 bg-green-light rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-green truncate">
              {profile?.full_name?.split(' ')[0] ?? 'Élève'}
            </span>
            <div className="flex items-center gap-1 bg-green text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              <Zap className="w-3 h-3" />
              <span>{xp} XP</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-1">Niveau {niveau}</div>
          <div className="w-full bg-white rounded-full h-1.5">
            <div
              className="bg-green h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {(profile?.streak ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
              <Flame className="w-3 h-3" />
              <span>{profile?.streak} jours de streak</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-green text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-green'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            )
          })}
        </nav>

        {/* Déconnexion */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}