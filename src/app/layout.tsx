import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TerangaLearn — Réussis ton BFEM et ton BAC',
  description: 'La plateforme éducative de référence pour les élèves sénégalais',
  manifest: '/manifest.json',
  themeColor: '#1A7A4A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}