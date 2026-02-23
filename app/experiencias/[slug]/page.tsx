import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, SITE_NAME, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type TematicaPage = {
  id: number;
  titulo: string;
  resumen?: string | null;
  coverUrl?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
    provincia?: string;
    comunidad?: string;
  };
};

type CategoryConfig = {
  titleKey: string;
  descKey: string;
  category: string;
  tabSlug: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  gastronomia: { titleKey: 'titleGastronomia', descKey: 'descGastronomia', category: 'GASTRONOMIA', tabSlug: 'gastronomia' },
  naturaleza: { titleKey: 'titleNaturaleza', descKey: 'descNaturaleza', category: 'NATURALEZA', tabSlug: 'naturaleza' },
  cultura: { titleKey: 'titleCultura', descKey: 'descCultura', category: 'CULTURA', tabSlug: 'cultura' },
  'en-familia': { titleKey: 'titleEnFamilia', descKey: 'descEnFamilia', category: 'EN_FAMILIA', tabSlug: 'en-familia' },
  petfriendly: { titleKey: 'titlePetfriendly', descKey: 'descPetfriendly', category: 'PETFRIENDLY', tabSlug: 'petfriendly' },
};

async function getTematicaPages(category: string, locale?: string): Promise<{ asociacion: TematicaPage | null; pueblos: TematicaPage[] }> {
  try {
    const qs = new URLSearchParams({ category });
    if (locale) qs.set('lang', locale);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/pages?${qs.toString()}`,
      { cache: 'no-store', headers: locale ? { 'Accept-Language': locale } : undefined }
    );

    if (!res.ok) {
      console.warn(`[TEMATICA ${category}] Backend respondió ${res.status}`);
      return { asociacion: null, pueblos: [] };
    }

    const data = await res.json();
    
    // Backend devuelve { asociacion, pueblos }
    const asociacion = data?.asociacion ?? null;
    const pueblos = Array.isArray(data?.pueblos) ? data.pueblos : [];
    
    return { asociacion, pueblos };
  } catch (error) {
    console.error(`[TEMATICA ${category}] Error:`, error);
    return { asociacion: null, pueblos: [] };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale() as SupportedLocale;
  const t = await getTranslations('experienciasPage');
  const config = CATEGORY_MAP[slug];
  if (!config) {
    return { title: `${SITE_NAME}` };
  }
  const title = `${t(config.titleKey)} – ${SITE_NAME}`;
  const description = t(config.descKey);
  const path = `/experiencias/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      type: 'website',
    },
  };
}

export default async function TematicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('experienciasPage');
  const config = CATEGORY_MAP[slug];

  if (!config) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-gray-600 dark:text-neutral-400">{t('categoryNotFound')}</p>
      </main>
    );
  }

  const { asociacion, pueblos } = await getTematicaPages(config.category, locale);
  const title = t(config.titleKey);
  const description = t(config.descKey);

  // Agrupar pueblos por CCAA
  const byCCAA = pueblos.reduce((acc, item) => {
    const ccaa = item.pueblo?.comunidad ?? 'Sin comunidad';
    acc[ccaa] = acc[ccaa] || [];
    acc[ccaa].push(item);
    return acc;
  }, {} as Record<string, TematicaPage[]>);

  // Ordenar comunidades alfabéticamente
  const comunidades = Object.keys(byCCAA).sort((a, b) => a.localeCompare(b, locale || 'es'));

  const isEmpty = !asociacion && pueblos.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-gray-600 dark:text-neutral-400">{description}</p>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-gray-600 dark:text-neutral-400">{t('noExperiences')}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Bloque ASOCIACIÓN (si existe) */}
          {asociacion && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-neutral-200">{t('association')}</h2>
              
              <Link
                href={`/experiencias/${slug}/asociacion`}
                className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:bg-neutral-800 dark:border-neutral-700"
              >
                {asociacion.coverUrl && asociacion.coverUrl.trim() && (
                  <div className="h-64 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asociacion.coverUrl.trim()}
                      alt={asociacion.titulo}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{asociacion.titulo}</h3>
                  {asociacion.resumen && (
                    <p className="mt-2 text-gray-600 dark:text-neutral-400">{asociacion.resumen}</p>
                  )}
                  <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">{t('readMore')}</p>
                </div>
              </Link>
            </section>
          )}

          {/* Bloques por CCAA (pueblos) */}
          {comunidades.map((ccaa) => {
            const itemsCCAA = byCCAA[ccaa];

            return (
              <section key={ccaa}>
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-neutral-200">{ccaa}</h2>

                {/* Grid de cards - 5 cols desktop, 6 en 2xl */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {itemsCCAA.map((item) => {
                    const href = `/experiencias/${slug}/pueblos/${item.pueblo!.slug}`;

                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:bg-neutral-800 dark:border-neutral-700"
                      >
                        {/* Imagen */}
                        {item.coverUrl && item.coverUrl.trim() ? (
                          <div className="h-28 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-neutral-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.coverUrl.trim()}
                              alt={item.titulo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-28 w-full rounded-t-lg bg-gray-200 dark:bg-neutral-700" />
                        )}

                        {/* Contenido */}
                        <div className="p-2.5">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-neutral-100">
                            {item.titulo}
                          </h3>

                          <p className="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                            {item.pueblo!.nombre}
                            {item.pueblo!.provincia && ` (${item.pueblo!.provincia})`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
