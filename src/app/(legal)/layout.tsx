import Link from 'next/link'
import Image from 'next/image'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <Image src="/logo.png" alt="TerangaLearn" width={32} height={32} className="object-contain" />
            <span className="font-bold text-green-700">TerangaLearn</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-green-700 transition"
          >
            ← Retour
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap gap-4 text-xs text-gray-400 justify-center">
          <Link href="/mentions-legales" className="hover:text-green-700 transition">Mentions légales</Link>
          <Link href="/politique-confidentialite" className="hover:text-green-700 transition">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-green-700 transition">CGU</Link>
          <span>© {new Date().getFullYear()} TerangaLearn — ODION Technologie, Dakar, Sénégal</span>
        </div>
      </footer>
    </div>
  )
}
