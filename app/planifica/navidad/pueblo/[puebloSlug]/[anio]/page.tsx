import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  getCanonicalUrl,
  getDefaultOgImage,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  slugToTitle,
  type SupportedLocale,
} from '@/lib/seo';
import NavidadPuebloClient from '../NavidadPuebloClient';

export const revalidate = 60;

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
  participa: true;
  anio: number;
  esEdicionActiva: boolean;
  config: { anio: number; fechaInicio: string; fechaFin: string; titulo: string; subtitulo?: string };
  participante: Participante;
};

const fetchData = cache(
  async (slug: string, anio: number, locale: string): Promise<Payload | null> => {
    const API = getApiUrl();
    const lang = encodeURIComponent(locale);
    try {
      const res = await fetch(`${API}/navidad/pueblos/${slug}/${anio}?lang=${lang}`);
      if (!res.ok) return null;
      return (await res.json()) as Payload;
    } catch {
      return null;
    }
  },
);

function parseAnio(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  if (n < 2000 || n > 2100) return null;
  return n;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string }>;
}): Promise<Metadata> {
  const { puebloSlug, anio: anioRaw } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) return { robots: { index: false, follow: false } };
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const data = await fetchData(puebloSlug, anio, locale);
  const name = data?.participante.pueblo.nombre || slugToTitle(puebloSlug);
  const path = `/planifica/navidad/pueblo/${puebloSlug}/${anio}`;
  const shortPath = `/planifica/navidad/pueblo/${puebloSlug}`;

  if (!data) {
    return {
      title: seoTitle(`Navidad ${anio} en ${name}`),
      robots: { index: false, follow: true },
      alternates: { canonical: getCanonicalUrl(shortPath, locale) },
    };
  }

  const title = seoTitle(
    tSeo.has('navidadAnioTitle')
      ? tSeo('navidadAnioTitle', { nombre: name, anio })
      : `Navidad ${anio} en ${name}`,
  );
  const description = seoDescription(
    data.participante.descripcion?.trim() ||
      (tSeo.has('navidadAnioDesc')
        ? tSeo('navidadAnioDesc', { nombre: name, anio })
        : `Agenda y actividades navideñas ${anio} en ${name}.`),
  );
  const ogImage =
    data.participante.cartelUrl?.trim() ||
    data.participante.pueblo.foto_destacada?.trim() ||
    getDefaultOgImage();

  const isActive = data.esEdicionActiva;
  const canonical = getCanonicalUrl(isActive ? shortPath : path, locale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getLocaleAlternates(isActive ? shortPath : path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: getOGLocale(locale),
      type: 'article',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: !isActive, follow: true },
  };
}

export default async function NavidadPuebloAnioPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string }>;
}) {
  const { puebloSlug, anio: anioRaw } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) notFound();
  const locale = await getLocale();
  const data = await fetchData(puebloSlug, anio, locale);
  if (!data) notFound();

  return (
    <>
      {!data.esEdicionActiva && (
        <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Estás viendo el archivo de la edición <strong>Navidad {anio}</strong>. Es un
          snapshot histórico; la información no se actualiza.
        </div>
      )}
      <NavidadPuebloClient data={data} />
    </>
  );
}
