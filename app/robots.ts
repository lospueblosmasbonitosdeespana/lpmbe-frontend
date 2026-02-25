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
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
