import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubSection,
  GestionHubSectionTone,
} from '../_components/GestionHub';
import {
  GestionHubModernCard,
  ModernIconKey,
  ModernTone,
} from '../_components/GestionHubModern';

type Item = {
  href: string;
  title: string;
  description: string;
  iconKey: ModernIconKey;
  tone: ModernTone;
  badge?: string;
};

type Seccion = {
  title: string;
  subtitle?: string;
  tone: GestionHubSectionTone;
  items: Item[];
};

// IMPORTANTE: cada `iconKey` aparece como mucho UNA VEZ en toda esta página.
// El icono `metrics` se reutiliza en /gestion/pueblos/[slug] (Métricas) para
// dar identidad visual coherente a los datos.
const SECCIONES: Seccion[] = [
  {
    title: 'Web pública y contenidos globales',
    subtitle: 'Portada, vídeos, rutas y todo lo que se publica a escala nacional.',
    tone: 'warm',
    items: [
      { href: '/gestion/asociacion/home',           title: 'Configuración del Home',  description: 'Banners y bloques de la página principal',                       iconKey: 'home',           tone: 'amber'   },
      { href: '/gestion/asociacion/videos',         title: 'Videos de la asociación', description: 'Videos para la home (YouTube o subidos a R2)',                  iconKey: 'cinema',         tone: 'violet'  },
      { href: '/gestion/asociacion/rutas',          title: 'Rutas',                   description: 'Multiexperiencias y rutas turísticas',                          iconKey: 'routes',         tone: 'emerald' },
      { href: '/gestion/asociacion/contenidos',     title: 'Contenidos',              description: 'Páginas, noticias y eventos globales',                          iconKey: 'newspaper',      tone: 'rose'    },
      { href: '/gestion/asociacion/notificaciones', title: 'Notificaciones',          description: 'Noticias, eventos y alertas en un solo listado',                iconKey: 'bell',           tone: 'sky'     },
      { href: '/gestion/asociacion/alertas',        title: 'Alertas globales',        description: 'Avisos visibles a nivel nacional',                              iconKey: 'alertTriangle',  tone: 'red',     badge: 'Urgente' },
      { href: '/gestion/asociacion/colecciones',    title: 'Colecciones',             description: 'Páginas temáticas de /descubre · incluye Hero y SEO',           iconKey: 'layers',         tone: 'orange'  },
      { href: '/gestion/asociacion/mi-cuenta-usuarios', title: 'Mi Cuenta (usuarios)', description: 'Iconos y avatares que ven los usuarios en /mi-cuenta',          iconKey: 'pencil',         tone: 'pink'    },
    ],
  },
  {
    title: 'Club, negocio y app',
    subtitle: 'Socios, recursos, comercios locales, tienda online y la app móvil.',
    tone: 'violet',
    items: [
      { href: '/gestion/asociacion/club',                title: 'El Club de los más Bonitos',          description: 'Configuración del club y socios',                                iconKey: 'members',        tone: 'violet'  },
      { href: '/gestion/asociacion/recursos-turisticos', title: 'RRTT y RRNN Mapa',       description: 'Mapa unificado de RRTT y recursos naturales (asociación y pueblos) con filtros',  iconKey: 'castle',         tone: 'stone'   },
      { href: '/gestion/asociacion/gamificacion',        title: 'Gamificación',            description: 'Puntos del Club por cada acción · solo admin',                   iconKey: 'sparkles',       tone: 'fuchsia' },
      { href: '/gestion/asociacion/negocios',            title: 'Negocios',                description: 'Hoteles, restaurantes, casas rurales y comercios',               iconKey: 'storefront',     tone: 'teal'    },
      { href: '/gestion/asociacion/selection',           title: 'Selection · Candidaturas', description: 'Solicitudes de adhesión al programa Club LPMBE Selection',       iconKey: 'starShield',     tone: 'amber',  badge: 'Premium' },
      { href: '/gestion/asociacion/negocios-selection',  title: 'Selection · Negocios',     description: 'Establecimientos Selection ya activos, en cualquier lugar de España', iconKey: 'starShield',     tone: 'amber',  badge: 'Premium' },
      { href: '/gestion/asociacion/tienda',              title: 'Tienda',                  description: 'Productos, pedidos y promociones online',                        iconKey: 'cart',           tone: 'orange'  },
      { href: '/gestion/asociacion/app',                 title: 'App',                     description: 'Pop-ups y ofertas en la app móvil',                              iconKey: 'phoneApp',       tone: 'cyan'    },
    ],
  },
  {
    title: 'Comunicación y prensa',
    subtitle: 'Envíos, medios y boletines.',
    tone: 'coral',
    items: [
      { href: '/gestion/asociacion/notas-prensa-newsletter', title: 'Notas de prensa y Newsletter', description: 'Envíos masivos, segmentación y métricas',           iconKey: 'megaphone',     tone: 'fuchsia' },
      { href: '/gestion/asociacion/prensa-medios',           title: 'Prensa y Medios',              description: 'Comunicados, kit de prensa y medios externos',      iconKey: 'microphone',    tone: 'rose'    },
      { href: '/gestion/asociacion/newsletters',             title: 'Newsletters',                  description: 'Ediciones (PDF, Canva) y suscriptores',             iconKey: 'envelope',      tone: 'sky'     },
      { href: '/gestion/asociacion/rrss',                    title: 'RRSS — Solicitudes de negocios', description: 'Cola del community manager: stories, posts y reels solicitados por negocios', iconKey: 'cinema', tone: 'rose', badge: 'Nuevo' },
      { href: '/gestion/asociacion/grandes-eventos',         title: 'Grandes eventos',              description: 'Asambleas, encuentros internacionales y otros eventos con acreditaciones · programa, pueblos, avisos y fotos en vivo', iconKey: 'megaphone', tone: 'amber', badge: 'Nuevo' },
    ],
  },
  {
    title: 'Documentación interna',
    subtitle: 'Referencia técnica para el equipo de gestión.',
    tone: 'sky',
    items: [
      { href: '/gestion/asociacion/mapa-paginas', title: 'Mapa de páginas y datos', description: 'Cada página pública, de dónde salen los datos y qué hace falta para que aparezca', iconKey: 'sitemap', tone: 'sky' },
    ],
  },
  {
    title: 'Inteligencia artificial',
    subtitle: 'Fábrica de agentes IA conectada a Vercel AI Gateway.',
    tone: 'violet',
    items: [
      { href: '/gestion/agentes', title: 'Agentes IA', description: 'Centro de control: registry de agentes, ejecuciones, presupuesto, bandeja de pendientes y costes.', iconKey: 'agentBot', tone: 'violet', badge: 'Nuevo' },
      { href: '/gestion/asociacion/subvenciones', title: 'Subvenciones asociación', description: 'Convocatorias del Estado y europeas detectadas por el Sabueso de Subvenciones · filtro IA, plazos, importes y estado de tramitación.', iconKey: 'coins', tone: 'amber', badge: 'Nuevo' },
    ],
  },
  {
    title: 'Archivos, datos y marca',
    subtitle: 'Logos, fototeca, métricas y páginas legales.',
    tone: 'slate',
    items: [
      { href: '/gestion/asociacion/logos-ayuntamientos',     title: 'Logos de Ayuntamientos',  description: 'Logos de alcaldes para el constructor y eventos',         iconKey: 'cityHall',   tone: 'stone'  },
      { href: '/gestion/asociacion/fotos',                   title: 'Fotos',                   description: 'Galerías, POIs, multiexperiencias, eventos y contenidos', iconKey: 'photo',      tone: 'pink'   },
      // Mismo iconKey "metrics" que se usa en /gestion/pueblos/[slug]
      { href: '/gestion/asociacion/datos',                   title: 'Datos',                   description: 'Métricas, clientes y suscriptores',                       iconKey: 'metrics',    tone: 'indigo' },
      { href: '/gestion/asociacion/datos/premios',           title: '10 Premios',              description: 'Ranking anual · 126 posiciones por categoría',            iconKey: 'trophy',     tone: 'amber'  },
      { href: '/gestion/asociacion/datos/reports-mensuales', title: 'Reports mensuales',       description: 'Resumen mensual a alcaldes · histórico y reenvíos',       iconKey: 'reportMail', tone: 'orange' },
      { href: '/gestion/asociacion/ajustes',                 title: 'Ajustes de marca y logos',description: 'Logo del sitio, header/footer y biblioteca',              iconKey: 'cog',        tone: 'slate'  },
      { href: '/gestion/asociacion/el-sello',                title: 'El Sello (CMS)',          description: 'Páginas y contenidos de El Sello',                        iconKey: 'ribbon',     tone: 'yellow' },
      { href: '/gestion/asociacion/el-sello/documentos',     title: 'Documentos',              description: 'PDFs (Estatutos, Carta de Calidad)',                      iconKey: 'fileDoc',    tone: 'lime'   },
      { href: '/gestion/asociacion/contacto-privacidad',     title: 'Contacto, privacidad y otros', description: 'Contacto y páginas estáticas (privacidad, legal, cookies)', iconKey: 'inbox', tone: 'teal' },
    ],
  },
  {
    title: 'Campañas estacionales',
    subtitle: 'Eventos de la red con calendario propio.',
    tone: 'festive',
    items: [
      { href: '/gestion/asociacion/noche-romantica', title: 'La Noche Romántica', description: 'Configuración del evento y pueblos participantes', iconKey: 'nocheRomantica', tone: 'romance' },
      { href: '/gestion/asociacion/semana-santa',    title: 'Semana Santa',       description: 'Año, días y pueblos participantes',                iconKey: 'cross',     tone: 'stone'   },
      { href: '/gestion/asociacion/navidad',         title: 'Navidad',            description: 'Mercadillos, belenes, cabalgatas y eventos',       iconKey: 'pineTree',  tone: 'holiday' },
    ],
  },
];

/**
 * Cuenta novedades de subvenciones (relevancia ALTA detectadas en los
 * últimos 7 días) para mostrar un badge dinámico en la tarjeta.
 * Falla en silencio: si el backend no responde, simplemente no hay badge.
 */
async function fetchNovedadesSubvenciones(): Promise<number> {
  try {
    const token = await getToken();
    if (!token) return 0;
    const res = await fetch(
      `${getApiUrl()}/admin/subvenciones/novedades/count`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return 0;
    const json = (await res.json()) as { count?: number };
    return typeof json.count === 'number' ? json.count : 0;
  } catch {
    return 0;
  }
}

export default async function GestionAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  // Solo ADMIN ve novedades de subvenciones (la sección /subvenciones
  // requiere ADMIN; para EDITOR no tiene sentido teaser-ear el badge).
  const novedadesSubvenciones =
    me.rol === 'ADMIN' ? await fetchNovedadesSubvenciones() : 0;

  // Reemplazar el badge fijo "Nuevo" de la tarjeta de subvenciones por uno
  // dinámico: "X nuevas" cuando hay novedades en los últimos 7 días.
  const seccionesConNovedades: Seccion[] = SECCIONES.map((sec) => ({
    ...sec,
    items: sec.items.map((item) =>
      item.href === '/gestion/asociacion/subvenciones' &&
      novedadesSubvenciones > 0
        ? {
            ...item,
            badge:
              novedadesSubvenciones === 1
                ? '1 nueva'
                : `${novedadesSubvenciones} nuevas`,
          }
        : item,
    ),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GestionHubHero
        title="Gestión · Asociación"
        subtitle="Herramientas nacionales de la red. Tarjetas con icono propio y código de color para localizar la sección de un vistazo."
      />

      {seccionesConNovedades.map((sec) => (
        <GestionHubSection key={sec.title} title={sec.title} subtitle={sec.subtitle} tone={sec.tone}>
          {sec.items.map((item) => (
            <GestionHubModernCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              iconKey={item.iconKey}
              tone={item.tone}
              badge={item.badge}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion">Volver al índice de gestión</GestionHubFooterLink>
    </main>
  );
}
