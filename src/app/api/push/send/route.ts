import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  'mailto:contact@terangalearn.sn',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { userId, payload }: { userId?: string; payload: PushPayload } = await req.json()

    // Cible : userId spécifié ou l'utilisateur courant
    const targetId = userId || user.id

    // Récupérer les abonnements de l'utilisateur cible
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', targetId)

    if (error || !subs?.length) {
      return NextResponse.json({ sent: 0 })
    }

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/logo.png',
            badge: '/logo.png',
            url: payload.url || '/dashboard',
            tag: payload.tag || 'terangalearn',
          })
        )
      )
    )

    // Supprimer les abonnements expirés (410 Gone)
    const expired = results
      .map((r, i) => ({ r, sub: subs[i] }))
      .filter(({ r }) => r.status === 'rejected' && (r.reason as any)?.statusCode === 410)

    if (expired.length) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expired.map(({ sub }) => sub.endpoint))
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (err) {
    console.error('Push send error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
