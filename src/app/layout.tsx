import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import type {  Viewport } from 'next'
import { ThemeProvider } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TerangaLearn — Réussis ton BFEM et ton BAC',
  description: 'La plateforme éducative de référence pour les élèves sénégalais',
  manifest: '/manifest.json',
}

export const viewport = {
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
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    {children}
  </ThemeProvider>
</body>
    </html>
  )
}