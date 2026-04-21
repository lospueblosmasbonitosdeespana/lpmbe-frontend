import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from '@/lib/seo';
import JsonLd from '@/app/components/seo/JsonLd';

export const revalidate = 60;

type Multiexperiencia = {
  id: number;
  titulo: string;
  slug: string;
  foto: string | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
    provincia?: string;
    comunidad?: string;
  } | null;
  totalPueblos?: number;
  totalPois?: number;
};

async function getMultiexperiencias(locale?: string): Promise<Multiexperiencia[]> {
  try {
    const base = getApiUrl();
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
    const res = await fetch(`${base}/public/multiexperiencias${qs}`, {
      headers: locale ? { 'Accept-Language': locale } : undefined,
    });

    if (!res.ok) {
      console.warn(`[MULTIEXPERIENCIAS] Backend respondió ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[MULTIEXPERIENCIAS] Error:', error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const path = '/multiexperiencias';
  const title = seoTitle(tSeo('multiexperienciasListTitle'));
  const description = seoDescription(tSeo('multiexperienciasListDesc'));

  // Primera MX con foto como og:image representativa
  const items = await getMultiexperiencias(locale);
  const firstFoto = items.map((m) => m.foto).find((f): f is string => Boolean(f)) ?? null;
  const ogImages = firstFoto ? [{ url: firstFoto }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: items.length > 0, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: 'website',
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(firstFoto ? { images: [firstFoto] } : {}),
    },
  };
}

export default async function MultiexperienciasPage() {
  const locale = await getLocale();
  const items = await getMultiexperiencias(locale);

  const byCCAA = items.reduce((acc, item) => {
    const ccaa = item.pueblo?.comunidad ?? 'Sin comunidad';
    acc[ccaa] = acc[ccaa] || [];
    acc[ccaa].push(item);
    return acc;
  }, {} as Record<string, Multiexperiencia[]>);

  const comunidades = Object.keys(byCCAA).sort((a, b) => a.localeCompare(b, 'es'));

  const base = getBaseUrl();
  const pageUrl = `${base}/multiexperiencias`;
  const firstFoto = items.map((m) => m.foto).find((f): f is string => Boolean(f)) ?? null;

  const collectionLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Multiexperiencias · Los Pueblos Más Bonitos de España',
    description:
      'Directorio de experiencias y rutas autoguiadas en los pueblos más bonitos de España.',
    url: pageUrl,
    inLanguage: locale,
    ...(firstFoto ? { image: firstFoto } : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Los Pueblos Más Bonitos de España',
      url: base,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 100).map((m, i) => {
        const href = m.pueblo?.slug && m.slug
          ? `${base}/pueblos/${m.pueblo.slug}/experiencias/${m.slug}`
          : null;
        return {
          '@type': 'ListItem',
          position: i + 1,
          ...(href ? { url: href } : {}),
          name: m.titulo,
          ...(m.foto ? { image: m.foto } : {}),
        };
      }),
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: base },
      { '@type': 'ListItem', position: 2, name: 'Multiexperiencias', item: pageUrl },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Multiexperiencias en los pueblos más bonitos de España</h1>
        <p className="mt-2 text-gray-600">
          Descubre experiencias únicas organizadas por los pueblos más bonitos de España
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No hay multiexperiencias disponibles</p>
        </div>
      ) : (
        <div className="space-y-12">
          {comunidades.map((ccaa) => {
            const itemsCCAA = byCCAA[ccaa];
            
            return (
              <section key={ccaa}>
                {/* Heading por CCAA */}
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-neutral-200">
                  {ccaa}
                </h2>

                {/* Grid de cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {itemsCCAA.map((item) => {
                    const hasValidData = item.pueblo?.slug && item.slug;
                    const href = hasValidData
                      ? `/pueblos/${item.pueblo!.slug}/experiencias/${item.slug}`
                      : item.pueblo?.slug
                      ? `/pueblos/${item.pueblo.slug}`
                      : null;

                    const CardContent = (
                      <>
                        {item.foto && (
                          <div className="h-28 w-full overflow-hidden rounded-t-lg bg-background">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.foto}
                              alt={item.titulo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="p-2.5">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                            {item.titulo}
                          </h3>
                          
                          {item.pueblo && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                              {item.pueblo.nombre}
                              {item.pueblo.provincia && ` (${item.pueblo.provincia})`}
                            </p>
                          )}
                        </div>
                      </>
                    );

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {href ? (
                          <Link href={href} className="block">
                            {CardContent}
                          </Link>
                        ) : (
                          <div className="opacity-60">{CardContent}</div>
                        )}
                      </div>
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
