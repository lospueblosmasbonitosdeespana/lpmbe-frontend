import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import ActualidadPuebloClient from './ActualidadPuebloClient';
import { getPuebloBySlug } from '@/lib/api';
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  uniqueH1ForLocale,
  type SupportedLocale,
} from '@/lib/seo';
import JsonLd from '@/app/components/seo/JsonLd';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  const name = pueblo?.nombre?.trim()
    || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/actualidad`;
  const title = seoTitle(tSeo("puebloActualidadTitle", { nombre: name }));
  const description = seoDescription(tSeo("puebloActualidadDesc", { nombre: name }));
  const cover = (pueblo as { foto_destacada?: string | null } | null)?.foto_destacada ?? null;
  const ogImages = cover ? [{ url: cover }] : undefined;
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: 'website',
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function ActualidadPuebloPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; modo?: string }>;
}) {
  const { slug } = await params;
  const { tipo, modo } = await searchParams;
  const locale = await getLocale();
  const tPueblo = await getTranslations("puebloPage");
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);

  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="text-3xl font-semibold">
            {uniqueH1ForLocale(tPueblo("h1Actualidad", { nombre: slug }), locale)}
          </h1>
          <p className="mt-3 text-muted-foreground">
            No se ha podido cargar la actualidad de este pueblo en este momento.
          </p>
        </div>
      </main>
    );
  }

  const base = getBaseUrl();
  const listUrl = `${base}/pueblos/${pueblo.slug}/actualidad`;
  const collectionLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Actualidad · ${pueblo.nombre}`,
    description: `Noticias, eventos y avisos de ${pueblo.nombre}.`,
    url: listUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Los Pueblos Más Bonitos de España',
      url: base,
    },
    about: {
      '@type': 'TouristAttraction',
      name: pueblo.nombre,
      url: `${base}/pueblos/${pueblo.slug}`,
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tPueblo('breadcrumbHome'), item: base },
      { '@type': 'ListItem', position: 2, name: tPueblo('breadcrumbPueblos'), item: `${base}/pueblos` },
      { '@type': 'ListItem', position: 3, name: pueblo.nombre, item: `${base}/pueblos/${pueblo.slug}` },
      { '@type': 'ListItem', position: 4, name: 'Actualidad', item: listUrl },
    ],
  };
  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <ActualidadPuebloClient
        puebloId={pueblo.id}
        puebloNombre={pueblo.nombre}
        puebloSlug={pueblo.slug}
        locale={locale}
        tipo={tipo}
        modo={modo}
        h1Label={tPueblo("h1Actualidad", { nombre: pueblo.nombre })}
        h1Archivo={tPueblo("h1Archivo", { nombre: pueblo.nombre })}
      />
    </>
  );
}
