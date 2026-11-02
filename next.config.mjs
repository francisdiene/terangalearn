/** @type {import('next').NextConfig} */

// Détecte si on build pour Capacitor (app mobile)
// Usage : NEXT_EXPORT=true npm run build
const isCapacitorBuild = process.env.NEXT_EXPORT === 'true'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // En mode statique (Capacitor), next/image n'est pas supporté → unoptimized
    unoptimized: isCapacitorBuild,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dmgzqkegfwxwhntsopbq.supabase.co',
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },
  // Export statique seulement quand on build pour l'app mobile
  ...(isCapacitorBuild && {
    output: 'export',
    trailingSlash: true,
  }),
}

export default nextConfig