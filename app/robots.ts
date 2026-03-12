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
          '/_next/',
          '/wp-content/',
          '/wp-includes/',
          '/carrito',
          '/tienda/carrito',
          '/tienda/checkout',
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
          '/auth/',
          '/feed/',
          '/*/feed/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
