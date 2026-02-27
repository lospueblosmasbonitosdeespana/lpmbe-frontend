import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
} from '../../_components/GestionIcons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function GridCard({
  href,
  title,
  description,
  icon,
  disabled,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-muted/50 p-6 opacity-60">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary/50">
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        Acceder
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

export default async function GestionPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Resolver pueblo real (reintento una vez si falla por red/backend puntual)
  let puebloNombre = slug;
  let puebloId: number | null = null;
  try {
    let pueblo;
    try {
      pueblo = await getPuebloBySlug(slug);
    } catch (first) {
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

  const acciones = [
    {
      href: contenidosUrl,
      title: 'Contenidos',
      description: 'Páginas, noticias y eventos del pueblo',
      icon: <IconContenidos />,
      disabled: !puebloId,
    },
    {
      href: `${baseUrl}/alertas`,
      title: 'Alertas',
      description: 'Avisos y alertas del municipio',
      icon: <IconAlertas />,
      disabled: false,
    },
    {
      href: `${baseUrl}/semaforo`,
      title: 'Semáforo',
      description: 'Estado turístico y aforo',
      icon: <IconSemaforo />,
      disabled: false,
    },
    {
      href: `${baseUrl}/metricas`,
      title: 'Métricas',
      description: 'Visitas, valoraciones y analítica web del pueblo',
      icon: <IconMetricas />,
      disabled: !puebloId,
    },
    {
      href: `${baseUrl}/club`,
      title: 'Club de Amigos',
      description: 'Métricas y recursos del club',
      icon: <IconClub />,
      disabled: false,
    },
    {
      href: `${baseUrl}/fotos`,
      title: 'Fotos del pueblo',
      description: 'Galería e imágenes destacadas',
      icon: <IconFotos />,
      disabled: false,
    },
    {
      href: `${baseUrl}/videos`,
      title: 'Videos',
      description: 'Enlaces a YouTube y videos del pueblo',
      icon: <IconVideos />,
      disabled: false,
    },
    {
      href: `${baseUrl}/rrss`,
      title: 'Redes sociales',
      description: 'Instagram, Facebook, X, YouTube, TikTok y web',
      icon: <IconRRSS />,
      disabled: false,
    },
    {
      href: `${baseUrl}/webcam`,
      title: 'Webcam',
      description: 'Webcams en directo del pueblo',
      icon: <IconWebcam />,
      disabled: false,
    },
    {
      href: `${baseUrl}/descripcion`,
      title: 'Información y descripción',
      description: 'Coordenadas, textos y descripciones',
      icon: <IconDescripcion />,
      disabled: false,
    },
    {
      href: `${baseUrl}/en-cifras`,
      title: 'En cifras',
      description: 'Datos y estadísticas',
      icon: <IconCifras />,
      disabled: false,
    },
    {
      href: `${baseUrl}/pois`,
      title: 'POIs',
      description: 'Puntos de interés',
      icon: <IconPois />,
      disabled: false,
    },
    {
      href: `${baseUrl}/servicios`,
      title: 'Servicios del visitante',
      description: 'Lavabos, parking, turismo, pipicán, caravanas...',
      icon: <IconServiciosVisitante />,
      disabled: false,
    },
    {
      href: `${baseUrl}/multiexperiencias`,
      title: 'Multiexperiencias',
      description: 'Rutas y experiencias',
      icon: <IconMultiexperiencias />,
      disabled: false,
    },
    {
      href: `${baseUrl}/noche-romantica`,
      title: 'La Noche Romántica',
      description: 'Gestiona tu participación en La Noche Romántica',
      icon: <span className="text-2xl">❤️</span>,
      disabled: false,
    },
    {
      href: `${baseUrl}/autorizados`,
      title: 'Autorizados',
      description: 'Usuarios que pueden gestionar el pueblo',
      icon: <IconAutorizados />,
      disabled: false,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4">
        <Link
          href="/gestion/mis-pueblos"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Todos los pueblos
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Gestión del pueblo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pueblo: <strong>{puebloNombre}</strong>
      </p>

      {!puebloId && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo obtener el ID del pueblo. Algunas acciones pueden no estar disponibles.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {acciones.map((item) => (
          <GridCard
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
            disabled={item.disabled}
          />
        ))}
      </div>
    </main>
  );
}

