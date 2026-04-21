import type { Metadata } from "next";
import { cache } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCanonicalUrl, getDefaultOgImage, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";
import NavidadPuebloClient from './NavidadPuebloClient';

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}): Promise<Metadata> {
  const { puebloSlug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const data = await fetchData(puebloSlug, locale);
  const name = data?.participante?.pueblo?.nombre || slugToTitle(puebloSlug);
  const hasData = Boolean(data?.participante?.pueblo?.slug);
  const path = `/planifica/navidad/pueblo/${puebloSlug}`;
  const title = seoTitle(tSeo('navidadTitle', { nombre: name }));
  const description = seoDescription(
    data?.participante?.descripcion?.trim() || tSeo('navidadDesc', { nombre: name }),
  );
  const ogImage = hasData
    ? data?.participante?.cartelUrl?.trim() ||
      data?.participante?.pueblo?.foto_destacada?.trim() ||
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
      type: hasData ? 'article' : 'website',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: hasData, follow: true },
  };
}

type Evento = {
  id: number;
  tipo: string;
  publicoObjetivo: string;
  titulo: string;
  descripcion: string | null;
  avisosImportantes: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  horarioApertura: string | null;
  horarioCierre: string | null;
  fotoUrl: string | null;
  youtubeUrl: string | null;
  streamUrl: string | null;
  googleMapsUrl: string | null;
  esFiestaInteresTuristico: boolean;
};

type Participante = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: string;
  pueblo: {
    id: number; nombre: string; slug: string;
    provincia: string; comunidad: string;
    lat?: number | null; lng?: number | null;
    foto_destacada: string | null;
  };
  eventos: Evento[];
};

type Payload = {
  config: { anio: number; fechaInicio: string; fechaFin: string; titulo: string; subtitulo?: string };
  participante: Participante;
};

type LandingData = {
  pueblo: { id: number; slug: string; nombre: string };
  landing: { descripcion: string | null; heroImageUrl: string | null } | null;
  edicionesDisponibles: Array<{ anio: number; cartelUrl?: string | null }>;
  edicionActiva: { anio: number; activa: boolean };
};

const fetchData = cache(async (slug: string, locale: string): Promise<Payload | null> => {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const res = await fetch(`${API}/navidad/pueblos/${slug}?lang=${lang}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.participa === false) return null;
  return data;
});

const fetchLanding = cache(async (slug: string, locale: string): Promise<LandingData | null> => {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  try {
    const res = await fetch(`${API}/navidad/pueblos/${slug}/landing?lang=${lang}`);
    if (!res.ok) return null;
    return (await res.json()) as LandingData;
  } catch {
    return null;
  }
});

export default async function NavidadPuebloPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const locale = await getLocale();
  const [data, landingData] = await Promise.all([
    fetchData(puebloSlug, locale),
    fetchLanding(puebloSlug, locale),
  ]);

  const edicionesAnteriores = (landingData?.edicionesDisponibles ?? []).filter(
    (e) => !data || e.anio !== data.config.anio,
  );

  if (!data) {
    const name = landingData?.pueblo?.nombre || slugToTitle(puebloSlug);
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border bg-muted/30 px-8 py-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">Navidad en {name}</h1>
          {landingData?.landing?.descripcion ? (
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {landingData.landing.descripcion}
            </p>
          ) : (
            <p className="text-muted-foreground">
              Este pueblo no participa actualmente en la campa&ntilde;a de Navidad.
            </p>
          )}
          {edicionesAnteriores.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Ediciones anteriores</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {edicionesAnteriores.map((e) => (
                  <Link
                    key={e.anio}
                    href={`/planifica/navidad/pueblo/${puebloSlug}/${e.anio}`}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-accent"
                  >
                    {e.anio}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link href="/planifica/navidad" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            &larr; Ver pueblos participantes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <NavidadPuebloClient data={data} />
      {(landingData?.landing?.descripcion || edicionesAnteriores.length > 0) && (
        <div className="mx-auto max-w-6xl px-6 pb-12">
          {landingData?.landing?.descripcion && (
            <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-medium">Historia y tradición</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground leading-relaxed">
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
                    href={`/planifica/navidad/pueblo/${puebloSlug}/${e.anio}`}
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
    </>
  );
}
