import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/notifications/subscribe
 * Enregistre ou met à jour la subscription push de l'utilisateur courant.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { endpoint, p256dh, auth, userAgent } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Upsert — si l'endpoint existe déjà pour cet user, on met à jour
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent ?? null,
        },
        { onConflict: 'user_id,endpoint' }
      )

    if (error) {
      console.error('Erreur upsert push_subscriptions:', error)
      return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur /api/notifications/subscribe:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
