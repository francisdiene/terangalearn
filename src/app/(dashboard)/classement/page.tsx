import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Medal, Zap, Flame } from 'lucide-react'

export const revalidate = 60 // Cache 60 secondes

export default async function ClassementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classement } = await supabase
    .from('profiles')
    .select('id, full_name, xp, niveau, streak, classe')
    .order('xp', { ascending: false })
    .limit(50)

  const monRang = classement?.findIndex(p => p.id === user.id) ?? -1

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Classement 🏆</h1>
        <p className="text-gray-500 mt-1">Les meilleurs élèves de TerangaLearn</p>
      </div>

      {/* Mon rang */}
      {monRang >= 0 && (
        <div className="gradient-green rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">Mon classement</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-4xl font-bold">#{monRang + 1}</span>
              <p className="text-white/80 text-sm mt-1">
                {classement?.[monRang]?.xp ?? 0} XP total
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl">
                {monRang === 0 ? '🥇' : monRang === 1 ? '🥈' : monRang === 2 ? '🥉' : '🎯'}
              </div>
              <p className="text-white/70 text-xs mt-1">
                {monRang === 0 ? 'Tu es le meilleur !' : `${monRang} devant toi`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 */}
      {classement && classement.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { index: 1, emoji: '🥈', bg: 'bg-gray-100', size: 'h-20' },
            { index: 0, emoji: '🥇', bg: 'bg-gold/10', size: 'h-28' },
            { index: 2, emoji: '🥉', bg: 'bg-orange-50', size: 'h-16' },
          ].map(({ index, emoji, bg, size }) => {
            const p = classement[index]
            if (!p) return null
            return (
              <div
                key={p.id}
                className={`${bg} rounded-2xl p-3 flex flex-col items-center justify-end ${size} relative`}
              >
                <span className="text-2xl absolute -top-3">{emoji}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1
                  ${index === 0 ? 'bg-gold' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                  {p.full_name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-gray-900 text-center truncate w-full">
                  {p.full_name?.split(' ')[0]}
                </p>
                <p className="text-xs text-gray-500">{p.xp} XP</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste complète */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        {classement?.map((p, i) => {
          const isMe = p.id === user.id
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

          return (
            <div
              key={p.id}
              className={`flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0
                ${isMe ? 'bg-green-light' : 'hover:bg-gray-50'} transition`}
            >
              {/* Rang */}
              <div className="w-8 text-center flex-shrink-0">
                {medal
                  ? <span className="text-xl">{medal}</span>
                  : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0
                ${isMe ? 'bg-green' : 'bg-gray-300'}`}>
                {p.full_name?.charAt(0).toUpperCase()}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isMe ? 'text-green' : 'text-gray-900'}`}>
                  {p.full_name} {isMe && '(moi)'}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {p.classe} • Niv. {p.niveau}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {p.streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs">
                    <Flame className="w-3 h-3" />
                    {p.streak}
                  </div>
                )}
                <div className="flex items-center gap-1 text-green text-sm font-bold">
                  <Zap className="w-4 h-4" />
                  {p.xp}
                </div>
              </div>
            </div>
          )
        })}

        {(!classement || classement.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Pas encore de classement</p>
            <p className="text-sm mt-1">Commence à réviser pour apparaître ici !</p>
          </div>
        )}
      </div>
    </div>
  )
}