import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getApiUrl, getPuebloBySlug } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch-safe';
import { redirect } from 'next/navigation';
import {
  GestionHubBackLink,
  GestionHubFooterLink,
  GestionHubHero,
  GestionHubSection,
  GestionHubSectionTone,
} from '../../_components/GestionHub';
import {
  GestionHubModernCard,
  ModernIconKey,
  ModernTone,
} from '../../_components/GestionHubModern';

type ArchivoAdicional = { url: string; nombre: string };

type ManualWebDoc = {
  id: number;
  nombre: string;
  url: string;
  descripcion: string | null;
  tipo: string;
  archivosAdicionales?: ArchivoAdicional[] | null;
};

async function getManualesWeb(): Promise<ManualWebDoc[]> {
  try {
    const token = await getToken();
    if (!token) return [];
    const res = await fetchWithTimeout(
      `${getApiUrl()}/admin/documentos-pueblo?compartidos=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    const all = await res.json();
    if (!Array.isArray(all)) return [];
    return (all as ManualWebDoc[]).filter((d) => d?.tipo === 'MANUAL_WEB');
  } catch {
    return [];
  }
}

function contarArchivos(d: ManualWebDoc): number {
  const extras = Array.isArray(d.archivosAdicionales)
    ? d.archivosAdicionales.filter((a) => a?.url)
    : [];
  return (d.url ? 1 : 0) + extras.length;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

type Accion = {
  href: string;
  title: string;
  description: string;
  iconKey: ModernIconKey;
  tone: ModernTone;
  badge?: string;
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

  const manualesWeb = await getManualesWeb();

  const baseUrl = `/gestion/pueblos/${slug}`;
  const contenidosUrl = puebloId
    ? `/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`
    : '#';

  // IMPORTANTE: cada `iconKey` aparece como mucho UNA VEZ en esta página.
  // El icono `metrics` es el MISMO que se usa en /gestion/asociacion (Datos)
  // para mantener identidad visual de "estadísticas" en toda la red.
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
        { href: `${baseUrl}/logo-papeleria`, title: 'Logo y papelería',          description: 'Logotipos del ayuntamiento y documentos descargables',                                  iconKey: 'tagLabel',  tone: 'amber'  },
        { href: contenidosUrl,               title: 'Contenidos',                description: 'Páginas, noticias y eventos del pueblo',                                              iconKey: 'newspaper', tone: 'rose',  disabled: !puebloId },
        { href: `${baseUrl}/descripcion`,    title: 'Información y descripción', description: 'Coordenadas, textos y descripciones',                                                 iconKey: 'pencil',    tone: 'sky'    },
        { href: `${baseUrl}/en-cifras`,      title: 'En cifras',                 description: 'Datos y estadísticas del municipio',                                                  iconKey: 'barChart',  tone: 'violet' },
        { href: `${baseUrl}/caracteristicas`,title: 'Características del pueblo',description: 'Castillo, murallas, naturaleza, piscinas… para colecciones temáticas',                  iconKey: 'tower',     tone: 'orange' },
      ],
    },
    {
      title: 'Comunicación con el visitante',
      subtitle: 'Avisos, afluencia y redes: lo que el turista ve al planificar la visita.',
      tone: 'coral',
      items: [
        { href: `${baseUrl}/alertas`,   title: 'Alertas',          description: 'Avisos y alertas del municipio',           iconKey: 'alertTriangle', tone: 'red',     badge: 'Urgente' },
        { href: `${baseUrl}/semaforo`,  title: 'Semáforo',         description: 'Estado turístico y aforo',                 iconKey: 'trafficLight',  tone: 'lime'   },
        { href: `${baseUrl}/rrss`,      title: 'Redes sociales',   description: 'Instagram, Facebook, X, YouTube, TikTok y web', iconKey: 'socialChat', tone: 'fuchsia' },
      ],
    },
    {
      title: 'Imagen y vídeo',
      subtitle: 'Medios en la ficha pública del pueblo.',
      tone: 'sky',
      items: [
        { href: `${baseUrl}/fotos`,  title: 'Fotos del pueblo', description: 'Galería e imágenes destacadas',         iconKey: 'photo',  tone: 'pink'   },
        { href: `${baseUrl}/videos`, title: 'Videos',           description: 'Enlaces a YouTube y videos del pueblo', iconKey: 'cinema', tone: 'violet' },
        { href: `${baseUrl}/webcam`, title: 'Webcam',           description: 'Webcams en directo del pueblo',         iconKey: 'webcam', tone: 'slate'  },
      ],
    },
    {
      title: 'Mapa, puntos de interés y servicios',
      subtitle: 'Lugares en el mapa y equipamientos para quien visita el pueblo.',
      tone: 'emerald',
      items: [
        { href: `${baseUrl}/pois`,              title: 'POIs',                  description: 'Puntos de interés en el mapa',                       iconKey: 'pinMap',       tone: 'emerald' },
        { href: `${baseUrl}/servicios`,         title: 'Servicios del visitante', description: 'Lavabos, parking, turismo, pipicán, caravanas…',  iconKey: 'servicesPin',  tone: 'sky'     },
        { href: `${baseUrl}/multiexperiencias`, title: 'Multiexperiencias',     description: 'Rutas y experiencias',                               iconKey: 'trail',        tone: 'amber'   },
      ],
    },
    {
      title: 'Club y analítica',
      subtitle: 'Programa de socios y métricas de la ficha.',
      tone: 'violet',
      items: [
        { href: `${baseUrl}/club`,       title: 'El Club de los más Bonitos', description: 'Métricas y recursos del club',                               iconKey: 'members', tone: 'violet' },
        { href: `${baseUrl}/validador`,  title: 'Validador QR (escritorio)',  description: 'Lectura con pistola QR o teclado para alcaldes/colaboradores', iconKey: 'phoneApp', tone: 'amber'  },
        // MISMO iconKey "metrics" que se usa en /gestion/asociacion (Datos)
        { href: `${baseUrl}/metricas`,   title: 'Métricas',       description: 'Visitas, valoraciones y analítica web del pueblo', iconKey: 'metrics', tone: 'indigo', disabled: !puebloId },
      ],
    },
    {
      title: 'Campañas y fechas señaladas',
      subtitle: 'Participación en iniciativas de la red.',
      tone: 'festive',
      items: [
        { href: `${baseUrl}/noche-romantica`, title: 'La Noche Romántica', description: 'Gestiona tu participación en La Noche Romántica',  iconKey: 'heart',    tone: 'romance' },
        { href: `${baseUrl}/semana-santa`,    title: 'Semana Santa',       description: 'Cartel, agenda y días de procesiones del pueblo',  iconKey: 'cross',    tone: 'stone'   },
        { href: `${baseUrl}/navidad`,         title: 'Navidad',            description: 'Mercadillos, belenes, cabalgatas y eventos',       iconKey: 'pineTree', tone: 'holiday' },
      ],
    },
    {
      title: 'Equipo y permisos',
      subtitle: 'Quién puede editar este pueblo.',
      tone: 'slate',
      items: [
        { href: `${baseUrl}/autorizados`, title: 'Autorizados', description: 'Usuarios que pueden gestionar el pueblo', iconKey: 'key', tone: 'yellow' },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GestionHubBackLink href="/gestion/mis-pueblos">Volver a todos los pueblos</GestionHubBackLink>

      <GestionHubHero
        title="Gestión del pueblo"
        highlightTitle={puebloNombre}
        subtitle="Cada bloque agrupa tareas similares con un color de fondo distinto y un icono propio para localizar al vuelo."
      />

      {!puebloId && (
        <div className="-mt-4 mb-8 rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          No se pudo obtener el ID del pueblo. Algunas acciones pueden no estar disponibles.
        </div>
      )}

      {manualesWeb.length > 0 && (
        <section className="mb-8 rounded-2xl border border-sky-200/40 bg-sky-50/30 py-4 pl-4 pr-3 dark:border-sky-900/40 dark:bg-sky-950/20 sm:mb-10 sm:pl-5 sm:pr-4">
          <header className="mb-4 flex items-start justify-between gap-3 border-l-[3px] border-l-sky-600/45 pl-3.5">
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-foreground sm:text-sm">
                Manual y ayuda de la web
              </h2>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground/80 dark:text-foreground/90">
                Guías publicadas por la asociación para sacar el máximo partido a la plataforma.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              {manualesWeb.length}
            </span>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2">
            {manualesWeb.map((m) => {
              const n = contarArchivos(m);
              return (
                <li key={m.id}>
                  <Link
                    href={`/gestion/manuales/${m.id}?from=${encodeURIComponent(baseUrl)}`}
                    className="group flex items-center gap-3 rounded-xl border border-sky-200/60 bg-card px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400/70 hover:shadow-md dark:border-sky-900/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/70 transition-transform group-hover:scale-105 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/50">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-sky-900 dark:group-hover:text-sky-100">
                        {m.nombre}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100/80 px-2 py-0.5 font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-200">
                          {n} {n === 1 ? 'archivo' : 'archivos'}
                        </span>
                        {m.descripcion ? (
                          <span className="truncate">{m.descripcion}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600/10 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors group-hover:bg-sky-600 group-hover:text-white dark:text-sky-200">
                      Abrir
                      <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {secciones.map((sec) => (
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
              disabled={item.disabled}
            />
          ))}
        </GestionHubSection>
      ))}

      <GestionHubFooterLink href="/gestion/mis-pueblos">Volver a todos los pueblos</GestionHubFooterLink>
    </main>
  );
}
