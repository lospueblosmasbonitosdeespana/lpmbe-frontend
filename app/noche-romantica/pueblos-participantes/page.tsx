import type { Metadata } from "next";
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from "@/lib/seo";

export const revalidate = 60;
const PAGE_TITLE: Record<string, string> = {
  es: "Pueblos participantes en La Noche Romántica",
  en: "Participating villages in La Noche Romántica",
  fr: "Villages participants à La Noche Romántica",
  de: "Teilnehmende Dörfer an La Noche Romántica",
  pt: "Aldeias participantes em La Noche Romántica",
  it: "Borghi partecipanti a La Noche Romántica",
  ca: "Pobles participants a La Noche Romántica",
};

const PAGE_DESC: Record<string, string> = {
  es: "Consulta todos los pueblos que participan en La Noche Romántica, con actividades, restaurantes y alojamientos.",
  en: "See all villages participating in La Noche Romántica, with activities, restaurants and accommodation.",
  fr: "Consultez tous les villages participant à La Noche Romántica, avec activités, restaurants et hébergements.",
  de: "Alle teilnehmenden Dörfer an La Noche Romántica, mit Aktivitäten, Restaurants und Unterkünften.",
  pt: "Consulte todas as aldeias participantes em La Noche Romántica, com atividades, restaurantes e alojamentos.",
  it: "Scopri tutti i borghi partecipanti a La Noche Romántica, con attività, ristoranti e alloggi.",
  ca: "Consulta tots els pobles participants a La Noche Romántica, amb activitats, restaurants i allotjaments.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/noche-romantica/pueblos-participantes";
  const title = seoTitle(PAGE_TITLE[locale] ?? PAGE_TITLE.es);
  const description = seoDescription(PAGE_DESC[locale] ?? PAGE_DESC.es);
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

interface NRPuebloPublic {
  id: number;
  cartelUrl: string | null;
  titulo: string | null;
  descripcion: string | null;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  actividades: Array<{ id: number; titulo: string }>;
  negocios: Array<{ id: number; nombre: string }>;
}

interface NRConfig {
  anio: number;
  edicion: number;
  fechaEvento: string | null;
  titulo: string;
  logoUrl: string | null;
}

async function fetchData(locale: string) {
  const API_BASE = getApiUrl();
  const langParam = locale && locale !== 'es' ? `?lang=${locale}` : '';
  const [pueblosRes, configRes] = await Promise.all([
    fetch(`${API_BASE}/noche-romantica/pueblos${langParam}`),
    fetch(`${API_BASE}/noche-romantica/config${langParam}`),
  ]);

  const pueblos: NRPuebloPublic[] = pueblosRes.ok ? await pueblosRes.json() : [];
  const config: NRConfig | null = configRes.ok ? await configRes.json() : null;

  return { pueblos, config };
}

export default async function PueblosParticipantesPage() {
  const t = await getTranslations('nocheRomantica');
  const locale = await getLocale();
  const { pueblos, config } = await fetchData(locale);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-rose-50 to-white py-12 text-center dark:from-rose-950/40 dark:to-neutral-900">
        {config?.logoUrl && (
          <img
            src={config.logoUrl}
            alt={t('title')}
            className="mx-auto mb-6 h-40 md:h-48 object-contain"
          />
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          {t('pueblosParticipantes')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {config?.titulo ?? t('title')} · {config?.edicion}ª {t('edition')}
          {config?.fechaEvento && (
            <> · {new Date(config.fechaEvento + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</>
          )}
        </p>
        <Link
          href="/noche-romantica"
          className="mt-4 inline-block text-sm text-rose-600 hover:underline"
        >
          {t('backToNocheRomantica')}
        </Link>
      </section>

      {/* Grid de pueblos */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {pueblos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-muted-foreground">
              {t('noPueblosThisYear')}
            </p>
            <p className="mt-2 text-muted-foreground">
              {t('comeBackSoon')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pueblos.map((np) => {
              const imageUrl =
                np.cartelUrl || np.pueblo.foto_destacada || null;

              return (
                <Link
                  key={np.id}
                  href={`/noche-romantica/pueblos-participantes/${np.pueblo.slug}`}
                  className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-lg dark:bg-neutral-800 dark:border-neutral-700"
                >
                  {/* Imagen */}
                  <div className="relative h-56 overflow-hidden bg-background">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={np.pueblo.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-rose-50">
                        <svg
                          className="h-16 w-16 text-rose-200"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 group-hover:text-rose-600 dark:text-neutral-100">
                      {np.pueblo.nombre}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {np.pueblo.provincia}, {np.pueblo.comunidad}
                    </p>
                    {np.titulo && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {np.titulo}
                      </p>
                    )}
                    <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                      {np.actividades.length > 0 && (
                        <span>{np.actividades.length} {t('actividades')}</span>
                      )}
                      {np.negocios.length > 0 && (
                        <span>{np.negocios.length} {t('negocios')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
