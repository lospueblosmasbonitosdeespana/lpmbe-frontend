import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      { source: '/privacidad', destination: '/c/privacidad' },
      { source: '/aviso-legal', destination: '/c/aviso-legal' },
      { source: '/cookies', destination: '/c/cookies' },
      { source: '/contacto', destination: '/c/contacto' },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lospueblosmasbonitosdeespana.org',
      },
      {
        protocol: 'https',
        hostname: 'pre.lospueblosmasbonitosdeespana.org',
      },
      {
        protocol: 'https',
        hostname: 'media.lospueblosmasbonitosdeespana.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
