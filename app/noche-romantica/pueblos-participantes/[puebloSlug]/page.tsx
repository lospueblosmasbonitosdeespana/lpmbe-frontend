import type { Metadata } from "next";
import { cache } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { getTranslations, getLocale } from 'next-intl/server';
import { getCanonicalUrl, getDefaultOgImage, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";
import PuebloContent, { type NRPuebloDetail, type NRConfig } from './PuebloContent';

export const revalidate = 60;

type LandingData = {
  pueblo: { id: number; slug: string; nombre: string };
  landing: { descripcion: string | null; heroImageUrl: string | null } | null;
  edicionesDisponibles: Array<{ anio: number; cartelUrl?: string | null }>;
  edicionActiva: { anio: number; activa: boolean };
};

const fetchPueblo = cache(
  async (slug: string, lang?: string): Promise<NRPuebloDetail | null> => {
    try {
      const API_BASE = getApiUrl();
      const langParam = lang && lang !== 'es' ? `?lang=${lang}` : '';
      const res = await fetch(`${API_BASE}/noche-romantica/pueblos/${slug}${langParam}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.participa === false) return null;
      return data;
    } catch {
      return null;
    }
  },
);

const fetchLanding = cache(
  async (slug: string, lang?: string): Promise<LandingData | null> => {
    try {
      const API_BASE = getApiUrl();
      const langParam = lang && lang !== 'es' ? `?lang=${lang}` : '';
      const res = await fetch(`${API_BASE}/noche-romantica/pueblos/${slug}/landing${langParam}`);
      if (!res.ok) return null;
      return (await res.json()) as LandingData;
    } catch {
      return null;
    }
  },
);

async function fetchNRConfig(): Promise<NRConfig> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/noche-romantica/app-status`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}): Promise<Metadata> {
  const { puebloSlug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const [data, landing] = await Promise.all([
    fetchPueblo(puebloSlug, locale),
    fetchLanding(puebloSlug, locale),
  ]);
  const hasData = Boolean(data?.pueblo?.slug);
  const hasLandingText = Boolean(landing?.landing?.descripcion?.trim());
  const hasArchivo = (landing?.edicionesDisponibles?.length ?? 0) > 0;
  const shouldIndex = hasData || hasLandingText || hasArchivo;

  const name =
    data?.pueblo?.nombre || landing?.pueblo?.nombre || slugToTitle(puebloSlug);
  const path = `/noche-romantica/pueblos-participantes/${puebloSlug}`;
  const title = seoTitle(tSeo('nocheRomanticaPuebloTitle', { nombre: name }));
  const description = seoDescription(
    data?.descripcion?.trim() ||
      landing?.landing?.descripcion?.trim() ||
      tSeo('nocheRomanticaPuebloDesc', { nombre: name }),
  );
  const edicionesOrdenadas = [...(landing?.edicionesDisponibles ?? [])].sort(
    (a, b) => b.anio - a.anio,
  );
  const ogImage = shouldIndex
    ? data?.cartelUrl?.trim() ||
      landing?.landing?.heroImageUrl?.trim() ||
      edicionesOrdenadas[0]?.cartelUrl?.trim() ||
      data?.pueblo?.foto_destacada?.trim() ||
      getDefaultOgImage()
    : getDefaultOgImage();
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
      type: shouldIndex ? 'article' : 'website',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: shouldIndex, follow: true },
  };
}

export default async function PuebloNocheRomanticaPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const locale = await getLocale();

  const [data, nrConfig, landingData] = await Promise.all([
    fetchPueblo(puebloSlug, locale),
    fetchNRConfig(),
    fetchLanding(puebloSlug, locale),
  ]);

  const edicionesAnteriores = (landingData?.edicionesDisponibles ?? []).filter(
    (e) => !landingData?.edicionActiva || e.anio !== landingData.edicionActiva.anio,
  );

  if (!data) {
    const name = landingData?.pueblo?.nombre || slugToTitle(puebloSlug);
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border bg-muted/30 px-8 py-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">La Noche Rom&aacute;ntica en {name}</h1>
          {landingData?.landing?.descripcion ? (
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {landingData.landing.descripcion}
            </p>
          ) : (
            <p className="text-muted-foreground">
              Este pueblo no participa actualmente en La Noche Rom&aacute;ntica.
            </p>
          )}
          {edicionesAnteriores.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Ediciones anteriores</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {edicionesAnteriores.map((e) => (
                  <Link
                    key={e.anio}
                    href={`/noche-romantica/pueblos-participantes/${puebloSlug}/${e.anio}`}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-accent"
                  >
                    {e.anio}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link href="/noche-romantica/pueblos-participantes" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            &larr; Ver pueblos participantes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <PuebloContent data={data} nrConfig={nrConfig} />

      {(landingData?.landing?.descripcion || edicionesAnteriores.length > 0) && (
        <div className="mx-auto max-w-4xl px-4 pb-12">
          {landingData?.landing?.descripcion && (
            <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-rose-900">Historia y tradición</h2>
              <p className="mt-3 whitespace-pre-line text-gray-700 leading-relaxed">
                {landingData.landing.descripcion}
              </p>
            </section>
          )}
          {edicionesAnteriores.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-medium">Ediciones anteriores</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {edicionesAnteriores.map((e) => (
                  <Link
                    key={e.anio}
                    href={`/noche-romantica/pueblos-participantes/${puebloSlug}/${e.anio}`}
                    className="inline-flex items-center rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium transition hover:bg-accent"
                  >
                    {e.anio}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
