import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/notifications/send
 * Réservé aux super_admin.
 * Crée la notification en DB (in-app) ET envoie un push à tous les abonnés.
 *
 * Body: { titre, message, type?, cible?, url? }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Vérifier que l'appelant est super_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Admin check — profile:', profile, 'error:', profileError)

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès refusé', role: profile?.role ?? 'null' }, { status: 403 })
    }

    const { titre, message, type = 'info', cible = 'tous', url = '/dashboard' } = await req.json()

    if (!titre?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'titre et message requis' }, { status: 400 })
    }

    // 1. Insérer la notification in-app en DB
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        titre: titre.trim(),
        message: message.trim(),
        type,
        cible,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (notifError) {
      console.error('Erreur insert notification:', JSON.stringify(notifError))
      return NextResponse.json({ error: 'Erreur DB notification', detail: notifError.message, code: notifError.code }, { status: 500 })
    }

    // 2. Envoyer les push web si les clés VAPID sont configurées
    const vapidPublic  = process.env.VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY
    const vapidEmail   = process.env.VAPID_EMAIL ?? 'contact@terangalearn.sn'

    if (!vapidPublic || !vapidPrivate) {
      // Pas de clés VAPID → on retourne quand même success (in-app fonctionne)
      return NextResponse.json({
        success: true,
        notificationId: notif.id,
        pushSent: 0,
        warning: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY non configurés — push désactivé',
      })
    }

    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate)

    // Récupérer toutes les subscriptions actives
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, notificationId: notif.id, pushSent: 0 })
    }

    const payload = JSON.stringify({
      title: titre.trim(),
      body: message.trim(),
      icon: '/logo.png',
      badge: '/logo.png',
      url,
      tag: `notif-${notif.id}`,
    })

    // Envoyer en parallèle (avec gestion des subscriptions expirées)
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 86400 } // 24h TTL
        )
      )
    )

    // Supprimer les subscriptions invalides (410 Gone)
    const expiredEndpoints: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number }
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(subscriptions[i].endpoint)
        }
      }
    })

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    const sent = results.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({
      success: true,
      notificationId: notif.id,
      pushSent: sent,
      pushTotal: subscriptions.length,
      expiredCleaned: expiredEndpoints.length,
    })
  } catch (err) {
    console.error('Erreur /api/notifications/send:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
