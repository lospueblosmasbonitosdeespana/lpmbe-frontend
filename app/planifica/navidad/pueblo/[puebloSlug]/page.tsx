import type { Metadata } from "next";
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";
import NavidadPuebloClient from './NavidadPuebloClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}): Promise<Metadata> {
  const { puebloSlug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const name = slugToTitle(puebloSlug);
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
    robots: { index: true, follow: true },
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
  const res = await fetch(`${API}/navidad/pueblos/${slug}?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function NavidadPuebloPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const locale = await getLocale();
  const data = await fetchData(puebloSlug, locale);
  if (!data) notFound();
  return <NavidadPuebloClient data={data} />;
}
