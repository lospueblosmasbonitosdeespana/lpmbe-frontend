import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import {
  IconContenidos,
  IconAlertas,
  IconSemaforo,
  IconClub,
  IconFotos,
  IconDescripcion,
  IconCifras,
  IconPois,
  IconMultiexperiencias,
  IconAutorizados,
  IconVideos,
  IconWebcam,
  IconRRSS,
  IconMetricas,
  IconServiciosVisitante,
  IconLogos,
  IconCorazonEvento,
  IconCruzEvento,
  IconPinoNavidad,
} from '../../_components/GestionIcons';
import {
  GestionHubBackLink,
  GestionHubCard,
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubSection,
} from '../../_components/GestionHub';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

type Accion = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export default async function GestionPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  let puebloNombre = slug;
  let puebloId: number | null = null;
  try {
    let pueblo;
    try {
      pueblo = await getPuebloBySlug(slug);
    } catch (_first) {
      await new Promise((r) => setTimeout(r, 800));
      pueblo = await getPuebloBySlug(slug);
    }
    puebloNombre = pueblo?.nombre ?? slug;
    puebloId = pueblo?.id ?? null;
  } catch (_e) {
    puebloNombre = slug;
  }

  const baseUrl = `/gestion/pueblos/${slug}`;
  const contenidosUrl = puebloId
    ? `/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`
    : '#';

  const secciones: { title: string; subtitle?: string; items: Accion[] }[] = [
    {
      title: 'Identidad y contenidos',
      subtitle: 'Marca del ayuntamiento, textos y páginas del pueblo en la web.',
      items: [
        {
          href: `${baseUrl}/logo-papeleria`,
          title: 'Logo y papelería',
          description: 'Logotipos del ayuntamiento y documentos descargables',
          icon: <IconLogos />,
        },
        {
          href: contenidosUrl,
          title: 'Contenidos',
          description: 'Páginas, noticias y eventos del pueblo',
          icon: <IconContenidos />,
          disabled: !puebloId,
        },
        {
          href: `${baseUrl}/descripcion`,
          title: 'Información y descripción',
          description: 'Coordenadas, textos y descripciones',
          icon: <IconDescripcion />,
        },
        {
          href: `${baseUrl}/en-cifras`,
          title: 'En cifras',
          description: 'Datos y estadísticas del municipio',
          icon: <IconCifras />,
        },
      ],
    },
    {
      title: 'Comunicación con el visitante',
      subtitle: 'Avisos, afluencia y redes: lo que el turista ve al planificar la visita.',
      items: [
        {
          href: `${baseUrl}/alertas`,
          title: 'Alertas',
          description: 'Avisos y alertas del municipio',
          icon: <IconAlertas />,
        },
        {
          href: `${baseUrl}/semaforo`,
          title: 'Semáforo',
          description: 'Estado turístico y aforo',
          icon: <IconSemaforo />,
        },
        {
          href: `${baseUrl}/rrss`,
          title: 'Redes sociales',
          description: 'Instagram, Facebook, X, YouTube, TikTok y web',
          icon: <IconRRSS />,
        },
      ],
    },
    {
      title: 'Imagen y vídeo',
      subtitle: 'Medios en la ficha pública del pueblo.',
      items: [
        {
          href: `${baseUrl}/fotos`,
          title: 'Fotos del pueblo',
          description: 'Galería e imágenes destacadas',
          icon: <IconFotos />,
        },
        {
          href: `${baseUrl}/videos`,
          title: 'Videos',
          description: 'Enlaces a YouTube y videos del pueblo',
          icon: <IconVideos />,
        },
        {
          href: `${baseUrl}/webcam`,
          title: 'Webcam',
          description: 'Webcams en directo del pueblo',
          icon: <IconWebcam />,
        },
      ],
    },
    {
      title: 'Mapa, puntos de interés y servicios',
      subtitle: 'POIs en el mapa frente a equipamientos para el visitante (parking, oficina, WC…).',
      items: [
        {
          href: `${baseUrl}/pois`,
          title: 'POIs',
          description: 'Puntos de interés en el mapa',
          icon: <IconPois />,
        },
        {
          href: `${baseUrl}/servicios`,
          title: 'Servicios del visitante',
          description: 'Lavabos, parking, turismo, pipicán, caravanas…',
          icon: <IconServiciosVisitante />,
        },
        {
          href: `${baseUrl}/multiexperiencias`,
          title: 'Multiexperiencias',
          description: 'Rutas y experiencias',
          icon: <IconMultiexperiencias />,
        },
      ],
    },
    {
      title: 'Club y analítica',
      subtitle: 'Programa de socios y métricas de la ficha.',
      items: [
        {
          href: `${baseUrl}/club`,
          title: 'Club de Amigos',
          description: 'Métricas y recursos del club',
          icon: <IconClub />,
        },
        {
          href: `${baseUrl}/metricas`,
          title: 'Métricas',
          description: 'Visitas, valoraciones y analítica web del pueblo',
          icon: <IconMetricas />,
          disabled: !puebloId,
        },
      ],
    },
    {
      title: 'Campañas y fechas señaladas',
      subtitle: 'Participación en iniciativas de la red.',
      items: [
        {
          href: `${baseUrl}/noche-romantica`,
          title: 'La Noche Romántica',
          description: 'Gestiona tu participación en La Noche Romántica',
          icon: <IconCorazonEvento />,
        },
        {
          href: `${baseUrl}/semana-santa`,
          title: 'Semana Santa',
          description: 'Cartel, agenda y días de procesiones del pueblo',
          icon: <IconCruzEvento />,
        },
        {
          href: `${baseUrl}/navidad`,
          title: 'Navidad',
          description: 'Mercadillos, belenes, cabalgatas y eventos navideños',
          icon: <IconPinoNavidad />,
        },
      ],
    },
    {
      title: 'Equipo y permisos',
      subtitle: 'Quién puede editar este pueblo.',
      items: [
        {
          href: `${baseUrl}/autorizados`,
          title: 'Autorizados',
          description: 'Usuarios que pueden gestionar el pueblo',
          icon: <IconAutorizados />,
        },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GestionHubBackLink href="/gestion/mis-pueblos">Volver a todos los pueblos</GestionHubBackLink>

      <GestionHubHero
        title="Gestión del pueblo"
        subtitle={
          <>
            <span className="font-medium text-foreground">{puebloNombre}</span>
            {' · '}
            Elige una sección para ir más rápido a lo que necesitas editar.
          </>
        }
      />

      {!puebloId && (
        <div className="-mt-4 mb-8 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          No se pudo obtener el ID del pueblo. Algunas acciones pueden no estar disponibles.
        </div>
      )}

      {secciones.map((sec) => (
        <GestionHubSection key={sec.title} title={sec.title} subtitle={sec.subtitle}>
          {sec.items.map((item) => (
            <GestionHubCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              disabled={item.disabled}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion/mis-pueblos">Volver a todos los pueblos</GestionHubFooterLink>
    </main>
  );
}
