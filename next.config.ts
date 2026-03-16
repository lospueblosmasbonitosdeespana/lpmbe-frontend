import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        source: '/tag/:path*',
        destination: '/actualidad',
        permanent: true,
      },
      {
        source: '/categoria/:path*',
        destination: '/actualidad',
        permanent: true,
      },
      {
        source: '/categoria-producto/:path*',
        destination: '/tienda',
        permanent: true,
      },
      {
        source: '/producto/:path*',
        destination: '/tienda',
        permanent: true,
      },
      {
        source: '/author/:path*',
        destination: '/actualidad',
        permanent: true,
      },
      {
        source: '/tiendapueblos/:path*',
        destination: '/tienda',
        permanent: true,
      },
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
