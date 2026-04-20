import type { Metadata } from "next";
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";
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
  const description = seoDescription(tSeo('navidadDesc', { nombre: name }));
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

async function fetchData(slug: string, locale: string): Promise<Payload | null> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const res = await fetch(`${API}/navidad/pueblos/${slug}?lang=${lang}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.participa === false) return null;
  return data;
}

export default async function NavidadPuebloPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const locale = await getLocale();
  const data = await fetchData(puebloSlug, locale);
  if (!data) {
    const name = slugToTitle(puebloSlug);
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border bg-muted/30 px-8 py-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">Navidad en {name}</h1>
          <p className="text-muted-foreground">
            Este pueblo no participa actualmente en la campa&ntilde;a de Navidad.
          </p>
          <Link href="/planifica/navidad" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            &larr; Ver pueblos participantes
          </Link>
        </div>
      </main>
    );
  }
  return <NavidadPuebloClient data={data} />;
}
