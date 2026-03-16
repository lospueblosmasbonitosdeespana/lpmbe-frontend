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
          '/ficha-pueblo',
          '/ficha-pueblo/',
          '/semaforo',
          '/noticias-y-eventos',
          '/experiencias-public',
          '/carrito',
          '/tienda/carrito',
          '/tienda/checkout',
          '/mi-cuenta/',
          '/cuenta/',
          '/gestion/',
          '/colaborador/',
          '/recuperar/',
          '/checkout/',
          '/validador/',
          '/api/',
          '/auth/',
          '/feed/',
          '/*/feed/',
          '/registro/',
          '/notificaciones/',
          '/entrar',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
