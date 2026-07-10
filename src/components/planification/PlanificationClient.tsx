'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, X, Check, Clock, BookOpen, AlertCircle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'

interface PlanItem {
  id: string
  titre: string
  matiere: string | null
  date: string
  heure_debut: string | null
  heure_fin: string | null
  termine: boolean
  type: 'revision' | 'examen' | 'devoir' | 'rappel'
}

interface Props {
  userId: string
  profile: Profile | null
  planningInitial: PlanItem[]
}

const MATIERES = ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO', 'ECO']
const MATIERE_LABELS: Record<string, string> = {
  MATH: ' Maths', PC: ' Physique-Chimie', SVT: ' SVT',
  FR: ' Français', HG: ' Histoire-Géo', EN: '🇬🇧 Anglais',
  PHILO: ' Philo', ECO: ' Économie'
}

const TYPE_CONFIG = {
  revision: { label: 'Révision', color: 'bg-green-light text-green', icon: BookOpen },
  examen: { label: 'Examen', color: 'bg-red-50 text-red-500', icon: AlertCircle },
  devoir: { label: 'Devoir', color: 'bg-orange-50 text-orange-500', icon: Clock },
  rappel: { label: 'Rappel', color: 'bg-blue-50 text-blue-500', icon: Bell },
}

// Calendrier scolaire sénégalais 2024-2025
const EVENEMENTS_SCOLAIRES = [
  { date: '2025-04-01', titre: 'Début 3ème trimestre', type: 'rappel' },
  { date: '2025-05-01', titre: 'Fête du Travail — Congé', type: 'rappel' },
  { date: '2025-06-10', titre: 'BFEM — Début des épreuves', type: 'examen' },
  { date: '2025-06-17', titre: 'BAC — Début des épreuves', type: 'examen' },
  { date: '2025-07-04', titre: 'Résultats BFEM', type: 'rappel' },
  { date: '2025-07-15', titre: 'Résultats BAC', type: 'rappel' },
]

function groupByDate(items: PlanItem[]) {
  const grouped: Record<string, PlanItem[]> = {}
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = []
    grouped[item.date].push(item)
  })
  return grouped
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.getTime() === today.getTime()) return "Aujourd'hui"
  if (date.getTime() === tomorrow.getTime()) return 'Demain'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function PlanificationClient({ userId, profile, planningInitial }: Props) {
  const [planning, setPlanning] = useState<PlanItem[]>(planningInitial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    titre: '',
    matiere: '',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '08:00',
    heure_fin: '09:00',
    type: 'revision' as PlanItem['type'],
  })

  const supabase = createClient()

  const handleCreate = async () => {
    if (!form.titre.trim() || !form.date) return
    setLoading(true)

    const { data, error } = await supabase
      .from('planning')
      .insert({
        user_id: userId,
        titre: form.titre,
        matiere: form.matiere || null,
        date: form.date,
        heure_debut: form.heure_debut || null,
        heure_fin: form.heure_fin || null,
        type: form.type,
        termine: false,
      })
      .select()
      .single()

    if (!error && data) {
      setPlanning(p => [...p, data].sort((a, b) => a.date.localeCompare(b.date)))
      setForm({
        titre: '',
        matiere: '',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '08:00',
        heure_fin: '09:00',
        type: 'revision',
      })
      setShowForm(false)
    }
    setLoading(false)
  }

  const handleToggle = async (id: string, termine: boolean) => {
    await supabase
      .from('planning')
      .update({ termine: !termine })
      .eq('id', id)

    setPlanning(p => p.map(item =>
      item.id === id ? { ...item, termine: !termine } : item
    ))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('planning').delete().eq('id', id)
    setPlanning(p => p.filter(item => item.id !== id))
  }

  // Générer plan automatique
  const handleGenererPlan = async () => {
    setLoading(true)
    const today = new Date()
    const suggestions = [
      { titre: 'Révision Mathématiques — Équations', matiere: 'MATH', type: 'revision' as const, offset: 0, debut: '17:00', fin: '18:30' },
      { titre: 'Révision SVT — La cellule', matiere: 'SVT', type: 'revision' as const, offset: 1, debut: '16:00', fin: '17:30' },
      { titre: 'Révision Français — Dissertation', matiere: 'FR', type: 'revision' as const, offset: 2, debut: '17:00', fin: '18:00' },
      { titre: 'Exercices Maths', matiere: 'MATH', type: 'devoir' as const, offset: 3, debut: '15:00', fin: '16:30' },
      { titre: 'Révision Physique-Chimie', matiere: 'PC', type: 'revision' as const, offset: 4, debut: '17:00', fin: '18:30' },
      { titre: 'Révision Histoire-Géo', matiere: 'HG', type: 'revision' as const, offset: 5, debut: '16:00', fin: '17:00' },
      { titre: 'Examen blanc — Toutes matières', matiere: null, type: 'examen' as const, offset: 6, debut: '08:00', fin: '12:00' },
    ]

    for (const s of suggestions) {
      const date = new Date(today)
      date.setDate(date.getDate() + s.offset)
      const dateStr = date.toISOString().split('T')[0]

      const existe = planning.some(p => p.date === dateStr && p.titre === s.titre)
      if (!existe) {
        const { data } = await supabase
          .from('planning')
          .insert({
            user_id: userId,
            titre: s.titre,
            matiere: s.matiere,
            date: dateStr,
            heure_debut: s.debut,
            heure_fin: s.fin,
            type: s.type,
            termine: false,
          })
          .select()
          .single()

        if (data) setPlanning(p => [...p, data])
      }
    }

    setLoading(false)
  }

  const grouped = groupByDate(planning)
  const totalTaches = planning.length
  const tachesTerminees = planning.filter(p => p.termine).length
  const pct = totalTaches > 0 ? Math.round(tachesTerminees / totalTaches * 100) : 0

  // Prochain événement scolaire
  const today = new Date().toISOString().split('T')[0]
  const prochainEvenement = EVENEMENTS_SCOLAIRES.find(e => e.date >= today)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planification </h1>
        <p className="text-gray-500 mt-1">Organise tes révisions intelligemment</p>
      </div>

      {/* Prochain événement scolaire */}
      {prochainEvenement && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{prochainEvenement.titre}</p>
            <p className="text-xs text-red-500">
              {new Date(prochainEvenement.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}

      {/* Progression globale */}
      {totalTaches > 0 && (
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">Progression cette semaine</span>
            <span className="text-green font-bold">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-green h-3 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {tachesTerminees} / {totalTaches} tâches terminées
          </p>
        </div>
      )}

      {/* Boutons actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter une tâche
        </button>
        <button
          onClick={handleGenererPlan}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-green text-green rounded-xl font-semibold hover:bg-green-light transition disabled:opacity-50"
        >
          <Calendar className="w-5 h-5" />
          Plan automatique
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 card-shadow border-2 border-green">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Nouvelle tâche</h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Titre de la tâche..."
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as PlanItem['type'] }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
              >
                <option value="revision"> Révision</option>
                <option value="examen"> Examen</option>
                <option value="devoir"> Devoir</option>
                <option value="rappel"> Rappel</option>
              </select>

              <select
                value={form.matiere}
                onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
              >
                <option value="">Matière...</option>
                {MATIERES.map(m => (
                  <option key={m} value={m}>{MATIERE_LABELS[m]}</option>
                ))}
              </select>
            </div>

            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Début</label>
                <input
                  type="time"
                  value={form.heure_debut}
                  onChange={e => setForm(f => ({ ...f, heure_debut: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fin</label>
                <input
                  type="time"
                  value={form.heure_fin}
                  onChange={e => setForm(f => ({ ...f, heure_fin: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !form.titre.trim()}
              className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Planning groupé par date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-14 h-14 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Aucune tâche planifiée</p>
          <p className="text-sm mt-1">
            Ajoute une tâche ou génère un plan automatique !
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 capitalize">
                {formatDate(date)}
              </h3>
              <div className="space-y-2">
                {items.map(item => {
                  const typeConf = TYPE_CONFIG[item.type]
                  const Icon = typeConf.icon
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'bg-white rounded-2xl p-4 card-shadow flex items-center gap-4 transition',
                        item.termine && 'opacity-60'
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggle(item.id, item.termine)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition',
                          item.termine
                            ? 'bg-green border-green'
                            : 'border-gray-300 hover:border-green'
                        )}
                      >
                        {item.termine && <Check className="w-3 h-3 text-white" />}
                      </button>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-semibold text-sm text-gray-900',
                          item.termine && 'line-through text-gray-400'
                        )}>
                          {item.titre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.heure_debut && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.heure_debut.slice(0, 5)}
                              {item.heure_fin && ` — ${item.heure_fin.slice(0, 5)}`}
                            </span>
                          )}
                          {item.matiere && (
                            <span className="text-xs text-gray-400">
                              {MATIERE_LABELS[item.matiere]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type badge */}
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0',
                        typeConf.color
                      )}>
                        <Icon className="w-3 h-3" />
                        {typeConf.label}
                      </span>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}