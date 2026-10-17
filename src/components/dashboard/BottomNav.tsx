'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, PenTool, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Accueil' },
  { href: '/cours',      icon: BookOpen,         label: 'Cours' },
  { href: '/exercices',  icon: PenTool,          label: 'Exercices' },
  { href: '/coach',      icon: Bot,              label: 'Coach IA' },
  { href: '/profil',     icon: User,             label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-around px-1 py-1.5">
        {bottomItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 flex-1"
            >
              <div className={cn(
                'w-9 h-9 flex items-center justify-center rounded-xl transition-all',
                active ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-transparent'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-all',
                  active ? 'text-white' : 'text-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all truncate',
                active ? 'text-green-600' : 'text-gray-400'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
