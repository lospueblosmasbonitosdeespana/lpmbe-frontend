import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import {
  IconHome,
  IconRutas,
  IconContenidos,
  IconAlertas,
  IconClub,
  IconTienda,
  IconDatos,
  IconAjustes,
  IconSello,
  IconDocumentos,
  IconContacto,
  IconVideos,
  IconApp,
  IconNotificacionesFeed,
  IconPeriodico,
  IconComercios,
  IconLandmark,
  IconMegafono,
  IconBoletin,
  IconLogos,
  IconFotos,
  IconCorazonEvento,
  IconCruzEvento,
  IconPinoNavidad,
} from '../_components/GestionIcons';
import {
  GestionHubCard,
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubSection,
} from '../_components/GestionHub';

type Item = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const SECCIONES: { title: string; subtitle?: string; items: Item[] }[] = [
  {
    title: 'Web pública y contenidos globales',
    subtitle: 'Portada, vídeos, rutas y todo lo que se publica a escala nacional.',
    items: [
      {
        href: '/gestion/asociacion/home',
        title: 'Configuración del Home',
        description: 'Banners y bloques de la página principal',
        icon: <IconHome />,
      },
      {
        href: '/gestion/asociacion/videos',
        title: 'Videos de la asociación',
        description: 'Videos para la home (YouTube o subidos a R2)',
        icon: <IconVideos />,
      },
      {
        href: '/gestion/asociacion/rutas',
        title: 'Rutas',
        description: 'Multiexperiencias y rutas turísticas',
        icon: <IconRutas />,
      },
      {
        href: '/gestion/asociacion/contenidos',
        title: 'Contenidos',
        description: 'Páginas, noticias y eventos globales',
        icon: <IconContenidos />,
      },
      {
        href: '/gestion/asociacion/notificaciones',
        title: 'Notificaciones',
        description: 'Noticias, eventos y alertas en un solo listado',
        icon: <IconNotificacionesFeed />,
      },
      {
        href: '/gestion/asociacion/alertas',
        title: 'Alertas globales',
        description: 'Avisos visibles a nivel nacional',
        icon: <IconAlertas />,
      },
    ],
  },
  {
    title: 'Club, negocio y app',
    subtitle: 'Socios, recursos, comercios locales, tienda online y la app móvil.',
    items: [
      {
        href: '/gestion/asociacion/club',
        title: 'Club de amigos',
        description: 'Configuración del club y socios',
        icon: <IconClub />,
      },
      {
        href: '/gestion/asociacion/recursos-turisticos',
        title: 'Recursos turísticos',
        description: 'Castillos, monasterios y otros recursos de la asociación',
        icon: <IconLandmark />,
      },
      {
        href: '/gestion/asociacion/negocios',
        title: 'Negocios',
        description: 'Hoteles, restaurantes, casas rurales y comercios de los pueblos',
        icon: <IconComercios />,
      },
      {
        href: '/gestion/asociacion/tienda',
        title: 'Tienda',
        description: 'Productos, pedidos y promociones online',
        icon: <IconTienda />,
      },
      {
        href: '/gestion/asociacion/app',
        title: 'App',
        description: 'Pop-ups y ofertas en la app móvil',
        icon: <IconApp />,
      },
    ],
  },
  {
    title: 'Comunicación y prensa',
    subtitle: 'Envíos, medios y boletines: cada acceso con icono distinto para orientarte.',
    items: [
      {
        href: '/gestion/asociacion/notas-prensa-newsletter',
        title: 'Notas de prensa y Newsletter',
        description: 'Envíos masivos, segmentación prensa y métricas',
        icon: <IconMegafono />,
      },
      {
        href: '/gestion/asociacion/prensa-medios',
        title: 'Prensa y Medios',
        description: 'Comunicados, kit de prensa y medios externos',
        icon: <IconPeriodico />,
      },
      {
        href: '/gestion/asociacion/newsletters',
        title: 'Newsletters',
        description: 'Ediciones (PDF, Canva) y suscriptores',
        icon: <IconBoletin />,
      },
    ],
  },
  {
    title: 'Archivos, datos y marca',
    subtitle: 'Logos, fototeca, métricas y páginas legales.',
    items: [
      {
        href: '/gestion/asociacion/logos-ayuntamientos',
        title: 'Logos de Ayuntamientos',
        description: 'Logos de alcaldes para el constructor y eventos',
        icon: <IconLogos />,
      },
      {
        href: '/gestion/asociacion/fotos',
        title: 'Fotos',
        description: 'Galerías, POIs, multiexperiencias, eventos y contenidos',
        icon: <IconFotos />,
      },
      {
        href: '/gestion/asociacion/datos',
        title: 'Datos',
        description: 'Métricas, clientes y suscriptores',
        icon: <IconDatos />,
      },
      {
        href: '/gestion/asociacion/ajustes',
        title: 'Ajustes de marca y logos',
        description: 'Logo del sitio, header/footer y biblioteca',
        icon: <IconAjustes />,
      },
      {
        href: '/gestion/asociacion/el-sello',
        title: 'El Sello (CMS)',
        description: 'Páginas y contenidos de El Sello',
        icon: <IconSello />,
      },
      {
        href: '/gestion/asociacion/el-sello/documentos',
        title: 'Documentos',
        description: 'PDFs (Estatutos, Carta de Calidad)',
        icon: <IconDocumentos />,
      },
      {
        href: '/gestion/asociacion/contacto-privacidad',
        title: 'Contacto, privacidad y otros',
        description: 'Contacto y páginas estáticas (privacidad, legal, cookies)',
        icon: <IconContacto />,
      },
    ],
  },
  {
    title: 'Campañas estacionales',
    subtitle: 'Eventos de la red con calendario propio.',
    items: [
      {
        href: '/gestion/asociacion/noche-romantica',
        title: 'La Noche Romántica',
        description: 'Configuración del evento y pueblos participantes',
        icon: <IconCorazonEvento />,
      },
      {
        href: '/gestion/asociacion/semana-santa',
        title: 'Semana Santa',
        description: 'Año, días y pueblos participantes',
        icon: <IconCruzEvento />,
      },
      {
        href: '/gestion/asociacion/navidad',
        title: 'Navidad',
        description: 'Mercadillos, belenes, cabalgatas y eventos',
        icon: <IconPinoNavidad />,
      },
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
        subtitle="Herramientas nacionales de la red: contenidos, tienda, datos y comunicación. Las secciones agrupan tareas parecidas para que localices cada pantalla con menos esfuerzo."
      />

      {SECCIONES.map((sec) => (
        <GestionHubSection key={sec.title} title={sec.title} subtitle={sec.subtitle}>
          {sec.items.map((item) => (
            <GestionHubCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion">Volver al índice de gestión</GestionHubFooterLink>
    </main>
  );
}
