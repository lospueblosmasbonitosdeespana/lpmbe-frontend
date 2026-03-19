import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  metaLocaleLead,
  seoDescription,
  seoTitle,
  titleLocaleSuffix,
  type SupportedLocale,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MX_DESC: Record<string, string> = {
  es: 'Descubre experiencias únicas organizadas por los pueblos más bonitos de España.',
  en: 'Discover unique experiences organised by the most beautiful villages of Spain.',
  fr: 'Découvrez des expériences uniques organisées par les plus beaux villages d\'Espagne.',
  de: 'Entdecken Sie einzigartige Erlebnisse in den schönsten Dörfern Spaniens.',
  pt: 'Descubra experiências únicas organizadas pelos mais belos vilarejos de Espanha.',
  it: 'Scopri esperienze uniche organizzate dai borghi più belli della Spagna.',
  ca: 'Descobreix experiències úniques organitzades pels pobles més bonics d\'Espanya.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/multiexperiencias';
  const locSuf = titleLocaleSuffix(locale);
  const desc = MX_DESC[locale] ?? `${metaLocaleLead(locale)}${MX_DESC.es}`;
  return {
    title: seoTitle(`Multiexperiencias${locSuf}`),
    description: seoDescription(desc),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

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
      cache: 'no-store',
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

export default async function MultiexperienciasPage() {
  const locale = await getLocale();
  const items = await getMultiexperiencias(locale);

  // Agrupar por CCAA
  const byCCAA = items.reduce((acc, item) => {
    const ccaa = item.pueblo?.comunidad ?? 'Sin comunidad';
    acc[ccaa] = acc[ccaa] || [];
    acc[ccaa].push(item);
    return acc;
  }, {} as Record<string, Multiexperiencia[]>);

  // Ordenar comunidades alfabéticamente
  const comunidades = Object.keys(byCCAA).sort((a, b) => a.localeCompare(b, 'es'));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
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
                    // Construir href solo si tenemos los datos necesarios
                    const hasValidData = item.pueblo?.slug && item.slug;
                    const href = hasValidData
                      ? `/pueblos/${item.pueblo!.slug}/experiencias/${item.slug}`
                      : item.pueblo?.slug
                      ? `/pueblos/${item.pueblo.slug}`
                      : null;

                    const CardContent = (
                      <>
                        {/* Imagen */}
                        {item.foto && (
                          <div className="h-28 w-full overflow-hidden rounded-t-lg bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.foto}
                              alt={item.titulo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        {/* Contenido */}
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
