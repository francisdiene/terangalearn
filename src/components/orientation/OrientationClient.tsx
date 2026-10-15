'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, TrendingDown, Plus, X, Star,
  BookOpen, GraduationCap, Building, Target,
  ChevronRight, Trash2, Lock, Info, ScanLine
} from 'lucide-react'
import BulletinAnalyse from './BulletinAnalyse'
import { cn } from '@/lib/utils'
import { Profile } from '@/types'
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, LineChart,
  Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

interface Note {
  id: string
  matiere: string
  type_eval: 'devoir' | 'composition' | 'test'
  note: number
  coefficient: number
  semestre: 'S1' | 'S2'
  prise_en_compte: boolean
  date: string
  commentaire: string | null
}

interface Ecole {
  id: string
  nom: string
  description: string
  localisation: string
  filieres: string[]
  niveau_requis: string
  frais_min: number
  frais_max: number
  contact: string
  site_web: string
  domaines: string[]
}

interface Props {
  userId: string
  profile: Profile | null
  notesInitiales: Note[]
  ecoles: Ecole[]
}

// Matières par série
const MATIERES_PAR_SERIE: Record<string, string[]> = {
  'S1': ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO'],
  'S2': ['MATH', 'PC', 'SVT', 'FR', 'HG', 'EN', 'PHILO'],
  'L': ['FR', 'PHILO', 'HG', 'EN', 'MATH', 'PC'],
  'G': ['MATH', 'ECO', 'FR', 'HG', 'EN', 'PHILO'],
  'STEG': ['MATH', 'ECO', 'FR', 'HG', 'EN', 'PHILO'],
}

const MATIERE_LABELS: Record<string, string> = {
  MATH: 'Mathématiques', PC: 'Physique-Chimie', SVT: 'SVT',
  FR: 'Français', HG: 'Histoire-Géo', EN: 'Anglais',
  PHILO: 'Philosophie', ECO: 'Économie'
}

const MATIERE_ICONES: Record<string, string> = {
  MATH: '', PC: '⚗️', SVT: '', FR: '',
  HG: '', EN: '🇬🇧', PHILO: '', ECO: ''
}

// Coefficients par matière et série
const COEFFICIENTS: Record<string, Record<string, number>> = {
  S1: { MATH: 5, PC: 4, SVT: 4, FR: 2, HG: 2, EN: 2, PHILO: 2 },
  S2: { MATH: 5, PC: 4, SVT: 4, FR: 2, HG: 2, EN: 2, PHILO: 2 },
  L: { FR: 4, PHILO: 3, HG: 3, EN: 3, MATH: 2, PC: 1 },
  G: { MATH: 4, ECO: 4, FR: 3, HG: 2, EN: 2, PHILO: 2 },
  STEG: { MATH: 4, ECO: 4, FR: 3, HG: 2, EN: 2, PHILO: 2 },
}

const ORIENTATION_RULES = [
  {
    domaine: 'Sciences & Ingénierie', emoji: '',
    matieres: ['MATH', 'PC', 'SVT'], seuil: 13,
    filieres: ['Génie Logiciel', 'Médecine', 'Pharmacie', 'Ingénierie', 'Intelligence Artificielle'],
    description: 'Tu as un profil scientifique solide. Les filières scientifiques et techniques sont faites pour toi.'
  },
  {
    domaine: 'Informatique & Technologie', emoji: '',
    matieres: ['MATH', 'PC'], seuil: 12,
    filieres: ['Génie Logiciel', 'Réseaux & Systèmes', 'Cybersécurité', 'Data Science'],
    description: 'Tes bases en maths et sciences exactes te prédisposent aux métiers du numérique.'
  },
  {
    domaine: 'Économie & Gestion', emoji: '📊',
    matieres: ['MATH', 'ECO', 'FR'], seuil: 12,
    filieres: ['Management', 'Finance', 'Comptabilité', 'Commerce', 'Marketing'],
    description: 'Tu as le profil pour les métiers de la gestion, du commerce et de la finance.'
  },
  {
    domaine: 'Droit & Sciences Sociales', emoji: '',
    matieres: ['FR', 'HG', 'PHILO'], seuil: 12,
    filieres: ['Droit', 'Sciences Politiques', 'Sociologie', 'Communication'],
    description: "Tes compétences en expression et analyse sociale t'ouvrent les portes du droit."
  },
  {
    domaine: 'Lettres & Communication', emoji: '',
    matieres: ['FR', 'EN', 'PHILO'], seuil: 12,
    filieres: ['Lettres Modernes', 'Traduction', 'Communication', 'Journalisme'],
    description: "Tu excelles dans les matières littéraires."
  },
  {
    domaine: 'Santé & Sciences du Vivant', emoji: '',
    matieres: ['SVT', 'PC', 'MATH'], seuil: 14,
    filieres: ['Médecine', 'Pharmacie', 'Infirmerie', 'Nutrition', 'Biologie'],
    description: "Tes excellents résultats en sciences du vivant t'ouvrent les portes des métiers de la santé."
  },
]

// Calculer la moyenne d'une matière pour un semestre
// Règle : 2 meilleurs devoirs (sur 2 ou 3) + 1 composition
function calculerMoyenneMatiere(notes: Note[], matiere: string, semestre: 'S1' | 'S2', serie: string): number {
  const notesSemestre = notes.filter(n => n.matiere === matiere && n.semestre === semestre)
  
  const devoirs = notesSemestre
    .filter(n => n.type_eval === 'devoir')
    .sort((a, b) => b.note - a.note) // Trier par note décroissante
    .slice(0, 2) // Prendre les 2 meilleurs

  const compositions = notesSemestre.filter(n => n.type_eval === 'composition')
  const composition = compositions[0]

  if (devoirs.length === 0 && !composition) return 0

  // Calcul : (somme des 2 meilleurs devoirs / 2 + composition) / 2
  let total = 0
  let count = 0

  if (devoirs.length > 0) {
    const moyDevoirs = devoirs.reduce((acc, n) => acc + n.note, 0) / devoirs.length
    total += moyDevoirs
    count++
  }

  if (composition) {
    total += composition.note
    count++
  }

  return count > 0 ? Math.round((total / count) * 100) / 100 : 0
}

// Calculer la moyenne générale pondérée
function calculerMoyenneGenerale(notes: Note[], semestre: 'S1' | 'S2', serie: string): number {
  const matieres = MATIERES_PAR_SERIE[serie] ?? MATIERES_PAR_SERIE['S1']
  const coeffs = COEFFICIENTS[serie] ?? COEFFICIENTS['S1']

  let totalPoints = 0
  let totalCoeffs = 0

  for (const matiere of matieres) {
    const moy = calculerMoyenneMatiere(notes, matiere, semestre, serie)
    if (moy > 0) {
      const coeff = coeffs[matiere] ?? 1
      totalPoints += moy * coeff
      totalCoeffs += coeff
    }
  }

  return totalCoeffs > 0 ? Math.round((totalPoints / totalCoeffs) * 100) / 100 : 0
}

function getNiveau(moyenne: number) {
  if (moyenne >= 16) return { label: 'Excellent', color: 'text-green', bg: 'bg-green-light' }
  if (moyenne >= 14) return { label: 'Très bien', color: 'text-blue-500', bg: 'bg-blue-50' }
  if (moyenne >= 12) return { label: 'Bien', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  if (moyenne >= 10) return { label: 'Passable', color: 'text-orange-500', bg: 'bg-orange-50' }
  return { label: 'Insuffisant', color: 'text-red-500', bg: 'bg-red-50' }
}

// Vérifier si le S2 est complet (toutes les compositions saisies)
function isS2Complet(notes: Note[], serie: string): boolean {
  const matieres = MATIERES_PAR_SERIE[serie] ?? MATIERES_PAR_SERIE['S1']
  return matieres.every(m =>
    notes.some(n => n.matiere === m && n.semestre === 'S2' && n.type_eval === 'composition')
  )
}

const ONGLETS = [
  { key: 'notes', label: 'Mes Notes', icon: BookOpen },
  { key: 'bulletin', label: 'Bulletin IA', icon: ScanLine },
  { key: 'analyse', label: 'Analyse', icon: TrendingUp },
  { key: 'orientation', label: 'Orientation', icon: Target },
  { key: 'ecoles', label: 'Écoles', icon: Building },
]

export default function OrientationClient({ userId, profile, notesInitiales, ecoles: ecolesInitiales }: Props) {
  const [onglet, setOnglet] = useState<'notes' | 'bulletin' | 'analyse' | 'orientation' | 'ecoles'>('notes')
  const [notes, setNotes] = useState<Note[]>(notesInitiales)
  const [ecoles, setEcoles] = useState<Ecole[]>(ecolesInitiales)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filtreEcole, setFiltreEcole] = useState('')
  const [semestre, setSemestre] = useState<'S1' | 'S2'>('S1')
  const [form, setForm] = useState({
    matiere: 'MATH',
    type_eval: 'devoir' as Note['type_eval'],
    note: '',
    semestre: 'S1' as 'S1' | 'S2',
    date: new Date().toISOString().split('T')[0],
    commentaire: '',
  })

  const supabase = createClient()
  const serie = profile?.serie ?? 'S1'

  // Recharger les écoles côté client si le serveur n'en a pas retourné
  useEffect(() => {
    if (ecoles.length === 0) {
      supabase.from('ecoles').select('*').order('nom').then(({ data }) => {
        if (data && data.length > 0) setEcoles(data)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const matieresDeSerie = MATIERES_PAR_SERIE[serie] ?? MATIERES_PAR_SERIE['S1']
  const coefficients = COEFFICIENTS[serie] ?? COEFFICIENTS['S1']

  // Vérifier si la classe est Terminale
  if (profile?.classe !== 'terminale') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-orange-50 rounded-2xl p-8 text-center">
          <Lock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Module réservé aux Terminales</h2>
          <p className="text-gray-500 text-sm">
            Le module Analyse & Orientation est disponible uniquement pour les élèves de Terminale.
          </p>
        </div>
      </div>
    )
  }

  const handleAddNote = async () => {
  if (!form.note || isNaN(Number(form.note))) return
  setLoading(true)

  // Vérifier le nombre de devoirs déjà saisis
  // pour cette matière ET ce semestre spécifique
  const devoirsExistants = notes.filter(n =>
    n.matiere === form.matiere &&
    n.semestre === form.semestre && // ← utilise form.semestre pas semestre
    n.type_eval === 'devoir'
  )

  if (form.type_eval === 'devoir' && devoirsExistants.length >= 3) {
    alert(`Maximum 3 devoirs par matière pour le ${form.semestre}.`)
    setLoading(false)
    return
  }

  // Vérifier composition unique par matière ET semestre
  const compositionExistante = notes.find(n =>
    n.matiere === form.matiere &&
    n.semestre === form.semestre && // ← utilise form.semestre
    n.type_eval === 'composition'
  )

  if (form.type_eval === 'composition' && compositionExistante) {
    alert(`Une seule composition par matière pour le ${form.semestre}.`)
    setLoading(false)
    return
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      matiere: form.matiere,
      type_eval: form.type_eval,
      note: Number(form.note),
      coefficient: coefficients[form.matiere] ?? 1,
      semestre: form.semestre,
      date: form.date,
      commentaire: form.commentaire || null,
      prise_en_compte: true,
    })
    .select()
    .single()

  if (!error && data) {
    setNotes(n => [data, ...n])
    setForm(f => ({ ...f, note: '', commentaire: '' }))
    setShowForm(false)
  }
  setLoading(false)
}

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(n => n.filter(note => note.id !== id))
  }

  // Calculs par semestre
  const moyenneGenerale = calculerMoyenneGenerale(notes, semestre, serie)
  const moyennesParMatiere = matieresDeSerie.map(m => ({
    matiere: m,
    label: MATIERE_LABELS[m],
    icone: MATIERE_ICONES[m],
    moyenne: calculerMoyenneMatiere(notes, m, semestre, serie),
    nbDevoirs: notes.filter(n => n.matiere === m && n.semestre === semestre && n.type_eval === 'devoir').length,
    hasCompo: notes.some(n => n.matiere === m && n.semestre === semestre && n.type_eval === 'composition'),
  })).filter(m => m.moyenne > 0)

  const pointsForts = moyennesParMatiere.filter(m => m.moyenne >= 12).sort((a, b) => b.moyenne - a.moyenne)
  const pointsFaibles = moyennesParMatiere.filter(m => m.moyenne < 12).sort((a, b) => a.moyenne - b.moyenne)

  const radarData = moyennesParMatiere.map(m => ({
    matiere: m.icone + ' ' + m.label.split(' ')[0],
    moyenne: m.moyenne,
    fullMark: 20,
  }))

  const s2Complet = isS2Complet(notes, serie)

  const orientationsRecommandees = useMemo(() => {
    if (!s2Complet) return []
    return ORIENTATION_RULES
      .map(rule => {
        const moyennesRelevantes = rule.matieres
          .map(m => calculerMoyenneMatiere(notes, m, 'S2', serie))
          .filter(m => m > 0)
        if (moyennesRelevantes.length === 0) return null
        const scoreMoyen = moyennesRelevantes.reduce((a, b) => a + b, 0) / moyennesRelevantes.length
        return { ...rule, score: scoreMoyen }
      })
      .filter(r => r !== null && r!.score >= r!.seuil)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  }, [notes, s2Complet, serie])

  const ecolesRecommandees = useMemo(() => {
    if (orientationsRecommandees.length === 0) return ecoles
    const domainesRecommandes = orientationsRecommandees.flatMap(o => o?.domaine ? [o.domaine] : [])
    const matched = ecoles.filter(e =>
      e.domaines.some(d =>
        domainesRecommandes.some(dr => {
          const dL = d.toLowerCase()
          const drL = dr.toLowerCase()
          // Match si un mot du domaine recommandé est dans le domaine de l'école
          return drL.includes(dL) || dL.includes(drL) ||
            drL.split(/[\s&,]+/).some(mot => mot.length > 3 && dL.includes(mot)) ||
            dL.split(/[\s&,]+/).some(mot => mot.length > 3 && drL.includes(mot))
        })
      )
    )
    return matched.length > 0 ? matched : ecoles
  }, [orientationsRecommandees, ecoles])

  const ecolesAffichees = filtreEcole
    ? ecoles.filter(e =>
        e.nom.toLowerCase().includes(filtreEcole.toLowerCase()) ||
        e.domaines.some(d => d.toLowerCase().includes(filtreEcole.toLowerCase()))
      )
    : ecolesRecommandees

  // Compter notes par matière/semestre pour l'affichage
  const getStatNotes = (matiere: string, sem: 'S1' | 'S2') => {
    const devoirs = notes.filter(n => n.matiere === matiere && n.semestre === sem && n.type_eval === 'devoir')
    const compo = notes.find(n => n.matiere === matiere && n.semestre === sem && n.type_eval === 'composition')
    const meilleurs = devoirs.sort((a, b) => b.note - a.note).slice(0, 2)
    return { devoirs, compo, meilleurs }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analyse & Orientation 🎯</h1>
        <p className="text-gray-500 mt-1">
          Terminale {serie} — Programme sénégalais
        </p>
      </div>

      {/* Info système de notes */}
      <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Système de notation sénégalais</p>
          <p>Par semestre et par matière : <strong>2 ou 3 devoirs</strong> (les 2 meilleures notes comptent) + <strong>1 composition</strong>. L'orientation se débloque au S2 après avoir saisi toutes les compositions.</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {ONGLETS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium transition whitespace-nowrap',
              onglet === key ? 'bg-white text-green shadow-sm' : 'text-gray-500'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'orientation' && !s2Complet && (
              <Lock className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ))}
      </div>

      {/* ===== ONGLET BULLETIN IA ===== */}
      {onglet === 'bulletin' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-2xl p-4 flex items-start gap-3">
            <ScanLine className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-700 dark:text-orange-300">
              <p className="font-bold mb-1">Analyse IA de ton bulletin</p>
              <p className="text-orange-600 dark:text-orange-400">Uploade ton bulletin scolaire (PDF ou photo) et l'IA analyse tes notes, identifie tes points forts et te recommande une orientation.</p>
            </div>
          </div>
          <BulletinAnalyse />
        </div>
      )}

      {/* ===== ONGLET NOTES ===== */}
      {onglet === 'notes' && (
        <div className="space-y-4">

          {/* Sélecteur semestre */}
          <div className="flex gap-2">
            {(['S1', 'S2'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSemestre(s)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold text-sm transition',
                  semestre === s ? 'bg-green text-white' : 'bg-white text-gray-600 card-shadow'
                )}
              >
                Semestre {s.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter une note — {semestre}
          </button>

          {/* Formulaire */}
          {showForm && (
            <div className="bg-white rounded-2xl p-5 card-shadow border-2 border-green">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Nouvelle note — {semestre}</h3>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.matiere}
                    onChange={e => setForm(f => ({ ...f, matiere: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
                  >
                    {matieresDeSerie.map(m => (
                      <option key={m} value={m}>{MATIERE_ICONES[m]} {MATIERE_LABELS[m]}</option>
                    ))}
                  </select>
                  <select
                    value={form.type_eval}
                    onChange={e => setForm(f => ({ ...f, type_eval: e.target.value as Note['type_eval'] }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
                  >
                    <option value="devoir">Devoir</option>
                    <option value="composition">Composition</option>
                  </select>
                </div>

                {/* Sélecteur semestre */}
                <select
                  value={form.semestre}
                  onChange={e => setForm(f => ({ ...f, semestre: e.target.value as 'S1' | 'S2' }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm bg-white"
                >
                  <option value="S1">Semestre 1</option>
                  <option value="S2">Semestre 2</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Note /20</label>
                    <input
                      type="number" min="0" max="20" step="0.25"
                      placeholder="Ex: 14.5"
                      value={form.note}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
                    />
                  </div>
                </div>

                {/* Info coefficient */}
                <div className="bg-green-light rounded-xl p-3 text-xs text-green">
                  Coefficient {MATIERE_LABELS[form.matiere]} en {serie} : <strong>{coefficients[form.matiere] ?? 1}</strong>
                </div>

                <button
                  onClick={handleAddNote}
                  disabled={loading || !form.note}
                  className="w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Tableau des notes par matière */}
          <div className="space-y-3">
            {matieresDeSerie.map(matiere => {
              const { devoirs, compo, meilleurs } = getStatNotes(matiere, semestre)
              const moy = calculerMoyenneMatiere(notes, matiere, semestre, serie)
              const niveau = moy > 0 ? getNiveau(moy) : null

              return (
                <div key={matiere} className="bg-white rounded-2xl p-4 card-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MATIERE_ICONES[matiere]}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{MATIERE_LABELS[matiere]}</p>
                        <p className="text-xs text-gray-400">Coeff. {coefficients[matiere] ?? 1}</p>
                      </div>
                    </div>
                    {moy > 0 && niveau && (
                      <div className="text-right">
                        <span className={cn('text-lg font-bold', niveau.color)}>{moy}/20</span>
                        <p className={cn('text-xs px-2 py-0.5 rounded-full mt-1', niveau.bg, niveau.color)}>
                          {niveau.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Devoirs */}
                  <div className="space-y-1.5">
                    {devoirs.map((d, idx) => {
                      const estPrisEnCompte = meilleurs.some(m => m.id === d.id)
                      return (
                        <div key={d.id} className={cn(
                          'flex items-center justify-between p-2 rounded-lg text-xs',
                          estPrisEnCompte ? 'bg-green-light' : 'bg-gray-50 opacity-60'
                        )}>
                          <span className="text-gray-600">
                            Devoir {idx + 1}
                            {devoirs.length === 3 && (
                              <span className={cn('ml-1', estPrisEnCompte ? 'text-green font-semibold' : 'text-gray-400')}>
                                {estPrisEnCompte ? '✓ compté' : '(non compté)'}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{d.note}/20</span>
                            <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {devoirs.length < 2 && (
                      <div className="p-2 rounded-lg bg-gray-50 text-xs text-gray-400 border border-dashed border-gray-200">
                        + Ajouter devoir {devoirs.length + 1}/2 {devoirs.length === 1 ? '(ou 3ème optionnel)' : ''}
                      </div>
                    )}

                    {/* Composition */}
                    {compo ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-xs">
                        <span className="text-blue-600 font-medium">Composition</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700">{compo.note}/20</span>
                          <button onClick={() => handleDelete(compo.id)} className="text-gray-300 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-blue-50/50 text-xs text-blue-400 border border-dashed border-blue-200">
                        + Ajouter la composition
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== ONGLET ANALYSE ===== */}
      {onglet === 'analyse' && (
        <div className="space-y-5">

          {/* Sélecteur semestre */}
          <div className="flex gap-2">
            {(['S1', 'S2'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSemestre(s)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm transition',
                  semestre === s ? 'bg-green text-white' : 'bg-white text-gray-600 card-shadow'
                )}
              >
                Semestre {s.slice(1)}
              </button>
            ))}
          </div>

          {moyennesParMatiere.length < 2 ? (
            <div className="text-center py-16 text-gray-400">
              <TrendingUp className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Pas assez de données</p>
              <p className="text-sm mt-1">Ajoute tes notes pour voir l'analyse !</p>
            </div>
          ) : (
            <>
              <div className="gradient-green rounded-2xl p-6 text-white text-center">
                <p className="text-white/70 text-sm mb-1">Moyenne générale — {semestre}</p>
                <p className="text-6xl font-bold">{moyenneGenerale.toFixed(2)}</p>
                <p className="text-white/70 text-sm mt-1">/ 20</p>
                <p className="mt-3 text-white/90 font-medium">{getNiveau(moyenneGenerale).label}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green" />
                    <h3 className="font-bold text-gray-900">Points forts</h3>
                  </div>
                  {pointsForts.length === 0 ? (
                    <p className="text-sm text-gray-400">Continue à travailler !</p>
                  ) : (
                    <div className="space-y-2">
                      {pointsForts.map(m => (
                        <div key={m.matiere} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{m.icone} {m.label}</span>
                          <span className="text-sm font-bold text-green">{m.moyenne}/20</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-gray-900">Points faibles</h3>
                  </div>
                  {pointsFaibles.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucun point faible 🎉</p>
                  ) : (
                    <div className="space-y-2">
                      {pointsFaibles.map(m => (
                        <div key={m.matiere} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{m.icone} {m.label}</span>
                          <span className="text-sm font-bold text-red-500">{m.moyenne}/20</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {radarData.length >= 3 && (
                <div className="bg-white rounded-2xl p-5 card-shadow">
                  <h3 className="font-bold text-gray-900 mb-4">Profil par matière — {semestre}</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="matiere" tick={{ fontSize: 11 }} />
                      <Radar name="Moyenne" dataKey="moyenne" stroke="#1A7A4A" fill="#1A7A4A" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {pointsFaibles.length > 0 && (
                <div className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-green" />
                    <h3 className="font-bold text-gray-900">Plan d'amélioration personnalisé</h3>
                  </div>
                  <div className="space-y-3">
                    {pointsFaibles.slice(0, 3).map(m => (
                      <div key={m.matiere} className="bg-orange-50 rounded-xl p-4">
                        <p className="font-semibold text-sm text-orange-700 mb-1">
                          {m.icone} {m.label} — {m.moyenne}/20
                        </p>
                        <p className="text-xs text-orange-600">
                          💡 Consacre <strong>45 min/jour</strong> à cette matière. Utilise le Coach IA pour des exercices ciblés.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== ONGLET ORIENTATION ===== */}
      {onglet === 'orientation' && (
        <div className="space-y-5">
          {!s2Complet ? (
            <div className="text-center py-16 text-gray-400">
              <Lock className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-gray-700">Orientation disponible en fin de S2</p>
              <p className="text-sm mt-2 max-w-sm mx-auto">
                Saisis toutes tes <strong>compositions du S2</strong> pour débloquer les recommandations d'orientation personnalisées.
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto">
                <p className="text-xs font-semibold text-gray-600 mb-2">Compositions S2 manquantes :</p>
                {matieresDeSerie.filter(m =>
                  !notes.some(n => n.matiere === m && n.semestre === 'S2' && n.type_eval === 'composition')
                ).map(m => (
                  <div key={m} className="flex items-center gap-2 text-xs text-gray-500 py-1">
                    <div className="w-2 h-2 rounded-full bg-red-300" />
                    {MATIERE_ICONES[m]} {MATIERE_LABELS[m]}
                  </div>
                ))}
              </div>
            </div>
          ) : orientationsRecommandees.length === 0 ? (
            <div className="bg-orange-50 rounded-2xl p-6 text-center">
              <p className="text-orange-700 font-medium">Tes moyennes sont en dessous du seuil de recommandation.</p>
              <p className="text-orange-600 text-sm mt-2">Continue à travailler — consulte ton plan d'amélioration !</p>
            </div>
          ) : (
            <>
              <div className="bg-green-light rounded-2xl p-4">
                <p className="text-green font-semibold text-sm">
                   Basé sur ton bulletin du S2, voici les domaines qui correspondent à ton profil :
                </p>
              </div>

              {orientationsRecommandees.map((orientation, i) => (
                <div key={orientation?.domaine} className={cn(
                  'bg-white rounded-2xl p-5 card-shadow border-2',
                  i === 0 ? 'border-green' : 'border-transparent'
                )}>
                  {i === 0 && (
                    <div className="flex items-center gap-1 text-xs text-green font-bold mb-2">
                      <Star className="w-3.5 h-3.5" /> MEILLEURE CORRESPONDANCE
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{orientation?.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{orientation?.domaine}</h3>
                        <p className="text-xs text-gray-500">Score S2 : {orientation?.score.toFixed(1)}/20</p>
                      </div>
                    </div>
                    <div className="bg-green-light text-green text-xs px-3 py-1 rounded-full font-bold flex-shrink-0">
                      {orientation?.score.toFixed(1)}/20
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{orientation?.description}</p>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Filières recommandées :</p>
                    <div className="flex flex-wrap gap-2">
                      {orientation?.filieres.map(f => (
                        <span key={f} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ===== ONGLET ÉCOLES ===== */}
      {onglet === 'ecoles' && (
        <div className="space-y-4">
          {orientationsRecommandees.length > 0 && (
            <div className="bg-green-light rounded-2xl p-4">
              <p className="text-green font-semibold text-sm">
                 Écoles recommandées selon ton profil : {orientationsRecommandees[0]?.domaine}
              </p>
            </div>
          )}

          <input
            type="text"
            placeholder="Rechercher une école ou un domaine..."
            value={filtreEcole}
            onChange={e => setFiltreEcole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green text-sm"
          />

          {ecolesAffichees.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune école trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ecolesAffichees.map(ecole => (
                <div key={ecole.id} className="bg-white rounded-2xl p-5 card-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{ecole.nom}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {ecole.localisation} • {ecole.niveau_requis}</p>
                    </div>
                    {ecole.frais_min && ecole.frais_max ? (
                      <p className="text-xs text-green font-bold flex-shrink-0">
                        {(ecole.frais_min / 1000).toFixed(0)}k — {(ecole.frais_max / 1000).toFixed(0)}k FCFA/an
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 flex-shrink-0">Nous contacter</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{ecole.description}</p>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Filières :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ecole.filieres.slice(0, 4).map(f => (
                        <span key={f} className="text-xs bg-green-light text-green px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                      {ecole.filieres.length > 4 && (
                        <span className="text-xs text-gray-400">+{ecole.filieres.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{ecole.contact}</span>
                    
                      href={`https://${ecole.site_web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-green font-semibold hover:underline"
                    <a>
                      Visiter <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}