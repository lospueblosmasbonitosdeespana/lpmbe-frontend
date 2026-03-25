import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';
import SemanaSantaLandingClient from './SemanaSantaLandingClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Item = {
  id: number;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  streamUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    lat?: number | null;
    lng?: number | null;
    foto_destacada: string | null;
  };
  agenda: Array<{ id: number }>;
  dias: Array<{ id: number }>;
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
    fetch(`${API}/semana-santa/config?lang=${lang}`, { cache: 'no-store' }),
    fetch(`${API}/semana-santa/pueblos?lang=${lang}`, { cache: 'no-store' }),
  ]);
  return {
    config: cfgRes.ok ? await cfgRes.json() : null,
    pueblos: pueblosRes.ok ? await pueblosRes.json() : [],
  };
}

export default async function SemanaSantaLandingPage() {
  const locale = await getLocale();
  const { config, pueblos } = await fetchData(locale);
  return <SemanaSantaLandingClient config={config} pueblos={pueblos} />;
}
