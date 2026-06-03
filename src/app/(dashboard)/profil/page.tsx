import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Zap, Flame, BookOpen, Trophy, Star } from 'lucide-react'
import ProfilStats from '@/components/profil/ProfilStats'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)

  const { data: resultats } = await supabase
    .from('resultats_exercices')
    .select('est_correct, points_gagnes')
    .eq('user_id', user.id)

  const { data: progressions } = await supabase
    .from('progression_cours')
    .select('termine')
    .eq('user_id', user.id)
    .eq('termine', true)

  const totalExos = resultats?.length ?? 0
  const exosReussis = resultats?.filter(r => r.est_correct).length ?? 0
  const coursTermines = progressions?.length ?? 0
  const taux = totalExos > 0 ? Math.round(exosReussis / totalExos * 100) : 0

  const xp = profile?.xp ?? 0
  const niveau = profile?.niveau ?? 1
  const xpPourProchain = niveau * 200
  const xpDansNiveau = xp % xpPourProchain
  const pct = Math.min(Math.round(xpDansNiveau / xpPourProchain * 100), 100)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil 👤</h1>
      </div>

      {/* Carte profil */}
      <div className="gradient-green rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name}</h2>
            <p className="text-white/70 text-sm capitalize">
              {profile?.classe === '3eme' ? '3ème — BFEM' : `Terminale ${profile?.serie ?? ''} — BAC`}
            </p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/80">Niveau {niveau}</span>
          <span className="text-white/80">{xpDansNiveau} / {xpPourProchain} XP</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-white/60 text-xs mt-1">
          {xpPourProchain - xpDansNiveau} XP pour le niveau {niveau + 1}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'XP Total', value: xp, icon: Zap, color: 'text-green', bg: 'bg-green-light' },
          { label: 'Streak', value: `${profile?.streak ?? 0} jours`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Cours terminés', value: coursTermines, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Taux de réussite', value: `${taux}%`, icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4`}>
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-gray-900">Mes badges</h3>
          <span className="text-sm text-gray-400 ml-auto">{badges?.length ?? 0} obtenus</span>
        </div>

        {badges && badges.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((ub: any) => (
              <div
                key={ub.badge_id}
                className="bg-gold/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center"
              >
                <span className="text-3xl">{ub.badges?.icone}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">
                  {ub.badges?.nom}
                </span>
                <span className="text-xs text-gray-400">{ub.badges?.description}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Pas encore de badges</p>
            <p className="text-xs mt-1">Fais des exercices pour en gagner !</p>
          </div>
        )}
      </div>

      {/* Infos compte */}
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="font-bold text-gray-900 mb-4">Informations du compte</h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: profile?.email },
            { label: 'Classe', value: profile?.classe === '3eme' ? '3ème (BFEM)' : 'Terminale (BAC)' },
            { label: 'Série', value: profile?.serie ?? 'Non renseignée' },
            { label: 'Membre depuis', value: new Date(profile?.created_at ?? '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}