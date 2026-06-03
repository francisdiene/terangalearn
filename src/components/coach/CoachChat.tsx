'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { Profile, MessageCoach } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  profile: Profile | null
  historique: MessageCoach[]
}

const SUGGESTIONS = [
  "Explique-moi la conscience en philosophie",
  "C'est quoi l'immunologie ?",
  "Parle-moi de la décolonisation",
  "Explique la régulation de la glycémie",
  "C'est quoi le système nerveux ?",
  "Parle-moi de la guerre froide",
]

export default function CoachChat({ userId, profile, historique }: Props) {
  const [messages, setMessages] = useState<MessageCoach[]>(historique)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const clearMessages = async () => {
    await supabase
      .from('messages_coach')
      .delete()
      .eq('user_id', userId)
    setMessages([])
    setShowClear(false)
  }

  const sendMessage = async (texte: string) => {
    if (!texte.trim() || loading) return

    const userMsg: MessageCoach = {
      id: crypto.randomUUID(),
      role: 'user',
      contenu: texte,
      created_at: new Date().toISOString(),
    }

    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    await supabase.from('messages_coach').insert({
      user_id: userId,
      role: 'user',
      contenu: texte,
    })

    try {
      const contexte = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.contenu
      }))

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: texte,
          contexte,
          userId
        })
      })

      const data = await response.json()
      const reponse = data.reponse ?? "Désolé, je n'ai pas pu répondre."

      const assistantMsg: MessageCoach = {
        id: crypto.randomUUID(),
        role: 'assistant',
        contenu: reponse,
        created_at: new Date().toISOString(),
      }

      setMessages(m => [...m, assistantMsg])

      await supabase.from('messages_coach').insert({
        user_id: userId,
        role: 'assistant',
        contenu: reponse,
      })

    } catch (err) {
      console.error('Erreur coach:', err)
      const errMsg: MessageCoach = {
        id: crypto.randomUUID(),
        role: 'assistant',
        contenu: "Désolé, une erreur s'est produite. Réessaie dans quelques secondes.",
        created_at: new Date().toISOString(),
      }
      setMessages(m => [...m, errMsg])
    }

    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl card-shadow overflow-hidden min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Coach TerangaLearn</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Connecté au programme officiel</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setShowClear(true)}
            className="text-xs text-gray-400 hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 max-w-sm">
                <p className="text-sm text-gray-700">
                  Salut <strong>{prenom}</strong> ! 👋 Je suis ton Coach TerangaLearn.
                  Je suis connecté au programme officiel sénégalais — pose-moi n'importe quelle question sur tes cours !
                </p>
              </div>
            </div>
            <div className="pl-11">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-green-light text-green px-3 py-1.5 rounded-full hover:bg-green hover:text-white transition font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Historique des messages */}
        {messages.map((msg, idx) => {
          const isFirst = idx === 0
          const prevMsg = messages[idx - 1]
          const showDate = isFirst || (
            prevMsg &&
            new Date(msg.created_at).toDateString() !==
            new Date(prevMsg.created_at).toDateString()
          )

          return (
            <div key={msg.id}>
              {/* Séparateur de date */}
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long'
                    })}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              <div className={cn(
                'flex items-start gap-3',
                msg.role === 'user' && 'flex-row-reverse'
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                  msg.role === 'user' ? 'bg-blue-500' : 'bg-green'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-white" />
                  }
                </div>
                <div className={cn(
                  'rounded-2xl p-4 max-w-xs md:max-w-md text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-green text-white rounded-tr-none'
                    : 'bg-gray-50 text-gray-700 rounded-tl-none'
                )}>
                  {msg.contenu}
                </div>
              </div>
            </div>
          )
        })}

        {/* Loading */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Pose ta question sur le programme..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green transition text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-green rounded-xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Send className="w-5 h-5 text-white" />
            }
          </button>
        </div>
      </div>

      {/* Modal confirmation effacer */}
      {showClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full card-shadow">
            <h3 className="font-bold text-gray-900 mb-2">Effacer la conversation ?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tout l'historique sera supprimé définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClear(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={clearMessages}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}