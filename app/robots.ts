import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/mi-cuenta/',
          '/cuenta/',
          '/gestion/',
          '/colaborador/',
          '/entrar',
          '/registro',
          '/recuperar/',
          '/checkout/',
          '/validador/',
          '/api/',
          // Feeds WP antiguos (404): evitar que Google los rastree
          '/feed/',
          '/*/feed/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
