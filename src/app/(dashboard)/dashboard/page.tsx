import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Flame, BookOpen, Target, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60 // Cache 60 secondes

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: matieres } = await supabase
    .from('matieres')
    .select('*')
    .or(`classe.eq.both,classe.eq.${profile?.classe}`)
    .limit(6)

  const { data: progressions } = await supabase
    .from('progression_cours')
    .select('*, cours(titre, chapitre_id)')
    .eq('user_id', user.id)
    .eq('termine', true)
    .limit(3)

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', user.id)
    .limit(4)

  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'
  const xp = profile?.xp ?? 0
  const niveau = profile?.niveau ?? 1
  const streak = profile?.streak ?? 0
  const coursTermines = progressions?.length ?? 0

  return (
  <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

    {/* Salutation */}
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
        Bonjour, {prenom} 
      </h1>
      <p className="text-gray-500 mt-0.5 text-sm">
        {streak > 0
          ? `🔥 ${streak} jour(s) de streak — continue !`
          : "Commence à réviser pour maintenir ton streak !"}
      </p>
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'XP Total', value: xp, icon: Zap, color: 'bg-green' },
        { label: 'Niveau', value: niveau, icon: TrendingUp, color: 'bg-blue-500' },
        { label: 'Streak', value: `${streak}j`, icon: Flame, color: 'bg-orange-500' },
        { label: 'Cours faits', value: coursTermines, icon: BookOpen, color: 'bg-purple-500' },
      ].map((stat, i) => (
        <div key={i} className={`${stat.color} rounded-2xl p-3 md:p-4 text-white hover-lift`}>
          <stat.icon className="w-4 h-4 mb-1.5 opacity-80" />
          <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
          <div className="text-xs opacity-80 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>

    {/* Objectif du jour */}
    <div className="bg-white rounded-2xl p-4 md:p-5 card-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-green" />
        <h2 className="font-bold text-gray-900 text-sm md:text-base">Objectif du jour</h2>
      </div>
      <div className="space-y-2.5">
        {[
          { label: 'Faire 10 exercices', done: false, xp: 50 },
          { label: 'Lire 1 cours', done: coursTermines > 0, xp: 30 },
          { label: 'Consulter le Coach IA', done: false, xp: 20 },
        ].map((obj, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${obj.done ? 'bg-green border-green' : 'border-gray-300'}`}>
                {obj.done && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-xs md:text-sm ${obj.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {obj.label}
              </span>
            </div>
            <span className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              +{obj.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Matières */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-sm md:text-base">Mes matières</h2>
        <Link href="/cours" className="text-xs md:text-sm text-green font-medium">Voir tout →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {matieres?.map(matiere => (
          <Link
            key={matiere.id}
            href={`/cours/${matiere.code.toLowerCase()}`}
            className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 card-shadow active:scale-95 transition-transform"
          >
            <div
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-xl mb-2"
              style={{ backgroundColor: matiere.couleur + '20' }}
            >
              {matiere.icone}
            </div>
            <h3 className="font-semibold text-xs md:text-sm text-gray-900 leading-tight line-clamp-2">
              {matiere.nom}
            </h3>
          </Link>
        ))}
      </div>
    </div>

    {/* Badges */}
    {badges && badges.length > 0 && (
      <div className="bg-white rounded-2xl p-4 md:p-5 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-gold" />
          <h2 className="font-bold text-gray-900 text-sm md:text-base">Mes badges</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {badges.map((ub: any) => (
            <div key={ub.badge_id} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/10 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                {ub.badges?.icone}
              </div>
              <span className="text-xs text-gray-500 text-center max-w-14 leading-tight">
                {ub.badges?.nom}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* CTA */}
    <div className="gradient-green rounded-2xl p-4 md:p-6 text-white">
      <h3 className="font-bold text-base md:text-lg mb-1">Prêt à réviser ? </h3>
      <p className="text-white/80 text-xs md:text-sm mb-3 md:mb-4">
        Ton coach IA est disponible maintenant.
      </p>
      <Link
        href="/coach"
        className="inline-block bg-white text-green font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm hover:opacity-90 transition"
      >
        Parler au Coach IA
      </Link>
    </div>
  </div>
)
}