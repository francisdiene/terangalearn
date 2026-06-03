import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-8 text-center">

        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="TerangaLearn"
            width={80}
            height={80}
            className="drop-shadow"
          />
        </div>

        <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-green" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vérifie ton email 📬
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Un lien de confirmation a été envoyé à ton adresse email.
          Clique sur le lien pour activer ton compte TerangaLearn.
        </p>

        <div className="bg-green-light rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-green font-semibold mb-2">📌 Comment faire :</p>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
            <li>Ouvre ta boîte email</li>
            <li>Cherche un email de TerangaLearn</li>
            <li>Clique sur "Confirmer mon compte"</li>
            <li>Reviens te connecter ici</li>
          </ol>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Tu n'as pas reçu l'email ? Vérifie tes spams ou{' '}
          <Link href="/register" className="text-green font-semibold hover:underline">
            réessaie l'inscription
          </Link>
        </p>

        <Link
          href="/login"
          className="block w-full py-3 bg-green text-white rounded-xl font-semibold hover:opacity-90 transition text-sm"
        >
          Aller à la connexion
        </Link>
      </div>
    </div>
  )
}