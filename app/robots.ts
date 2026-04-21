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
          '/pueblos/*/categoria',
          '/pueblos/*/categoria/',
          '/cupones',
          '/planifica/mis-rutas',
          '/newsletter/baja',
          // Extensiones legacy del antiguo WordPress: ya no existen en el
          // sitio actual. El middleware las redirige a 301, pero también le
          // pedimos a Google que deje de rastrearlas para acelerar la limpieza
          // de su índice (proceso de 2-3 meses típicamente).
          '/*.html$',
          '/*.htm$',
          '/*.php$',
          '/*.asp$',
          '/*.aspx$',
          '/*.jsp$',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
