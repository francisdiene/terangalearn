import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — TerangaLearn',
}

export default function PolitiqueConfidentialite() {
  return (
    <article className="prose prose-sm sm:prose max-w-none">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : octobre 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Données collectées</h2>
        <p className="text-sm text-gray-600 mb-3">Lors de votre utilisation de TerangaLearn, nous collectons les données suivantes :</p>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-600 space-y-2">
          <div className="flex gap-2"><span className="text-green-600 font-bold">→</span><span><strong>Données d'inscription :</strong> nom complet, adresse e-mail, mot de passe (haché), série, classe, établissement scolaire (optionnel).</span></div>
          <div className="flex gap-2"><span className="text-green-600 font-bold">→</span><span><strong>Données de progression :</strong> exercices effectués, scores, temps de session, XP, badges obtenus.</span></div>
          <div className="flex gap-2"><span className="text-green-600 font-bold">→</span><span><strong>Données techniques :</strong> adresse IP, navigateur, système d'exploitation, cookies de session.</span></div>
          <div className="flex gap-2"><span className="text-green-600 font-bold">→</span><span><strong>Contenu généré :</strong> messages dans la communauté, réponses aux exercices.</span></div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Finalités du traitement</h2>
        <p className="text-sm text-gray-600 mb-3">Vos données sont utilisées pour :</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Fournir et personnaliser votre expérience d'apprentissage</li>
          <li>Calculer votre progression, XP, streak et classement</li>
          <li>Générer des recommandations pédagogiques adaptées à votre profil</li>
          <li>Assurer la sécurité et le bon fonctionnement de la plateforme</li>
          <li>Vous envoyer des notifications liées à votre activité (avec votre accord)</li>
          <li>Améliorer nos contenus et algorithmes pédagogiques</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Conservation des données</h2>
        <p className="text-sm text-gray-600">
          Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de votre compte, vos données personnelles sont effacées dans un délai de 30 jours, à l'exception des données anonymisées utilisées à des fins statistiques.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Partage des données</h2>
        <p className="text-sm text-gray-600 mb-3">
          Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées uniquement avec :
        </p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li><strong>Supabase</strong> (stockage et authentification — serveurs EU/US)</li>
          <li><strong>Groq / OpenAI</strong> (génération de contenu IA — données anonymisées)</li>
          <li><strong>Vercel</strong> (hébergement — logs techniques uniquement)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Vos droits</h2>
        <p className="text-sm text-gray-600 mb-3">Conformément à la loi sénégalaise sur la protection des données personnelles (Loi n° 2008-12), vous disposez des droits suivants :</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement (« droit à l'oubli »)</li>
          <li>Droit à la portabilité</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">
          Pour exercer ces droits, contactez-nous à : <strong>privacy@terangalearn.sn</strong>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Cookies</h2>
        <p className="text-sm text-gray-600">
          Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement de la plateforme (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Mineurs</h2>
        <p className="text-sm text-gray-600">
          TerangaLearn est destiné aux élèves du secondaire (à partir de 13 ans). Les utilisateurs de moins de 15 ans doivent obtenir l'accord d'un parent ou tuteur légal avant de s'inscrire. Nous ne collectons pas sciemment de données concernant des enfants de moins de 13 ans.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Contact</h2>
        <p className="text-sm text-gray-600">
          Pour toute question relative à cette politique : <strong>privacy@terangalearn.sn</strong><br />
          Responsable du traitement : François Codé Diène — ODION Technologie, Dakar, Sénégal
        </p>
      </section>
    </article>
  )
}
