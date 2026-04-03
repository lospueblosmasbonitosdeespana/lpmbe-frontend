import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import {
  GestionHubBackLink,
  GestionHubCard,
  GestionHubCardAccent,
  GestionHubEmoji,
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubSection,
  GestionHubSectionTone,
} from '../../_components/GestionHub';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

type Accion = {
  href: string;
  title: string;
  description: string;
  emoji: string;
  accent: GestionHubCardAccent;
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

  const secciones: {
    title: string;
    subtitle?: string;
    tone: GestionHubSectionTone;
    items: Accion[];
  }[] = [
    {
      title: 'Identidad y contenidos',
      subtitle: 'Marca del ayuntamiento, textos y páginas del pueblo en la web.',
      tone: 'warm',
      items: [
        { href: `${baseUrl}/logo-papeleria`, title: 'Logo y papelería', description: 'Logotipos del ayuntamiento y documentos descargables', emoji: '🏷️', accent: 'amber' },
        { href: contenidosUrl, title: 'Contenidos', description: 'Páginas, noticias y eventos del pueblo', emoji: '📰', accent: 'rose', disabled: !puebloId },
        { href: `${baseUrl}/descripcion`, title: 'Información y descripción', description: 'Coordenadas, textos y descripciones', emoji: '📝', accent: 'sky' },
        { href: `${baseUrl}/en-cifras`, title: 'En cifras', description: 'Datos y estadísticas del municipio', emoji: '📊', accent: 'violet' },
      ],
    },
    {
      title: 'Comunicación con el visitante',
      subtitle: 'Avisos, afluencia y redes: lo que el turista ve al planificar la visita.',
      tone: 'coral',
      items: [
        { href: `${baseUrl}/alertas`, title: 'Alertas', description: 'Avisos y alertas del municipio', emoji: '🔔', accent: 'orange' },
        { href: `${baseUrl}/semaforo`, title: 'Semáforo', description: 'Estado turístico y aforo', emoji: '🚦', accent: 'lime' },
        { href: `${baseUrl}/rrss`, title: 'Redes sociales', description: 'Instagram, Facebook, X, YouTube, TikTok y web', emoji: '📱', accent: 'fuchsia' },
      ],
    },
    {
      title: 'Imagen y vídeo',
      subtitle: 'Medios en la ficha pública del pueblo.',
      tone: 'sky',
      items: [
        { href: `${baseUrl}/fotos`, title: 'Fotos del pueblo', description: 'Galería e imágenes destacadas', emoji: '🖼️', accent: 'pink' },
        { href: `${baseUrl}/videos`, title: 'Videos', description: 'Enlaces a YouTube y videos del pueblo', emoji: '🎬', accent: 'violet' },
        { href: `${baseUrl}/webcam`, title: 'Webcam', description: 'Webcams en directo del pueblo', emoji: '📹', accent: 'cyan' },
      ],
    },
    {
      title: 'Mapa, puntos de interés y servicios',
      subtitle: 'Lugares en el mapa y equipamientos para quien visita el pueblo.',
      tone: 'emerald',
      items: [
        { href: `${baseUrl}/pois`, title: 'POIs', description: 'Puntos de interés en el mapa', emoji: '📍', accent: 'emerald' },
        { href: `${baseUrl}/servicios`, title: 'Servicios del visitante', description: 'Lavabos, parking, turismo, pipicán, caravanas…', emoji: '🛎️', accent: 'teal' },
        { href: `${baseUrl}/multiexperiencias`, title: 'Multiexperiencias', description: 'Rutas y experiencias', emoji: '🥾', accent: 'amber' },
      ],
    },
    {
      title: 'Club y analítica',
      subtitle: 'Programa de socios y métricas de la ficha.',
      tone: 'violet',
      items: [
        { href: `${baseUrl}/club`, title: 'Club de Amigos', description: 'Métricas y recursos del club', emoji: '👥', accent: 'violet' },
        { href: `${baseUrl}/metricas`, title: 'Métricas', description: 'Visitas, valoraciones y analítica web del pueblo', emoji: '📈', accent: 'indigo', disabled: !puebloId },
      ],
    },
    {
      title: 'Campañas y fechas señaladas',
      subtitle: 'Participación en iniciativas de la red.',
      tone: 'festive',
      items: [
        { href: `${baseUrl}/noche-romantica`, title: 'La Noche Romántica', description: 'Gestiona tu participación en La Noche Romántica', emoji: '❤️', accent: 'rose' },
        { href: `${baseUrl}/semana-santa`, title: 'Semana Santa', description: 'Cartel, agenda y días de procesiones del pueblo', emoji: '✝️', accent: 'stone' },
        { href: `${baseUrl}/navidad`, title: 'Navidad', description: 'Mercadillos, belenes, cabalgatas y eventos navideños', emoji: '🎄', accent: 'green' },
      ],
    },
    {
      title: 'Equipo y permisos',
      subtitle: 'Quién puede editar este pueblo.',
      tone: 'slate',
      items: [
        { href: `${baseUrl}/autorizados`, title: 'Autorizados', description: 'Usuarios que pueden gestionar el pueblo', emoji: '🔑', accent: 'yellow' },
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
            Cada bloque tiene un matiz de color suave para localizar antes la sección; dentro, iconos claros para cada tarea.
          </>
        }
      />

      {!puebloId && (
        <div className="-mt-4 mb-8 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          No se pudo obtener el ID del pueblo. Algunas acciones pueden no estar disponibles.
        </div>
      )}

      {secciones.map((sec) => (
        <GestionHubSection key={sec.title} title={sec.title} subtitle={sec.subtitle} tone={sec.tone}>
          {sec.items.map((item) => (
            <GestionHubCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={<GestionHubEmoji emoji={item.emoji} />}
              accent={item.accent}
              disabled={item.disabled}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion/mis-pueblos">Volver a todos los pueblos</GestionHubFooterLink>
    </main>
  );
}
