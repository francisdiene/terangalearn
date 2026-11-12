/**
 * POST /api/payment/create
 * Crée une session de paiement Wave et retourne l'URL de checkout.
 * Nécessite : WAVE_API_KEY dans .env
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WAVE_API_URL = 'https://api.wave.com/v1/checkout/sessions'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { billingCycle } = await req.json()
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Cycle invalide' }, { status: 400 })
    }

    const amountFcfa = billingCycle === 'monthly' ? 1900 : 18000

    // Calculer les dates d'expiration
    const startedAt = new Date()
    const expiresAt = new Date(startedAt)
    if (billingCycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      // Année scolaire : expire le 31 juillet de l'année suivante
      const year = expiresAt.getMonth() >= 8 // septembre → nouvelle année scolaire
        ? expiresAt.getFullYear() + 1
        : expiresAt.getFullYear()
      expiresAt.setFullYear(year, 6, 31) // 31 juillet
      expiresAt.setHours(23, 59, 59, 999)
    }

    // Créer l'entrée en DB (statut pending)
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: 'premium',
        billing_cycle: billingCycle,
        amount_fcfa: amountFcfa,
        status: 'pending',
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (subError || !sub) {
      return NextResponse.json({ error: 'Erreur création abonnement' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://terangalearn-sandy.vercel.app'

    // Appel Wave API
    const waveKey = process.env.WAVE_API_KEY
    if (!waveKey) {
      // Mode développement : simuler le paiement
      return NextResponse.json({
        dev: true,
        subscriptionId: sub.id,
        message: 'WAVE_API_KEY non configurée — utiliser /api/payment/confirm pour tester',
      })
    }

    const waveRes = await fetch(WAVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'XOF',
        amount: String(amountFcfa),
        success_url: `${baseUrl}/premium/success?sub=${sub.id}`,
        error_url: `${baseUrl}/premium?error=payment_failed`,
        client_reference: sub.id,
      }),
    })

    if (!waveRes.ok) {
      const err = await waveRes.text()
      console.error('Wave API error:', err)
      return NextResponse.json({ error: 'Erreur Wave API' }, { status: 502 })
    }

    const waveData = await waveRes.json()

    // Sauvegarder le checkout_id Wave
    await supabase
      .from('subscriptions')
      .update({ wave_ref: waveData.id, wave_session_id: waveData.id })
      .eq('id', sub.id)

    return NextResponse.json({
      checkoutUrl: waveData.wave_launch_url,
      subscriptionId: sub.id,
    })

  } catch (err) {
    console.error('Payment create error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
