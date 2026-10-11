import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — TerangaLearn',
}

export default function MentionsLegales() {
  return (
    <article className="prose prose-sm sm:prose max-w-none">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentions légales</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : octobre 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Éditeur du site</h2>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-600 space-y-1">
          <p><strong>Dénomination :</strong> ODION Technologie</p>
          <p><strong>Forme :</strong> Entreprise individuelle</p>
          <p><strong>Responsable de publication :</strong> François Codé Diène</p>
          <p><strong>Adresse :</strong> Dakar, Sénégal</p>
          <p><strong>Contact :</strong> contact@terangalearn.sn</p>
          <p><strong>NINEA :</strong> enregistré auprès des autorités sénégalaises compétentes</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Hébergement</h2>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-600 space-y-1">
          <p><strong>Hébergeur :</strong> Vercel Inc.</p>
          <p><strong>Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
          <p><strong>Site :</strong> <a href="https://vercel.com" target="_blank" rel="noopener" className="text-green-700">vercel.com</a></p>
          <p><strong>Base de données :</strong> Supabase Inc., San Francisco, CA, États-Unis</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Propriété intellectuelle</h2>
        <p className="text-sm text-gray-600">
          L'ensemble du contenu de la plateforme TerangaLearn — textes, cours, exercices, illustrations, logo et architecture — est la propriété exclusive d'ODION Technologie, sauf mention contraire. Toute reproduction, représentation, modification ou exploitation sans autorisation préalable écrite est strictement interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Limitation de responsabilité</h2>
        <p className="text-sm text-gray-600">
          TerangaLearn met tout en œuvre pour fournir des contenus pédagogiques de qualité, mais ne peut garantir l'exhaustivité ou l'exactitude de toutes les informations. L'utilisation de la plateforme se fait sous la responsabilité de l'utilisateur. TerangaLearn ne saurait être tenu responsable de tout dommage direct ou indirect lié à l'utilisation du service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Droit applicable</h2>
        <p className="text-sm text-gray-600">
          Les présentes mentions légales sont régies par le droit sénégalais. En cas de litige, les tribunaux compétents de Dakar seront saisis.
        </p>
      </section>
    </article>
  )
}
