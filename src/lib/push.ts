/**
 * Helper serveur pour envoyer des notifications push
 * Usage: await sendPushToUser(userId, { title: '...', body: '...' })
 */
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

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

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs?.length) return 0

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
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

    // Nettoyer les abonnements expirés
    const expired = results
      .map((r, i) => ({ r, sub: subs[i] }))
      .filter(({ r }) => r.status === 'rejected' && (r.reason as any)?.statusCode === 410)

    if (expired.length) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expired.map(({ sub }) => sub.endpoint))
    }

    return results.filter((r) => r.status === 'fulfilled').length
  } catch (err) {
    console.error('sendPushToUser error:', err)
    return 0
  }
}

// Notifications prédéfinies
export const PushTemplates = {
  streakRappel: (streak: number) => ({
    title: '🔥 Ne perds pas ton streak !',
    body: `Tu es à ${streak} jours de suite. Fais au moins un exercice aujourd'hui !`,
    url: '/exercices',
    tag: 'streak',
  }),

  nouveauBadge: (badge: string) => ({
    title: '🏆 Nouveau badge !',
    body: `Tu as obtenu le badge "${badge}". Continue comme ça !`,
    url: '/profil',
    tag: 'badge',
  }),

  rappelRevision: (matiere: string) => ({
    title: '📚 Rappel de révision',
    body: `Tu n'as pas révisé ${matiere} depuis longtemps. C'est le moment !`,
    url: '/exercices',
    tag: 'revision',
  }),

  examenDemain: (matiere: string) => ({
    title: '⚡ Examen demain !',
    body: `Pense à réviser ${matiere} ce soir. Bonne chance !`,
    url: '/examen',
    tag: 'examen',
  }),

  monteeNiveau: (niveau: number) => ({
    title: `🚀 Niveau ${niveau} atteint !`,
    body: 'Félicitations ! Tu continues ta progression sur TerangaLearn.',
    url: '/profil',
    tag: 'niveau',
  }),
}
