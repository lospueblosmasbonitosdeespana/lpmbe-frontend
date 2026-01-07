import { getApiUrl } from '../api';

export type MeteoData = {
  temp: number | null;
  code: number | null;
  wind?: number | null;
};

export async function getMeteo(lat: number, lng: number): Promise<MeteoData | null> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/meteo?lat=${lat}&lng=${lng}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      temp: data.temp ?? data.temperatura ?? null,
      code: data.code ?? data.codigo ?? null,
      wind: data.wind ?? data.viento ?? null,
    };
  } catch {
    return null;
  }
}

export function getWeatherLabel(code: number | null): string {
  if (code === null) return 'Tiempo no disponible';

  // Códigos básicos de OpenWeatherMap / similar
  const labels: Record<number, string> = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla helada',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna densa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nieve ligera',
    73: 'Nieve moderada',
    75: 'Nieve intensa',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos intensos',
    85: 'Chubascos de nieve ligeros',
    86: 'Chubascos de nieve intensos',
    95: 'Tormenta',
    96: 'Tormenta con granizo',
    99: 'Tormenta intensa con granizo',
  };

  return labels[code] ?? `Código ${code}`;
}




























