'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, User, Loader2, Sparkles, Plus, MessageSquare, Menu, Trash2, X } from 'lucide-react'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  contenu: string
  created_at: string
}

interface Conversation {
  id: string
  titre: string
  created_at: string
  updated_at: string
}

interface Props {
  userId: string
  profile: Profile | null
  conversationsInitiales: Conversation[]
}

const SUGGESTIONS = [
  "Explique-moi la conscience en philosophie",
  "C'est quoi l'immunologie ?",
  "Parle-moi de la décolonisation",
  "Explique la régulation de la glycémie",
]

export default function CoachChat({ userId, profile, conversationsInitiales }: Props) {
  const supabase = createClient()
  const prenom = profile?.full_name?.split(' ')[0] ?? 'Élève'

  const [conversations, setConversations] = useState<Conversation[]>(conversationsInitiales)
  const [convActive, setConvActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const chargerConversation = async (convId: string) => {
    setConvActive(convId)
    setSidebarOpen(false)
    const { data } = await supabase
      .from('messages_coach')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  const nouvelleConversation = () => {
    setConvActive(null)
    setMessages([])
    setInput('')
    setSidebarOpen(false)
  }

  const supprimerConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('coach_conversations').delete().eq('id', convId)
    setConversations(c => c.filter(x => x.id !== convId))
    if (convActive === convId) {
      nouvelleConversation()
    }
  }

  const sendMessage = async (texte: string) => {
    if (!texte.trim() || loading) return

    let currentConvId = convActive

    if (!currentConvId) {
      const titre = texte.slice(0, 40) + (texte.length > 40 ? '...' : '')
      const { data: newConv } = await supabase
        .from('coach_conversations')
        .insert({ user_id: userId, titre })
        .select()
        .single()

      if (newConv) {
        currentConvId = newConv.id
        setConvActive(newConv.id)
        setConversations(c => [newConv, ...c])
      }
    }

    const userMsg: Message = {
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
      conversation_id: currentConvId,
      role: 'user',
      contenu: texte,
    })

    try {
      const contexte = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.contenu
      }))

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texte, contexte, userId })
      })

      const data = await response.json()

      // Quota dépassé → afficher message inline au lieu d'un faux assistant
      if (response.status === 429 || data.error === 'quota_exceeded') {
        const quotaMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          contenu: `⚠️ **Limite atteinte** — ${data.message ?? 'Tu as atteint ta limite de messages Coach IA aujourd\'hui.'}\n\n[Passer à Premium →](/premium)`,
          created_at: new Date().toISOString(),
        }
        setMessages(m => [...m, quotaMsg])
        setLoading(false)
        return
      }

      const reponse = data.reponse ?? "Désolé, je n'ai pas pu répondre."

      const msgId = crypto.randomUUID()
      const assistantMsg: Message = {
        id: msgId,
        role: 'assistant',
        contenu: '',
        created_at: new Date().toISOString(),
      }

      setMessages(m => [...m, assistantMsg])
      setLoading(false)

      const mots = reponse.split(' ')
      let texteActuel = ''
      for (let i = 0; i < mots.length; i++) {
        texteActuel += (i === 0 ? '' : ' ') + mots[i]
        setMessages(m => m.map(msg =>
          msg.id === msgId ? { ...msg, contenu: texteActuel } : msg
        ))
        await new Promise(resolve => setTimeout(resolve, 40))
      }

      await supabase.from('messages_coach').insert({
        user_id: userId,
        conversation_id: currentConvId,
        role: 'assistant',
        contenu: reponse,
      })

      await supabase
        .from('coach_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConvId)

    } catch (err) {
      console.error('Erreur coach:', err)
      setMessages(m => [...m, {
        id: crypto.randomUUID(),
        role: 'assistant',
        contenu: "Désolé, une erreur s'est produite. Réessaie dans quelques secondes.",
        created_at: new Date().toISOString(),
      }])
      setLoading(false)
    }
  }

  const renderContenu = (texte: string) => {
    const parts = texte.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="relative flex-1 flex bg-white rounded-2xl card-shadow overflow-hidden min-h-0 h-full">

      {/* ===== SIDEBAR CONVERSATIONS ===== */}
      <div className={cn(
        'absolute inset-y-0 left-0 z-30 w-72 bg-gray-50 border-r border-gray-100 flex flex-col transition-transform shadow-xl',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header sidebar avec bouton fermer */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <span className="text-sm font-bold text-gray-700">Historique</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 flex-shrink-0">
          <button
            onClick={nouvelleConversation}
            className="w-full flex items-center gap-2 bg-green text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 px-4">
              Aucune conversation. Pose ta première question !
            </p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => chargerConversation(conv.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition group',
                  convActive === conv.id ? 'bg-green-light' : 'hover:bg-gray-100'
                )}
              >
                <MessageSquare className={cn(
                  'w-4 h-4 flex-shrink-0',
                  convActive === conv.id ? 'text-green' : 'text-gray-400'
                )} />
                <span className={cn(
                  'flex-1 text-sm truncate',
                  convActive === conv.id ? 'text-green font-medium' : 'text-gray-600'
                )}>
                  {conv.titre}
                </span>
                <span
                  onClick={(e) => supprimerConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== ZONE CHAT ===== */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header (fixe en haut) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-green transition text-sm font-medium"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline">Historique</span>
            </button>
            <div className="w-10 h-10 bg-green rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Coach TerangaLearn</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">En ligne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages (zone scrollable qui prend tout l'espace) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 max-w-sm">
                  <p className="text-sm text-gray-700">
                    Salut <strong>{prenom}</strong> ! Pose-moi une question sur tes cours.
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

          {messages.map((msg) => (
            <div key={msg.id} className={cn(
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
                'rounded-2xl p-4 max-w-xs md:max-w-lg text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-green text-white rounded-tr-none'
                  : 'bg-gray-50 text-gray-700 rounded-tl-none'
              )}>
                {renderContenu(msg.contenu)}
              </div>
            </div>
          ))}

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

        {/* Input (fixe en bas) */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Pose ta question..."
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
      </div>
    </div>
  )
}