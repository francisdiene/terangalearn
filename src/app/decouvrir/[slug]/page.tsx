import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, GraduationCap, Bot, Trophy, BarChart3, CheckCircle2 } from 'lucide-react'

const CONTENU: Record<string, {
  emoji: string
  titre: string
  accroche: string
  icon: any
  sections: { titre: string; points: string[] }[]
}> = {
  'cours': {
    emoji: '🎓',
    titre: 'Cours conformes au programme sénégalais',
    accroche: "Toutes les matières, tous les chapitres, exactement comme dans ton manuel scolaire officiel.",
    icon: GraduationCap,
    sections: [
      {
        titre: "Un contenu 100% aligné sur le programme",
        points: [
          "65 cours officiels couvrant Histoire, Géographie, Philosophie et SVT (séries L et S)",
          "Contenu structuré par matière puis par chapitre, dans l'ordre du programme",
          "Adapté spécifiquement à la classe (3ème ou Terminale) et à la série de l'élève",
        ]
      },
      {
        titre: "Une lecture qui favorise vraiment l'apprentissage",
        points: [
          "Mise en forme claire avec titres, points clés et listes pour mieux mémoriser",
          "Résumé rapide en haut de chaque cours pour réviser l'essentiel",
          "Système anti-triche : un temps de lecture minimum garantit une vraie assimilation avant de valider le cours",
        ]
      },
      {
        titre: "Une progression récompensée",
        points: [
          "Chaque cours terminé rapporte des points d'expérience (XP)",
          "Le suivi de progression permet de voir d'un coup d'œil ce qui reste à réviser",
        ]
      }
    ]
  },
  'coach-ia': {
    emoji: '🤖',
    titre: 'Coach IA personnalisé 24h/24',
    accroche: "Un assistant intelligent qui connaît ton programme et répond à toutes tes questions, à toute heure.",
    icon: Bot,
    sections: [
      {
        titre: "Une intelligence artificielle au service de ta réussite",
        points: [
          "Propulsé par LLaMA 3.3 70B, un des modèles d'IA les plus performants pour le raisonnement",
          "Connecté directement au contenu des cours officiels sénégalais pour des réponses fiables",
          "Disponible à tout moment, même tard le soir avant un contrôle",
        ]
      },
      {
        titre: "Conçu uniquement pour t'aider à apprendre",
        points: [
          "Répond en français simple et adapté à ton niveau",
          "Reste strictement focalisé sur le programme scolaire — pas de distraction hors-sujet",
          "Garde l'historique de vos échanges pour continuer une conversation entre deux sessions",
        ]
      },
      {
        titre: "Un vrai accompagnement, pas juste des réponses",
        points: [
          "T'aide à comprendre une notion plutôt que de simplement donner la réponse à un exercice",
          "Peut reformuler une explication si tu n'as pas compris du premier coup",
        ]
      }
    ]
  },
  'gamification': {
    emoji: '🏆',
    titre: 'Gamification et classements nationaux',
    accroche: "Réviser devient un jeu : gagne des points, débloque des badges et grimpe dans le classement.",
    icon: Trophy,
    sections: [
      {
        titre: "Un système de progression motivant",
        points: [
          "Gagne des points d'expérience (XP) à chaque cours terminé ou exercice réussi",
          "Monte de niveau au fur et à mesure de tes révisions",
          "Maintiens ton streak (série de jours consécutifs) pour rester régulier",
        ]
      },
      {
        titre: "Des badges à débloquer",
        points: [
          "10 badges différents récompensant l'assiduité et la performance",
          "Attribution automatique dès que les conditions sont remplies",
        ]
      },
      {
        titre: "Te mesurer aux autres élèves",
        points: [
          "Classement national des 50 meilleurs élèves par XP",
          "Vois ta position et progresse pour grimper dans le classement",
        ]
      }
    ]
  },
  'progression': {
    emoji: '📊',
    titre: 'Suivi de progression intelligent',
    accroche: "Visualise tes points forts, tes points faibles, et reçois des recommandations sur mesure.",
    icon: BarChart3,
    sections: [
      {
        titre: "Une vue claire de ton niveau",
        points: [
          "Suivi détaillé de ta progression dans chaque cours et chaque matière",
          "Module Analyse & Orientation (Terminale) : saisis tes notes par semestre et matière",
          "Calcul automatique de tes moyennes selon les règles officielles du système sénégalais",
        ]
      },
      {
        titre: "Une orientation basée sur tes vraies performances",
        points: [
          "Recommandations de filières et d'établissements basées sur ton bulletin réel",
          "Débloqué uniquement quand ton profil scolaire du second semestre est complet, pour des conseils fiables",
        ]
      },
      {
        titre: "Un plan d'action personnalisé",
        points: [
          "Identifie automatiquement tes matières à renforcer en priorité",
          "Planifie tes révisions selon le calendrier scolaire sénégalais officiel",
        ]
      }
    ]
  },
}

export default function DecouvrirPage({ params }: { params: { slug: string } }) {
  const data = CONTENU[params.slug]
  if (!data) notFound()

  const Icon = data.icon

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header vert */}
      <div className="bg-green relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green via-green to-green/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 md:py-14">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 flex-shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-4xl">{data.emoji}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
            {data.titre}
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-xl">
            {data.accroche}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {data.sections.map((section, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 card-shadow">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{section.titre}</h2>
            <div className="space-y-3">
              {section.points.map((point, j) => (
                <div key={j} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="gradient-green rounded-2xl p-6 md:p-8 text-white text-center">
          <h3 className="font-bold text-xl mb-2">Prêt à commencer ? 🚀</h3>
          <p className="text-white/80 text-sm mb-5">
            Crée ton compte gratuitement et accède à toutes ces fonctionnalités.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-green font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition"
          >
            Créer mon compte
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(CONTENU).map(slug => ({ slug }))
}
