import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import NavidadPuebloClient from './NavidadPuebloClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
