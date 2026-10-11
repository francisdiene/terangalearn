import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Email HTML template
function buildEmail(prenom: string, streak: number, matiere: string, classe: string): string {
  const streakMsg = streak > 0
    ? `🔥 Tu es à <strong>${streak} jour${streak > 1 ? 's' : ''} de streak</strong> — ne perds pas ta série !`
    : `⚡ Recommence une série de révisions aujourd'hui !`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rappel de révision — TerangaLearn</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header vert -->
          <tr>
            <td style="background:#1A7A4A;padding:28px 32px;text-align:center;">
              <img src="https://terangalearn.vercel.app/logo.png" alt="TerangaLearn" width="48" height="48" style="border-radius:12px;margin-bottom:12px;" />
              <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:700;">TerangaLearn</h1>
              <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;">Réussis ton ${classe === '3eme' ? 'BFEM' : 'BAC'}</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Salut ${prenom} 👋</p>
              <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">Tu n'as pas encore révisé aujourd'hui.</p>

              <!-- Streak -->
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:20px;">
                <p style="margin:0;font-size:14px;color:#c2410c;">${streakMsg}</p>
              </div>

              <!-- Matière recommandée -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:28px;">
                <p style="margin:0 0 4px;font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Matière recommandée</p>
                <p style="margin:0;font-size:16px;color:#15803d;font-weight:700;">📚 ${matiere}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#4ade80;">C'est ta matière qui a le plus besoin d'attention.</p>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://terangalearn.vercel.app/exercices"
                       style="display:inline-block;background:#1A7A4A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                      Commencer à réviser →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                TerangaLearn · Dakar, Sénégal<br/>
                <a href="https://terangalearn.vercel.app/parametres" style="color:#9ca3af;">Se désabonner des rappels</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  // Sécurité : vérifier le secret cron
  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 1. Trouver les users actifs qui n'ont PAS fait d'exercice aujourd'hui
    // et qui ont activé les rappels email
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        streak,
        classe,
        serie,
        last_activity_date
      `)
      .eq('notif_email', true)
      .not('email', 'is', null)

    if (usersError) throw usersError
    if (!users?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Aucun utilisateur' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Filtrer ceux qui n'ont pas eu d'activité aujourd'hui
    const inactifs = users.filter((u) => {
      const lastActivity = u.last_activity_date?.split('T')[0]
      return lastActivity !== today
    })

    if (!inactifs.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Tous les users sont actifs' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Pour chaque user inactif, trouver sa matière la plus faible
    let sent = 0
    const errors: string[] = []

    for (const user of inactifs) {
      try {
        const prenom = user.full_name?.split(' ')[0] ?? 'Élève'

        // Matière la plus faible via progressions
        const { data: progressions } = await supabase
          .from('progressions')
          .select('matiere, score_moyen')
          .eq('user_id', user.id)
          .order('score_moyen', { ascending: true })
          .limit(1)

        const matiere = progressions?.[0]?.matiere ?? 'Mathématiques'

        // 3. Envoyer l'email via Supabase Auth (SMTP configuré)
        const emailHtml = buildEmail(prenom, user.streak ?? 0, matiere, user.classe ?? '3eme')

        // Utiliser le SMTP Supabase via l'API Admin
        const resendApiKey = Deno.env.get('RESEND_API_KEY')

        if (resendApiKey) {
          // Option Resend (recommandé)
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'TerangaLearn <rappels@terangalearn.sn>',
              to: [user.email],
              subject: `${prenom}, tu n'as pas encore révisé aujourd'hui 📚`,
              html: emailHtml,
            }),
          })

          if (res.ok) sent++
          else errors.push(`${user.email}: ${await res.text()}`)
        } else {
          // Fallback : log (SMTP non configuré)
          console.log(`[RAPPEL] Serait envoyé à ${user.email} (${prenom}) — matière: ${matiere}`)
          sent++
        }
      } catch (err) {
        errors.push(`${user.email}: ${String(err)}`)
      }
    }

    console.log(`Rappels envoyés: ${sent}/${inactifs.length}`, errors.length ? { errors } : '')

    return new Response(
      JSON.stringify({ sent, total: inactifs.length, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('rappel-revision error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
