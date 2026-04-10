import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ensure metadata is rendered in <head> for SEO crawlers like Screaming Frog.
  htmlLimitedBots:
    /Mediapartners-Google|Googlebot|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Screaming Frog SEO Spider/i,
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
      // Redirecciones 301: URLs antiguas de experiencias temáticas → nuevas rutas SEO
      {
        source: '/experiencias/gastronomia/pueblos/:puebloSlug',
        destination: '/que-comer/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/gastronomia/pueblos/:puebloSlug/:pageId',
        destination: '/que-comer/:puebloSlug',
        permanent: true,
      },
      // Alias /gastronomia → /que-comer (por si alguien ya enlazó la URL anterior)
      {
        source: '/gastronomia/:puebloSlug',
        destination: '/que-comer/:puebloSlug',
        permanent: true,
      },
      {
        source: '/gastronomia/:puebloSlug/:pageSlug',
        destination: '/que-comer/:puebloSlug/:pageSlug',
        permanent: true,
      },
      {
        source: '/experiencias/naturaleza/pueblos/:puebloSlug',
        destination: '/naturaleza/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/naturaleza/pueblos/:puebloSlug/:pageId',
        destination: '/naturaleza/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/cultura/pueblos/:puebloSlug',
        destination: '/cultura/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/cultura/pueblos/:puebloSlug/:pageId',
        destination: '/cultura/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/en-familia/pueblos/:puebloSlug',
        destination: '/en-familia/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/en-familia/pueblos/:puebloSlug/:pageId',
        destination: '/en-familia/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/petfriendly/pueblos/:puebloSlug',
        destination: '/petfriendly/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/petfriendly/pueblos/:puebloSlug/:pageId',
        destination: '/petfriendly/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/patrimonio/pueblos/:puebloSlug',
        destination: '/patrimonio/:puebloSlug',
        permanent: true,
      },
      {
        source: '/experiencias/patrimonio/pueblos/:puebloSlug/:pageId',
        destination: '/patrimonio/:puebloSlug',
        permanent: true,
      },
      // Redirecciones para la ruta antigua /pueblos/[slug]/categoria/[categoria]/[pageId]
      // No se redirige para no romper navegación interna, pero se añaden canonicals en las páginas
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
