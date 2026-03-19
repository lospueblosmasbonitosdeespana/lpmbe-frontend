import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import ActualidadPuebloClient from './ActualidadPuebloClient';
import { getPuebloBySlug } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const localeSuffix = locale === "es" ? "" : ` (${locale.toUpperCase()})`;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/actualidad`;
  return {
    title: seoTitle(`Actualidad de ${name}${localeSuffix}`),
    description: seoDescription(`Noticias, eventos y novedades de ${name}.${localeSuffix}`),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
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
          <h1 className="text-3xl font-semibold">{tPueblo("h1Actualidad", { nombre: slug })}</h1>
          <p className="mt-3 text-muted-foreground">
            No se ha podido cargar la actualidad de este pueblo en este momento.
          </p>
        </div>
      </main>
    );
  }

  return (
    <ActualidadPuebloClient
      puebloId={pueblo.id}
      puebloNombre={pueblo.nombre}
      puebloSlug={pueblo.slug}
      tipo={tipo}
      modo={modo}
      h1Label={tPueblo("h1Actualidad", { nombre: pueblo.nombre })}
      h1Archivo={tPueblo("h1Archivo", { nombre: pueblo.nombre })}
    />
  );
}
