import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function buildEmail(prenom: string, streak: number, matiere: string, classe: string): string {
  const streakMsg = streak > 0
    ? `🔥 Tu es à <strong>${streak} jour${streak > 1 ? 's' : ''} de streak</strong> — ne perds pas ta série !`
    : `⚡ Recommence une série de révisions aujourd'hui !`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#1A7A4A;padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;font-size:20px;margin:0;">TerangaLearn</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;">Réussis ton ${classe === '3eme' ? 'BFEM' : 'BAC'}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Salut ${prenom} 👋</p>
            <p style="font-size:15px;color:#6b7280;margin:0 0 24px;">Tu n'as pas encore révisé aujourd'hui.</p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;color:#c2410c;">${streakMsg}</p>
            </div>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;color:#16a34a;font-weight:600;">MATIÈRE RECOMMANDÉE</p>
              <p style="margin:0;font-size:16px;color:#15803d;font-weight:700;">📚 ${matiere}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://terangalearn.vercel.app/exercices"
                   style="display:inline-block;background:#1A7A4A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                  Commencer à réviser →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              TerangaLearn · Dakar, Sénégal<br/>
              <a href="https://terangalearn.vercel.app/parametres" style="color:#9ca3af;">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  console.log('=== rappel-revision called ===', req.method)
  console.log('ENV:', {
    hasUrl: !!Deno.env.get('SUPABASE_URL'),
    hasKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    hasCron: !!Deno.env.get('CRON_SECRET'),
    hasResend: !!Deno.env.get('RESEND_API_KEY'),
  })

  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('Unauthorized — bad secret')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('Today:', today)

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, streak, classe, serie, last_activity_date')
      .eq('notif_email', true)
      .not('email', 'is', null)

    if (usersError) {
      console.error('DB error:', usersError)
      throw usersError
    }

    console.log('Users avec notif_email:', users?.length ?? 0)

    if (!users?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Aucun utilisateur' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const inactifs = users.filter((u) => {
      const lastActivity = u.last_activity_date?.split('T')[0]
      return lastActivity !== today
    })

    console.log('Users inactifs aujourd\'hui:', inactifs.length)

    if (!inactifs.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Tous les users sont actifs' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    const errors: string[] = []

    for (const user of inactifs) {
      try {
        const prenom = user.full_name?.split(' ')[0] ?? 'Élève'

        const { data: progressions } = await supabase
          .from('progressions')
          .select('matiere, score_moyen')
          .eq('user_id', user.id)
          .order('score_moyen', { ascending: true })
          .limit(1)

        const matiere = progressions?.[0]?.matiere ?? 'Mathématiques'
        const emailHtml = buildEmail(prenom, user.streak ?? 0, matiere, user.classe ?? '3eme')
        const resendApiKey = Deno.env.get('RESEND_API_KEY')

        if (resendApiKey) {
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

          const resText = await res.text()
          console.log(`Email ${user.email}:`, res.status, resText)
          if (res.ok) sent++
          else errors.push(`${user.email}: ${resText}`)
        } else {
          console.log(`[RAPPEL sans Resend] ${user.email} (${prenom}) — matière: ${matiere}`)
          sent++
        }
      } catch (err) {
        console.error('Error for user:', user.email, err)
        errors.push(`${user.email}: ${String(err)}`)
      }
    }

    console.log(`Résultat final: sent=${sent}/${inactifs.length}`)

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
