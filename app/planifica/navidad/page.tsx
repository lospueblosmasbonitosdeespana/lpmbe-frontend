import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';
import NavidadLandingClient from './NavidadLandingClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Evento = {
  id: number;
  tipo: string;
  publicoObjetivo: string;
  titulo: string;
  fechaInicio: string;
};

type Item = {
  id: number;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: string;
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    lat?: number | null;
    lng?: number | null;
    foto_destacada: string | null;
  };
  eventos: Evento[];
};

type Config = {
  titulo: string;
  subtitulo: string | null;
  anio: number;
  activo: boolean;
};

async function fetchData(locale: string): Promise<{ config: Config | null; pueblos: Item[] }> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const [cfgRes, pueblosRes] = await Promise.all([
    fetch(`${API}/navidad/config?lang=${lang}`, { cache: 'no-store' }),
    fetch(`${API}/navidad/pueblos?lang=${lang}`, { cache: 'no-store' }),
  ]);
  return {
    config: cfgRes.ok ? await cfgRes.json() : null,
    pueblos: pueblosRes.ok ? await pueblosRes.json() : [],
  };
}

export default async function NavidadLandingPage() {
  const locale = await getLocale();
  const { config, pueblos } = await fetchData(locale);
  return <NavidadLandingClient config={config} pueblos={pueblos} />;
}
