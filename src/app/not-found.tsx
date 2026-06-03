import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">📚</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-8">
          Cette page n'existe pas dans notre programme !
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-green text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          <BookOpen className="w-5 h-5" />
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}