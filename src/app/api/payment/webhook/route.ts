/**
 * POST /api/payment/webhook
 * Webhook Wave — appelé automatiquement après paiement confirmé.
 * Configure dans Wave Dashboard : https://app.wave.com/developers/webhooks
 * URL : https://terangalearn-sandy.vercel.app/api/payment/webhook
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()

    // Vérification signature Wave (HMAC-SHA256)
    const waveSecret = process.env.WAVE_WEBHOOK_SECRET
    if (waveSecret) {
      const signature = req.headers.get('wave-signature') ?? ''
      const expected = crypto
        .createHmac('sha256', waveSecret)
        .update(body)
        .digest('hex')
      if (signature !== expected) {
        console.error('Webhook signature invalide')
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // On ne traite que les paiements réussis
    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true })
    }

    const session = event.data
    const subscriptionId = session.client_reference

    if (!subscriptionId) {
      return NextResponse.json({ error: 'client_reference manquant' }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer l'abonnement pending
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (!sub) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
    }

    // Activer l'abonnement
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        wave_ref: session.id,
      })
      .eq('id', subscriptionId)

    // Mettre à jour le profil utilisateur
    await supabase
      .from('profiles')
      .update({
        plan: 'premium',
        plan_started_at: sub.started_at,
        plan_expires_at: sub.expires_at,
      })
      .eq('id', sub.user_id)

    console.log(`Premium activé pour user ${sub.user_id} jusqu'au ${sub.expires_at}`)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
