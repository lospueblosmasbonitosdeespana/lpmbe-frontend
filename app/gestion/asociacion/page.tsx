import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import {
  GestionHubCard,
  GestionHubCardAccent,
  GestionHubEmoji,
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubIconAlertTriangle,
  GestionHubSection,
  GestionHubSectionTone,
} from '../_components/GestionHub';

type HubIconKind = 'emoji' | 'alert';

type Item = {
  href: string;
  title: string;
  description: string;
  accent: GestionHubCardAccent;
  emoji?: string;
  hubIcon?: HubIconKind;
};

function renderHubIcon(item: Item) {
  if (item.hubIcon === 'alert') return <GestionHubIconAlertTriangle />;
  return <GestionHubEmoji emoji={item.emoji ?? '•'} />;
}

const SECCIONES: {
  title: string;
  subtitle?: string;
  tone: GestionHubSectionTone;
  items: Item[];
}[] = [
  {
    title: 'Web pública y contenidos globales',
    subtitle: 'Portada, vídeos, rutas y todo lo que se publica a escala nacional.',
    tone: 'warm',
    items: [
      { href: '/gestion/asociacion/home', title: 'Configuración del Home', description: 'Banners y bloques de la página principal', emoji: '🏠', accent: 'amber' },
      { href: '/gestion/asociacion/videos', title: 'Videos de la asociación', description: 'Videos para la home (YouTube o subidos a R2)', emoji: '🎬', accent: 'violet' },
      { href: '/gestion/asociacion/rutas', title: 'Rutas', description: 'Multiexperiencias y rutas turísticas', emoji: '🗺️', accent: 'emerald' },
      { href: '/gestion/asociacion/contenidos', title: 'Contenidos', description: 'Páginas, noticias y eventos globales', emoji: '📰', accent: 'rose' },
      { href: '/gestion/asociacion/notificaciones', title: 'Notificaciones', description: 'Noticias, eventos y alertas en un solo listado', emoji: '📋', accent: 'sky' },
      { href: '/gestion/asociacion/alertas', title: 'Alertas globales', description: 'Avisos visibles a nivel nacional', hubIcon: 'alert', accent: 'red' },
      { href: '/gestion/asociacion/colecciones', title: 'Colecciones', description: 'Páginas temáticas de Descubre: crear, activar/desactivar y ordenar', emoji: '📚', accent: 'orange' },
      { href: '/gestion/asociacion/descubre-hero', title: 'Hero y SEO de Descubre', description: 'Copy del hero, imagen de fondo, SEO y bloque introductorio editable de /descubre', emoji: '✨', accent: 'amber' },
    ],
  },
  {
    title: 'Club, negocio y app',
    subtitle: 'Socios, recursos, comercios locales, tienda online y la app móvil.',
    tone: 'violet',
    items: [
      { href: '/gestion/asociacion/club', title: 'Club de amigos', description: 'Configuración del club y socios', emoji: '👥', accent: 'violet' },
      { href: '/gestion/asociacion/recursos-turisticos', title: 'Recursos turísticos', description: 'Castillos, monasterios y otros recursos de la asociación', emoji: '🏰', accent: 'stone' },
      { href: '/gestion/asociacion/negocios', title: 'Negocios', description: 'Hoteles, restaurantes, casas rurales y comercios de los pueblos', emoji: '🏪', accent: 'teal' },
      { href: '/gestion/asociacion/selection', title: 'Selection', description: 'Candidaturas y gestión del programa Club LPMBE Selection', emoji: '⭐', accent: 'stone' },
      { href: '/gestion/asociacion/tienda', title: 'Tienda', description: 'Productos, pedidos y promociones online', emoji: '🛒', accent: 'amber' },
      { href: '/gestion/asociacion/app', title: 'App', description: 'Pop-ups y ofertas en la app móvil', emoji: '📱', accent: 'cyan' },
    ],
  },
  {
    title: 'Comunicación y prensa',
    subtitle: 'Envíos, medios y boletines.',
    tone: 'coral',
    items: [
      { href: '/gestion/asociacion/notas-prensa-newsletter', title: 'Notas de prensa y Newsletter', description: 'Envíos masivos, segmentación prensa y métricas', emoji: '📣', accent: 'fuchsia' },
      { href: '/gestion/asociacion/prensa-medios', title: 'Prensa y Medios', description: 'Comunicados, kit de prensa y medios externos', emoji: '🗞️', accent: 'rose' },
      { href: '/gestion/asociacion/newsletters', title: 'Newsletters', description: 'Ediciones (PDF, Canva) y suscriptores', emoji: '✉️', accent: 'sky' },
    ],
  },
  {
    title: 'Documentación interna',
    subtitle: 'Referencia técnica para el equipo de gestión.',
    tone: 'sky',
    items: [
      { href: '/gestion/asociacion/mapa-paginas', title: 'Mapa de páginas y datos', description: 'Cada página pública, de dónde salen los datos y qué hace falta para que aparezca', emoji: '🗂️', accent: 'sky' },
    ],
  },
  {
    title: 'Archivos, datos y marca',
    subtitle: 'Logos, fototeca, métricas y páginas legales.',
    tone: 'slate',
    items: [
      { href: '/gestion/asociacion/logos-ayuntamientos', title: 'Logos de Ayuntamientos', description: 'Logos de alcaldes para el constructor y eventos', emoji: '🏛️', accent: 'stone' },
      { href: '/gestion/asociacion/fotos', title: 'Fotos', description: 'Galerías, POIs, multiexperiencias, eventos y contenidos', emoji: '🖼️', accent: 'pink' },
      { href: '/gestion/asociacion/datos', title: 'Datos', description: 'Métricas, clientes y suscriptores', emoji: '📊', accent: 'indigo' },
      { href: '/gestion/asociacion/datos/premios', title: '10 Premios', description: 'Ranking anual de los pueblos · 126 posiciones por categoría', emoji: '🏆', accent: 'amber' },
      { href: '/gestion/asociacion/datos/reports-mensuales', title: 'Reports mensuales', description: 'Envío automático del resumen del mes a los alcaldes · Histórico y reenvíos', emoji: '📬', accent: 'orange' },
      { href: '/gestion/asociacion/ajustes', title: 'Ajustes de marca y logos', description: 'Logo del sitio, header/footer y biblioteca', emoji: '⚙️', accent: 'slate' },
      { href: '/gestion/asociacion/el-sello', title: 'El Sello (CMS)', description: 'Páginas y contenidos de El Sello', emoji: '🏅', accent: 'amber' },
      { href: '/gestion/asociacion/el-sello/documentos', title: 'Documentos', description: 'PDFs (Estatutos, Carta de Calidad)', emoji: '📄', accent: 'yellow' },
      { href: '/gestion/asociacion/contacto-privacidad', title: 'Contacto, privacidad y otros', description: 'Contacto y páginas estáticas (privacidad, legal, cookies)', emoji: '📮', accent: 'teal' },
    ],
  },
  {
    title: 'Campañas estacionales',
    subtitle: 'Eventos de la red con calendario propio.',
    tone: 'festive',
    items: [
      { href: '/gestion/asociacion/noche-romantica', title: 'La Noche Romántica', description: 'Configuración del evento y pueblos participantes', emoji: '❤️', accent: 'romance' },
      { href: '/gestion/asociacion/semana-santa', title: 'Semana Santa', description: 'Año, días y pueblos participantes', emoji: '✝️', accent: 'stone' },
      { href: '/gestion/asociacion/navidad', title: 'Navidad', description: 'Mercadillos, belenes, cabalgatas y eventos', emoji: '🎄', accent: 'holiday' },
    ],
  },
];

export default async function GestionAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GestionHubHero
        title="Gestión · Asociación"
        subtitle="Herramientas nacionales de la red. Secciones con color suave y accesos con icono claro, como en las campañas de fechas señaladas."
      />

      {SECCIONES.map((sec) => (
        <GestionHubSection key={sec.title} title={sec.title} subtitle={sec.subtitle} tone={sec.tone}>
          {sec.items.map((item) => (
            <GestionHubCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={renderHubIcon(item)}
              accent={item.accent}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion">Volver al índice de gestión</GestionHubFooterLink>
    </main>
  );
}
