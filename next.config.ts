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
        statusCode: 301,
      },
      {
        source: '/categoria/:path*',
        destination: '/actualidad',
        statusCode: 301,
      },
      {
        source: '/categoria-producto/:path*',
        destination: '/tienda',
        statusCode: 301,
      },
      {
        source: '/producto/:path*',
        destination: '/tienda',
        statusCode: 301,
      },
      {
        source: '/author/:path*',
        destination: '/actualidad',
        statusCode: 301,
      },
      {
        source: '/tiendapueblos/:path*',
        destination: '/tienda',
        statusCode: 301,
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
