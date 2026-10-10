"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Headphones,
  Medal,
  Play,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  Moon,
  Sun,
} from "lucide-react"

/* =========================================================
   ANIMATIONS
   ========================================================= */

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 45,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const fadeLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const fadeRight: Variants = {
  hidden: {
    opacity: 0,
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardAnimation: Variants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/* =========================================================
   DATA
   ========================================================= */

const features = [
  {
    icon: BookOpen,
    title: "Cours conformes au programme",
    description:
      "Accède à des cours structurés et adaptés aux programmes scolaires sénégalais.",
    color: "green",
  },
  {
    icon: Brain,
    title: "Coach IA personnalisé",
    description:
      "Pose tes questions, demande des explications et révise avec ton Coach IA 24h/24.",
    color: "blue",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Gagne des XP, débloque des niveaux et relève des défis pour rester motivé.",
    color: "orange",
  },
  {
    icon: Target,
    title: "Suivi de progression",
    description:
      "Visualise tes performances et identifie les matières sur lesquelles progresser.",
    color: "purple",
  },
  {
    icon: Clock3,
    title: "Révisions à ton rythme",
    description:
      "Organise tes séances de révision selon ton emploi du temps et tes objectifs.",
    color: "red",
  },
  {
    icon: Medal,
    title: "Épreuves & annales",
    description:
      "Entraîne-toi avec des exercices et des épreuves pour être prêt le jour J.",
    color: "cyan",
  },
]

const subjects = [
  {
    short: "MATH",
    name: "Mathématiques",
    description: "Algèbre, géométrie, fonctions et exercices.",
    color: "green",
  },
  {
    short: "PC",
    name: "Physique-Chimie",
    description: "Cours, formules, expériences et exercices.",
    color: "blue",
  },
  {
    short: "SVT",
    name: "Sciences de la Vie",
    description: "Biologie, géologie et sciences naturelles.",
    color: "emerald",
  },
  {
    short: "FR",
    name: "Français",
    description: "Littérature, grammaire et expression.",
    color: "orange",
  },
  {
    short: "HG",
    name: "Histoire-Géographie",
    description: "Comprendre les grands événements et territoires.",
    color: "purple",
  },
  {
    short: "EN",
    name: "Anglais",
    description: "Vocabulaire, grammaire et compréhension.",
    color: "red",
  },
]

/* =========================================================
   FEATURE CARD
   ========================================================= */

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType
  title: string
  description: string
  color: string
}) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    cyan: "bg-cyan-100 text-cyan-600",
  }

  return (
    <motion.div
      variants={cardAnimation}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-2xl sm:rounded-3xl sm:p-7"
    >
      <motion.div
        whileHover={{
          rotate: 5,
          scale: 1.1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
        }}
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl ${colors[color]}`}
      >
        <Icon className="h-7 w-7" />
      </motion.div>

      <h3 className="text-base font-black text-slate-900 sm:text-xl">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <motion.div
        whileHover={{ x: 5 }}
        className="mt-5 flex items-center gap-1 text-sm font-bold text-green-600"
      >
        Découvrir
        <ArrowRight className="h-4 w-4" />
      </motion.div>
    </motion.div>
  )
}

/* =========================================================
   SUBJECT CARD
   ========================================================= */

function SubjectCard({
  short,
  name,
  description,
  color,
}: {
  short: string
  name: string
  description: string
  color: string
}) {
  const styles: Record<
    string,
    {
      bg: string
      text: string
    }
  > = {
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-600",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
    },
  }

  const style = styles[color]

  return (
    <motion.div
      variants={cardAnimation}
      whileHover={{
        y: -7,
        scale: 1.025,
      }}
      className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-xl sm:rounded-3xl sm:p-6"
    >
      <motion.div
        whileHover={{
          scale: 1.12,
          rotate: 3,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
        }}
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl ${style.bg}`}
      >
        <span className={`text-sm font-black ${style.text}`}>
          {short}
        </span>
      </motion.div>

      <h3 className="text-sm font-black text-slate-900 sm:text-lg">{name}</h3>

      <p className="mt-1.5 hidden text-xs leading-5 text-slate-500 sm:mt-2 sm:block sm:text-sm sm:leading-6">
        {description}
      </p>

      <motion.div
        whileHover={{ x: 4 }}
        className={`mt-4 flex items-center gap-1 text-sm font-bold ${style.text}`}
      >
        Réviser
        <ChevronRight className="h-4 w-4" />
      </motion.div>
    </motion.div>
  )
}

/* =========================================================
   PAGE
   ========================================================= */

/* =========================================================
   THEME TOGGLE
   ========================================================= */

function ThemeToggleBtn() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return (
    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
  )
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}


export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50/50 text-slate-900">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <motion.header
        initial={{
          opacity: 0,
          y: -25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="fixed left-0 right-0 top-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:px-6 sm:py-3">
            {/* Logo */}

            <Link href="/" className="group flex items-center gap-3">
              <motion.div
                whileHover={{
                  scale: 1.06,
                  rotate: 2,
                }}
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <Image
                  src="/logo.png"
                  alt="TerangaLearn"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </motion.div>

              <div className="hidden xs:block sm:block">
                <div className="text-base sm:text-lg font-black tracking-tight">
                  <span className="text-green-700">Teranga</span>
                  <span className="text-yellow-500">Learn</span>
                </div>

                <p className="text-[10px] font-medium text-slate-500">
                  La plateforme intelligente pour la réussite scolaire
                </p>
              </div>
            </Link>

            {/* Navigation */}

            <div className="hidden items-center gap-7 md:flex">
              <a
                href="#accueil"
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-green-600"
              >
                Accueil
              </a>

              <a
                href="#fonctionnalites"
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-green-600"
              >
                Fonctionnalités
              </a>

              <a
                href="#matieres"
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-green-600"
              >
                Matières
              </a>

              <a
                href="#temoignage"
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-green-600"
              >
                Témoignage
              </a>
            </div>

            {/* CTA */}

            <div className="flex items-center gap-2">
              {/* Toggle dark/light */}
              <ThemeToggleBtn />

              {/* Se connecter */}
              <Link
                href="/connexion"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                🔐 <span className="hidden sm:inline">Se connecter</span><span className="sm:hidden">Connexion</span>
              </Link>

              {/* Commencer */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  🚀 <span className="hidden sm:inline">Commencer</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </motion.div>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="accueil"
        className="relative overflow-hidden bg-gradient-to-b from-green-50/60 via-white to-green-50/20 pt-20 sm:pt-28 lg:pt-32"
      >
        {/* Décorations */}

        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-green-300/30 blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-yellow-200/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="grid items-center gap-8 pb-10 sm:pb-0 lg:min-h-[620px] lg:grid-cols-2 lg:gap-4">
            {/* LEFT */}

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="relative z-10 max-w-2xl"
            >
              {/* Badge */}

              <motion.div
                variants={fadeUp}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs sm:text-sm font-bold text-green-700"
              >
                <Sparkles className="h-4 w-4" />
                Ta réussite, notre mission
              </motion.div>

              {/* Title */}

              <motion.h1
                variants={fadeUp}
                className="text-[2.35rem] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl"
              >
                Révise
                <span className="text-green-600"> intelligemment,</span>
                <br />
                réussis tes
                <span className="text-green-600"> examens !</span>
              </motion.h1>

              {/* Description */}

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8"
              >
                TerangaLearn accompagne les élèves du Sénégal dans leur
                préparation aux examens avec des cours, des exercices, des
                annales et un Coach IA disponible à tout moment.
              </motion.p>

              {/* Buttons */}

              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4"
              >
                <motion.div
                  whileHover={{
                    scale: 1.04,
                    y: -3,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                >
                  <Link
                    href="/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-green-600/25 transition-colors hover:bg-green-700 sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                  >
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </motion.div>

                <motion.a
                  href="#fonctionnalites"
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3.5 text-sm font-bold text-green-700 shadow-sm sm:w-auto sm:px-7 sm:py-4 sm:text-base"
                >
                  <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                  Découvrir
                </motion.a>
              </motion.div>

              {/* Mini stats */}

              <motion.div
                variants={fadeUp}
                className="mt-6 flex items-center gap-4 sm:mt-10 sm:gap-6"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-600 sm:h-9 sm:w-9">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-900 sm:text-sm">
                      Élèves
                    </p>
                    <p className="text-[10px] text-slate-500 sm:text-xs">
                      motivés chaque jour
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 sm:h-9 sm:w-9">
                    <Star className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-900 sm:text-sm">
                      Révision
                    </p>
                    <p className="text-[10px] text-slate-500 sm:text-xs">
                      simple et intelligente
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT */}

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeRight}
              className="relative mx-auto w-full max-w-[650px]"
            >
              {/* Glow */}

              <motion.div
                animate={{
                  scale: [1, 1.06, 1],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-10 rounded-full bg-green-300/40 blur-3xl"
              />

              {/* Student image */}

              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <Image
                  src="/logob.png"
                  alt="Étudiante TerangaLearn"
                  width={1536}
                  height={1024}
                  priority
                  className="h-auto w-full object-contain"
                />
              </motion.div>

              {/* XP */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: -40,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: [0, -7, 0],
                }}
                transition={{
                  opacity: {
                    delay: 0.8,
                    duration: 0.7,
                  },
                  x: {
                    delay: 0.8,
                    duration: 0.7,
                  },
                  y: {
                    delay: 1.5,
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="absolute left-0 top-16 z-20 rounded-xl border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:top-20 sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 sm:h-11 sm:w-11">
                    <Zap className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                      Aujourd'hui
                    </p>
                    <p className="text-base font-black text-slate-900 sm:text-lg">
                      +50 XP
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Streak */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: 40,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: [0, 7, 0],
                }}
                transition={{
                  opacity: {
                    delay: 1,
                    duration: 0.7,
                  },
                  x: {
                    delay: 1,
                    duration: 0.7,
                  },
                  y: {
                    delay: 1.7,
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="absolute right-0 top-28 z-20 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-2xl shadow-slate-900/10 sm:top-36 sm:rounded-2xl sm:px-4 sm:py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-500 sm:h-10 sm:w-10">
                    <Flame className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 sm:text-xs">Streak</p>
                    <p className="text-sm font-black text-slate-900 sm:text-base">7 jours</p>
                  </div>
                </div>
              </motion.div>

              {/* Level */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 35,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 1.2,
                  duration: 0.8,
                }}
                className="absolute bottom-8 right-3 z-20 rounded-xl border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:bottom-12 sm:right-5 sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <Trophy className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Niveau</p>
                    <p className="font-black text-slate-900">
                      Expert
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="fonctionnalites"
        className="scroll-mt-24 bg-slate-50 py-14 sm:py-20 lg:py-28"
      >
        <motion.div
          className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.12,
          }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
          >
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-green-600">
              <span className="h-0.5 w-8 bg-green-600" />
              Tout ce dont tu as besoin
              <span className="h-0.5 w-8 bg-green-600" />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Une plateforme complète pour ta réussite
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              Des outils simples et puissants pour apprendre, pratiquer,
              suivre tes progrès et garder ta motivation.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* =====================================================
          MATIERES
      ===================================================== */}

      <section
        id="matieres"
        className="scroll-mt-24 bg-slate-50/60 py-14 sm:py-20 lg:py-28"
      >
        <motion.div
          className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.12,
          }}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeUp}
            className="mb-10 flex flex-col justify-between gap-4 sm:mb-14 md:flex-row md:items-end"
          >
            <div className="max-w-2xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-green-600 sm:text-sm">
                Tes matières
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Révise toutes tes matières
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Retrouve les matières essentielles et avance à ton rythme
                grâce à des contenus pensés pour les élèves sénégalais.
              </p>
            </div>

            <motion.div
              whileHover={{
                x: 5,
              }}
              className="flex items-center gap-2 font-bold text-green-600"
            >
              Voir toutes les matières
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard key={subject.name} {...subject} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* =====================================================
          WHY TERANGALEARN
      ===================================================== */}

      <section
        id="temoignage"
        className="scroll-mt-24 relative overflow-hidden bg-green-950 py-14 text-white sm:py-20 lg:py-28"
      >
        {/* Décoration */}

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-400 blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-yellow-400 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2">
            {/* LEFT */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              variants={fadeLeft}
            >
              <span className="text-sm font-bold uppercase tracking-widest text-green-300">
                Pourquoi TerangaLearn ?
              </span>

              <h2 className="mt-4 text-3xl font-black leading-tight sm:mt-5 sm:text-4xl lg:text-5xl">
                Plus qu'une plateforme,
                <br />
                ton compagnon de réussite.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-7 text-green-100/75 sm:mt-6 sm:text-lg sm:leading-8">
                Tout est pensé pour t'aider à apprendre à ton rythme,
                suivre tes performances et garder la motivation jusqu'au
                jour de l'examen.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Des contenus adaptés aux programmes scolaires",
                  "Un accompagnement personnalisé avec l'IA",
                  "Une progression visible et motivante",
                  "Des exercices pour apprendre en pratiquant",
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{
                      opacity: 0,
                      x: -20,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      delay: index * 0.12,
                      duration: 0.5,
                    }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-300" />
                    <span className="text-sm text-green-50/90">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* TESTIMONIAL */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.2,
              }}
              variants={fadeRight}
            >
              <motion.div
                whileHover={{
                  y: -6,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8 lg:p-10"
              >
                {/* Stars */}

                <div className="mb-5 flex gap-1 sm:mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        scale: 0,
                      }}
                      whileInView={{
                        opacity: 1,
                        scale: 1,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: i * 0.1,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                <blockquote className="text-xl font-bold leading-relaxed text-white sm:text-2xl">
                  "Avec TerangaLearn, je peux réviser quand je veux,
                  comprendre mes erreurs et suivre mes progrès."
                </blockquote>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 font-black">
                    A
                  </div>

                  <div>
                    <p className="font-bold text-white">
                      Élève TerangaLearn
                    </p>

                    <p className="text-sm text-green-200/70">
                      Élève en préparation d'examen
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="bg-white/70 py-14 sm:py-20 lg:py-28">
        <motion.div
          className="mx-auto max-w-5xl px-4 sm:px-5"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
        >
          <motion.div
            variants={scaleIn}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-700 to-green-950 px-5 py-12 text-center text-white shadow-2xl shadow-green-900/20 sm:rounded-[2.5rem] sm:px-8 sm:py-16 lg:px-16"
          >
            {/* Decorative circles */}

            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.08, 0.18, 0.08],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-yellow-300 blur-3xl"
            />

            <div className="relative z-10">
              <motion.div
                animate={{
                  y: [0, -7, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"
              >
                <Rocket className="h-8 w-8" />
              </motion.div>

              <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
                Prêt à réussir ton examen ?
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-green-50/80 sm:mt-5 sm:text-lg sm:leading-8">
                Commence dès maintenant à apprendre, pratiquer et progresser
                avec TerangaLearn.
              </p>

              <motion.div
                whileHover={{
                  scale: 1.06,
                  y: -3,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className="mt-8 inline-block"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 font-black text-green-700 shadow-xl"
                >
                  Créer mon compte
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <motion.footer
        initial={{
          opacity: 0,
        }}
        whileInView={{
          opacity: 1,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 0.8,
        }}
        className="bg-green-950 text-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-14 lg:px-8">
          <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={fadeUp}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <Image
                    src="/logo.png"
                    alt="TerangaLearn"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div className="text-xl font-black">
                    <span className="text-white">Teranga</span>
                    <span className="text-yellow-400">Learn</span>
                  </div>

                  <p className="text-xs text-green-200/60">
                    Réussis ton examen
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-xs text-sm leading-6 text-green-100/60">
                La plateforme intelligente pour accompagner les élèves
                sénégalais vers la réussite.
              </p>
            </motion.div>

            {/* Plateforme */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={fadeUp}
            >
              <h3 className="font-black text-white">Plateforme</h3>

              <div className="mt-5 space-y-3">
                <a
                  href="#fonctionnalites"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Fonctionnalités
                </a>

                <a
                  href="#matieres"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Matières
                </a>

                <a
                  href="#temoignage"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Témoignages
                </a>

                <Link
                  href="/register"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Créer un compte
                </Link>
              </div>
            </motion.div>

            {/* Ressources */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={fadeUp}
            >
              <h3 className="font-black text-white">Ressources</h3>

              <div className="mt-5 space-y-3">
                <a
                  href="/register"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Cours
                </a>

                <a
                  href="/register"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Exercices
                </a>

                <a
                  href="/register"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Annales
                </a>

                <a
                  href="/register"
                  className="block text-sm text-green-100/60 transition-colors hover:text-white"
                >
                  Coach IA
                </a>
              </div>
            </motion.div>

            {/* Contact */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
              }}
              variants={fadeUp}
            >
              <h3 className="font-black text-white">Besoin d'aide ?</h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <Headphones className="h-4 w-4" />
                  </div>

                  <span className="text-sm text-green-100/60">
                    Support TerangaLearn
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <GraduationCap className="h-4 w-4" />
                  </div>

                  <span className="text-sm text-green-100/60">
                    Accompagnement scolaire
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7">
            <div className="flex flex-col justify-between gap-4 text-sm text-green-100/50 sm:flex-row">
              <p>
                © {new Date().getFullYear()} TerangaLearn. Tous droits
                réservés.
              </p>

              <div className="flex gap-5">
                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Confidentialité
                </a>

                <a
                  href="#"
                  className="transition-colors hover:text-white"
                >
                  Conditions
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </main>
  )
}
