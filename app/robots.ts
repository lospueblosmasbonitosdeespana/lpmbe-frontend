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
          '/tienda/pedido/',
          '/mi-cuenta',
          '/mi-cuenta/',
          '/cuenta',
          '/cuenta/',
          '/gestion',
          '/gestion/',
          '/colaborador',
          '/colaborador/',
          '/recuperar',
          '/recuperar/',
          '/checkout/',
          '/validador/',
          '/api/',
          '/auth/',
          '/feed/',
          '/*/feed/',
          '/registro',
          '/registro/',
          '/notificaciones',
          '/account/',
          '/user/',
          '/en-construccion',
          '/entrar',
          '/login-callback-app',
          '/password-reset',
          '/alertas',
          '/pueblos/*/alertas',
          '/cupones',
          '/planifica/mis-rutas',
          '/newsletter/baja',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
