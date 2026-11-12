'use client'

import { useState } from 'react'
import { Check, Sparkles, Building2, Zap, Crown, ArrowRight, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanInfo } from '@/lib/plan'

const FREE_FEATURES = [
  'Accès aux cours essentiels',
  'Exercices avec corrections simples',
  'Sélection d\'annales disponibles',
  'Coach IA (3 messages / jour)',
  'Progression et XP',
  'Classement et communauté',
  'Quelques simulations d\'examen (2 / semaine)',
]

const PREMIUM_FEATURES = [
  'Accès complet aux cours et annales',
  'Coach IA illimité',
  'Corrections détaillées et expliquées',
  'Simulations d\'examens illimitées',
  'Parcours de révision personnalisés',
  'Analyse détaillée des lacunes',
  'Planification intelligente',
  'Suivi approfondi des performances',
  'Toutes les fonctionnalités à venir',
]

const SCHOOL_FEATURES = [
  'Licences élèves en volume',
  'Tableau de bord de l\'établissement',
  'Gestion des classes et enseignants',
  'Suivi des résultats par classe',
  'Statistiques de progression',
  'Exercices et évaluations collectives',
  'Rapports pédagogiques',
  'Gestion centralisée des licences',
]

export default function PremiumClient({ planInfo, userId }: { planInfo: PlanInfo; userId: string }) {
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const monthlyPrice = 1900
  const yearlyPrice = 18000  // ~1500 FCFA/mois, économie de 4800 FCFA
  const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice

  const isPremium = planInfo.plan === 'premium' || planInfo.plan === 'school'
  const expiresAt = planInfo.expiresAt

  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la création du paiement')
        return
      }

      if (data.dev) {
        // Mode développement : simuler le succès
        window.location.href = `/premium/success?sub=${data.subscriptionId}`
        return
      }

      // Rediriger vers Wave Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      setError('Erreur réseau. Réessaie dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-semibold">
          <Sparkles className="w-4 h-4" />
          Choisissez votre formule
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Prépare ton examen sérieusement
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
          Rejoins des milliers d'élèves sénégalais qui révisent efficacement avec TerangaLearn.
        </p>
      </div>

      {/* Plan actuel (si premium) */}
      {isPremium && expiresAt && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3">
          <Crown className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              Ton abonnement {planInfo.plan === 'school' ? 'École' : 'Premium'} est actif
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Expire le {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Toggle mensuel / annuel */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex gap-1">
          {(['monthly', 'yearly'] as const).map(cycle => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition',
                billingCycle === cycle
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {cycle === 'monthly' ? 'Mensuel' : (
                <span className="flex items-center gap-1.5">
                  Annuel
                  <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    −21%
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Free */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gratuit</p>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">TerangaLearn Free</h2>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-4xl font-black text-gray-900 dark:text-white">0</span>
              <span className="text-gray-400 text-sm">FCFA</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Pour toujours, sans engagement</p>
          </div>

          <div className="space-y-2.5">
            {FREE_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{f}</span>
              </div>
            ))}
          </div>

          <div className={cn(
            'w-full py-3 rounded-xl text-sm font-bold text-center',
            planInfo.plan === 'free'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}>
            {planInfo.plan === 'free' ? '✓ Ton plan actuel' : 'Plan de base'}
          </div>
        </div>

        {/* Premium */}
        <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-3xl p-6 space-y-5 shadow-xl shadow-green-500/20">
          {/* Badge populaire */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-yellow-400 text-yellow-900 text-[11px] font-black px-3 py-1 rounded-full">
              ⭐ LE PLUS POPULAIRE
            </span>
          </div>

          <div>
            <p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Offre payante</p>
            <h2 className="text-xl font-black text-white">TerangaLearn Premium</h2>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-4xl font-black text-white">
                {billingCycle === 'monthly' ? '1 900' : '18 000'}
              </span>
              <span className="text-green-200 text-sm">FCFA</span>
            </div>
            <p className="text-xs text-green-200 mt-1">
              {billingCycle === 'monthly'
                ? 'par mois · année scolaire'
                : `par an · soit 1 500 FCFA/mois`}
            </p>
            {billingCycle === 'yearly' && (
              <p className="text-xs text-yellow-300 font-semibold mt-1">
                🎁 Économise 4 800 FCFA vs mensuel
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            {PREMIUM_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-200 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-50">{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-200 bg-red-500/20 rounded-xl px-3 py-2 text-center">
              {error}
            </p>
          )}

          {planInfo.plan === 'premium' ? (
            <div className="w-full py-3 rounded-xl text-sm font-bold text-center bg-white/20 text-white">
              <Crown className="w-4 h-4 inline mr-1.5" />
              Abonnement actif
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black bg-white text-green-700 hover:bg-green-50 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Chargement…' : 'Passer Premium'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Établissements */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 space-y-5">
          <div>
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">B2B</p>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Établissements</h2>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-2xl font-black text-gray-900 dark:text-white">Sur devis</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Licence annuelle · année scolaire définie</p>
          </div>

          <div className="space-y-2.5">
            {SCHOOL_FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{f}</span>
              </div>
            ))}
          </div>

          <a
            href="mailto:contact@terangalearn.sn"
            className="w-full py-3 rounded-xl text-sm font-bold text-center bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Contacter l&apos;équipe
          </a>
        </div>
      </div>

      {/* Garanties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'Paiement sécurisé', desc: 'Wave CI et Orange Money' },
          { icon: Clock, title: 'Année scolaire définie', desc: 'Date d\'expiration claire et affichée' },
          { icon: Zap, title: 'Activation immédiate', desc: 'Accès Premium dès confirmation du paiement' },
        ].map(g => (
          <div key={g.title} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
            <g.icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{g.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Note année scolaire */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 max-w-lg mx-auto">
        L&apos;abonnement annuel correspond à une année scolaire (ex: 2026-2027). La date d&apos;expiration est affichée dans ton profil. Un abonnement non renouvelé repasse automatiquement en Free.
      </p>

    </div>
  )
}
