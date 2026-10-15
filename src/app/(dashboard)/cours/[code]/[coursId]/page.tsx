import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, Zap, BookOpen } from 'lucide-react'
import MarkCoursDone from '@/components/cours/MarkCoursDone'
import GenerateExercise from '@/components/cours/GenerateExercise'

function formatContenu(contenu: string) {
  const lignes = contenu.split('\n')
  const elements: { type: string; texte: string }[] = []

  for (const ligne of lignes) {
    const trim = ligne.trim()
    if (!trim) continue

    if (trim.startsWith('# ')) {
      elements.push({ type: 'h1', texte: trim.slice(2) })
    } else if (trim.startsWith('## ')) {
      elements.push({ type: 'h2', texte: trim.slice(3) })
    } else if (trim.startsWith('### ')) {
      elements.push({ type: 'h3', texte: trim.slice(4) })
    } else if (trim.startsWith('- ') || trim.startsWith('• ') || trim.startsWith('* ')) {
      elements.push({ type: 'bullet', texte: trim.slice(2) })
    } else if (/^\d+[.)]\s/.test(trim)) {
      elements.push({ type: 'numbered', texte: trim.replace(/^\d+[.)]\s/, '') })
    } else {
      elements.push({ type: 'para', texte: trim })
    }
  }

  return elements
}

export default async function CoursDetailPage({
  params
}: {
  params: { code: string; coursId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('classe')
    .eq('id', user.id)
    .single()

  const { data: cours } = await supabase
    .from('cours')
    .select(`*, chapitres(titre, matiere_id, matieres(nom, icone, couleur, code, classe))`)
    .eq('id', params.coursId)
    .single()

  if (!cours) notFound()

  // Vérifier que la matière correspond à la classe de l'élève
  const matiereClasse = (cours.chapitres as any)?.matieres?.classe
  if (matiereClasse && matiereClasse !== 'both' && matiereClasse !== profile?.classe) notFound()

  const { data: progression } = await supabase
    .from('progression_cours')
    .select('termine, progression_pct')
    .eq('user_id', user.id)
    .eq('cours_id', cours.id)
    .single()

  const matiere = (cours.chapitres as any)?.matieres
  const dejaFait = progression?.termine ?? false
  const elements = formatContenu(cours.contenu)

  // Grouper les bullets consécutifs
  const groupedElements: { type: string; texte?: string; items?: string[] }[] = []
  let i = 0
  while (i < elements.length) {
    if (elements[i].type === 'bullet') {
      const items: string[] = []
      while (i < elements.length && elements[i].type === 'bullet') {
        items.push(elements[i].texte)
        i++
      }
      groupedElements.push({ type: 'bulletList', items })
    } else if (elements[i].type === 'numbered') {
      const items: string[] = []
      while (i < elements.length && elements[i].type === 'numbered') {
        items.push(elements[i].texte)
        i++
      }
      groupedElements.push({ type: 'numberedList', items })
    } else {
      groupedElements.push(elements[i])
      i++
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/cours/${params.code}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green mb-4 transition"
        >
          <ChevronLeft className="w-4 h-4" /> {matiere?.nom}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{cours.titre}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-400 flex-shrink-0">
            <Clock className="w-4 h-4" />
            {cours.duree_minutes} min
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">{(cours.chapitres as any)?.titre}</p>
      </div>

      {/* Résumé */}
      {cours.resume && (
        <div className="bg-green-light border-l-4 border-green rounded-r-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green" />
            <p className="text-sm font-bold text-green">Résumé rapide</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{cours.resume}</p>
        </div>
      )}

      {/* Exercice généré par IA */}
      <GenerateExercise
     userId={user.id}
     coursTitre={cours.titre}
     coursContenu={cours.contenu}
     />

      {/* Contenu structuré */}
      <div className="bg-white rounded-2xl p-6 card-shadow space-y-4">
        {groupedElements.map((el, idx) => {
          if (el.type === 'h1') {
            return (
              <h1 key={idx} className="text-xl font-bold text-green border-b border-green/20 pb-2 mt-6 first:mt-0">
                {el.texte}
              </h1>
            )
          }
          if (el.type === 'h2') {
            return (
              <h2 key={idx} className="text-lg font-bold text-gray-900 mt-5 first:mt-0 flex items-center gap-2">
                <div className="w-1 h-5 bg-green rounded-full flex-shrink-0" />
                {el.texte}
              </h2>
            )
          }
          if (el.type === 'h3') {
            return (
              <h3 key={idx} className="text-base font-semibold text-gray-800 mt-3">
                {el.texte}
              </h3>
            )
          }
          if (el.type === 'bulletList') {
            return (
              <ul key={idx} className="space-y-2 ml-2">
                {el.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )
          }
          if (el.type === 'numberedList') {
            return (
              <ol key={idx} className="space-y-2 ml-2">
                {el.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-green text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {j + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            )
          }
          return (
            <p key={idx} className="text-sm text-gray-700 leading-relaxed">
              {el.texte}
            </p>
          )
        })}
      </div>

      {/* Actions */}
<div className="flex items-center justify-between bg-white rounded-2xl p-5 card-shadow">
  <div className="flex items-center gap-2 text-sm text-gray-500">
    <Zap className="w-4 h-4 text-green" />
    <span>+30 XP en terminant ce cours</span>
  </div>
  <MarkCoursDone
    coursId={cours.id}
    userId={user.id}
    dejaFait={dejaFait}
    nombreMots={cours.contenu.split(' ').length}
  />
</div>
    </div>
  )
}