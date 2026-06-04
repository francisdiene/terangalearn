/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dmgzqkegfwxwhntsopbq.supabase.co',
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },
}

export default nextConfig