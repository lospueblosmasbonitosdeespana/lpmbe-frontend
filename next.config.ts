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
      {
        source: '/tienda/pack%20pins',
        destination: '/tienda/pack-pins',
        statusCode: 301,
      },
      {
        source: '/tienda/pin%20special%20edition',
        destination: '/tienda/pin-special-edition',
        statusCode: 301,
      },
      {
        source: '/tienda/pin%20pueblos%20bonitos',
        destination: '/tienda/pin-pueblos-bonitos',
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
      // Redirecciones 301: /pueblos/SLUG/paginas/PAGE → /pueblos/SLUG/categoria/CAT/PAGE
      // URLs antiguas generadas por descubre que Google ya indexó
      { source: '/pueblos/ainsa/paginas/la-morisma', destination: '/pueblos/ainsa/categoria/en-familia/la-morisma', permanent: true },
      { source: '/pueblos/anso/paginas/dia-del-traje-tradicional-ansotano', destination: '/pueblos/anso/categoria/en-familia/dia-del-traje-tradicional-ansotano', permanent: true },
      { source: '/pueblos/atienza/paginas/la-caballada', destination: '/pueblos/atienza/categoria/en-familia/la-caballada', permanent: true },
      { source: '/pueblos/banos-de-la-encina/paginas/camarin-barroco-de-la-ermita-del-cristo-del-llano', destination: '/pueblos/banos-de-la-encina/categoria/patrimonio/camarin-barroco-de-la-ermita-del-cristo-del-llano', permanent: true },
      { source: '/pueblos/betancuria/paginas/parque-rural-de-betancuria', destination: '/pueblos/betancuria/categoria/naturaleza/parque-rural-de-betancuria', permanent: true },
      { source: '/pueblos/briones/paginas/jornadas-medievales', destination: '/pueblos/briones/categoria/en-familia/jornadas-medievales', permanent: true },
      { source: '/pueblos/candelario/paginas/boda-tipica', destination: '/pueblos/candelario/categoria/en-familia/boda-tipica', permanent: true },
      // Fallback: cualquier /pueblos/SLUG/paginas/X no mapeado → ficha del pueblo
      { source: '/pueblos/:slug/paginas/:page', destination: '/pueblos/:slug', permanent: true },
      // Redirects 301: eventos con slugs "malos" generados por el bug de NFD/Unicode
      // (títulos con caracteres Mathematical Bold 𝐅𝐄𝐒𝐓𝐈𝐕𝐀𝐋 producían slugs vacíos → '-2','-3','-6'...)
      { source: '/eventos/-2', destination: '/eventos/facticias-indumentaria-tradicional-de-olivenza-en-retratos', permanent: true },
      { source: '/eventos/-3', destination: '/eventos/exposicion-del-175-aniversario-de-la-filarmonica-de-olivenza', permanent: true },
      { source: '/eventos/-4', destination: '/eventos/concierto-de-la-banda-de-musica-del-conservatorio-juan-vazquez', permanent: true },
      { source: '/eventos/-5', destination: '/eventos/concierto-del-175-aniversario-de-la-filarmonica-de-olivenza', permanent: true },
      { source: '/eventos/-6', destination: '/eventos/festival-jazz-vejer-del-25-al-27-de-junio', permanent: true },
      { source: '/eventos/-7', destination: '/eventos/festival-vejer-flamenco-del-8-al-11-de-julio', permanent: true },
    ];
  },
  images: {
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
