import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import type {  Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import ServiceWorkerRegister from '@/components/ui/ServiceWorkerRegister'
import CapacitorInit from '@/components/ui/CapacitorInit'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TerangaLearn — Réussis ton BFEM et ton BAC',
  description: 'La plateforme éducative de référence pour les élèves sénégalais. Cours, exercices, coach IA et classement pour préparer le BFEM et le BAC.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'TerangaLearn — Réussis ton BFEM et ton BAC',
    description: 'La plateforme éducative de référence pour les élèves sénégalais. Cours, exercices, coach IA et classement.',
    url: 'https://terangalearn.vercel.app',
    siteName: 'TerangaLearn',
    images: [
      {
        url: '/og-image.png',
        width: 1254,
        height: 1254,
        alt: 'TerangaLearn',
      },
    ],
    locale: 'fr_SN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'TerangaLearn — Réussis ton BFEM et ton BAC',
    description: 'Cours, exercices, coach IA et classement pour préparer le BFEM et le BAC.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#1A7A4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <ServiceWorkerRegister />
    <CapacitorInit />
    {children}
  </ThemeProvider>
</body>
    </html>
  )
}