'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Profile } from '@/types'
import {
  LayoutDashboard, BookOpen, PenTool, Bot,
  Trophy, User, LogOut, Zap, Users, Calendar,
  GraduationCap, FileText, Library,
  Settings, Swords
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cours', icon: BookOpen, label: 'Cours' },
  { href: '/exercices', icon: PenTool, label: 'Exercices' },
  { href: '/epreuves', icon: FileText, label: 'Épreuves & Annales' },
  { href: '/bibliotheque', icon: Library, label: 'Bibliothèque' },
  { href: '/coach', icon: Bot, label: 'Coach IA' },
  { href: '/examen', icon: GraduationCap, label: 'Simulation d\'examen' },
  { href: '/duel', icon: Swords, label: 'Mode Duel' },
  { href: '/communaute', icon: Users, label: 'Communauté' },
  { href: '/planification', icon: Calendar, label: 'Planification' },
  { href: '/orientation', icon: GraduationCap, label: 'Analyse & Orientation' },
  { href: '/classement', icon: Trophy, label: 'Classement' },
  { href: '/profil', icon: User, label: 'Mon Profil' },
  { href: '/parametres', icon: Settings, label: 'Paramètres' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const niveau = profile?.niveau ?? 1
  const xp = profile?.xp ?? 0
  const xpPourProchainNiveau = niveau * 200
  const pct = Math.min((xp % xpPourProchainNiveau) / xpPourProchainNiveau * 100, 100)

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 card-shadow z-40 overflow-y-auto">

      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="TerangaLearn"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
          <div>
            <h1 className="font-bold text-green text-lg leading-none">TerangaLearn</h1>
            <p className="text-xs text-gray-400 mt-0.5">Réussis ton examen</p>
          </div>
        </div>
      </div>

      {/* Profil XP */}
      <div className="p-4 mx-4 mt-4 bg-green-light dark:bg-gray-800 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-green">
            {profile?.full_name?.split(' ')[0] ?? 'Élève'}
          </span>
          <div className="flex items-center gap-1 bg-green text-white text-xs px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" />
            <span>{xp} XP</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-1.5">Niveau {niveau}</div>
        <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">{xp % xpPourProchainNiveau} / {xpPourProchainNiveau} XP</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-green text-white shadow-green'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-green/5 hover:text-green hover:translate-x-1'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform duration-200',
                !active && 'group-hover:scale-110'
              )} />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Streak + Thème + Logout */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        {(profile?.streak ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl px-4 py-2.5 text-sm font-medium">
            🔥 Streak : {profile?.streak} jour{(profile?.streak ?? 0) > 1 ? 's' : ''}
          </div>
        )}

        {/* Bouton thème clair / sombre */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">Thème</span>
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}