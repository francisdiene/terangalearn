'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Info, CheckCircle2, AlertTriangle, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  titre: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  created_at: string
}

const TYPE_CONFIG = {
  info:    { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-950/40',   border: 'border-blue-200 dark:border-blue-800',   text: 'text-blue-800 dark:text-blue-200',   iconColor: 'text-blue-500' },
  success: { icon: CheckCircle2,  bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200', iconColor: 'text-green-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-200', iconColor: 'text-amber-500' },
  alert:   { icon: Megaphone,     bg: 'bg-red-50 dark:bg-red-950/40',     border: 'border-red-200 dark:border-red-800',     text: 'text-red-800 dark:text-red-200',     iconColor: 'text-red-500' },
}

export default function InAppBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications_unread')
          .select('id, titre, message, type, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        if (data) setNotifications(data)
      } catch {
        // Table pas encore créée — silencieux
      }
    }

    fetchNotifications()
  }, [])

  const dismiss = async (notifId: string) => {
    setDismissed(prev => new Set([...prev, notifId]))

    // Marquer comme lu en DB
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('notifications_read')
        .upsert({ user_id: user.id, notification_id: notifId })
        .select()
    }
  }

  const visible = notifications.filter(n => !dismissed.has(n.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {visible.map(notif => {
        const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
        const Icon = cfg.icon
        return (
          <div
            key={notif.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border',
              cfg.bg, cfg.border
            )}
          >
            <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', cfg.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold leading-snug', cfg.text)}>
                {notif.titre}
              </p>
              <p className={cn('text-xs mt-0.5 leading-relaxed opacity-80', cfg.text)}>
                {notif.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(notif.id)}
              className={cn('flex-shrink-0 opacity-50 hover:opacity-100 transition', cfg.text)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
