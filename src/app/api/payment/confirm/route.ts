/**
 * POST /api/payment/confirm
 * Vérifie et confirme un paiement après retour de Wave (page success).
 * Utilisé aussi pour tests en dev (sans WAVE_API_KEY).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId manquant' }, { status: 400 })
    }

    // Récupérer l'abonnement (appartient bien à ce user)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (!sub) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
    }

    // Si déjà actif → retourner succès directement
    if (sub.status === 'active') {
      return NextResponse.json({ success: true, alreadyActive: true })
    }

    // En production, vérifier le statut auprès de Wave
    const waveKey = process.env.WAVE_API_KEY
    if (waveKey && sub.wave_ref) {
      const waveRes = await fetch(
        `https://api.wave.com/v1/checkout/sessions/${sub.wave_ref}`,
        { headers: { Authorization: `Bearer ${waveKey}` } }
      )
      if (waveRes.ok) {
        const waveSession = await waveRes.json()
        if (waveSession.payment_status !== 'succeeded') {
          return NextResponse.json({ error: 'Paiement non confirmé par Wave' }, { status: 402 })
        }
      }
    }

    // Activer l'abonnement
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', subscriptionId)

    // Activer le plan Premium
    await supabase
      .from('profiles')
      .update({
        plan: 'premium',
        plan_started_at: sub.started_at,
        plan_expires_at: sub.expires_at,
      })
      .eq('id', user.id)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Payment confirm error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
