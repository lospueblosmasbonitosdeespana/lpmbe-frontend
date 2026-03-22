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
          '/wp-content/',
          '/wp-includes/',
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
          '/notificaciones',
          '/account/',
          '/user/',
          '/en-construccion',
          '/entrar',
          '/login-callback-app',
          '/password-reset',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
