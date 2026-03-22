import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers baseline to improve technical audit coverage.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Content-Security-Policy", value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/category/rutas/',
        destination: '/rutas',
        statusCode: 301,
      },
      {
        source: '/category/rutas',
        destination: '/rutas',
        statusCode: 301,
      },
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
