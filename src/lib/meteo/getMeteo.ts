export type MeteoData = {
  temp: number | null;
  code: number | null;
  wind: number | null;
  fetchedAt: Date;
};

export async function getMeteo(
  lat: number,
  lng: number
): Promise<MeteoData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // 30 minutos
    });

    if (!res.ok) {
      return {
        temp: null,
        code: null,
        wind: null,
        fetchedAt: new Date(),
      };
    }

    const data = await res.json();

    return {
      temp: data.current?.temperature_2m ?? null,
      code: data.current?.weather_code ?? null,
      wind: data.current?.wind_speed_10m ?? null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    // Si falla, devolver nulls sin throw para no tumbar SSR
    return {
      temp: null,
      code: null,
      wind: null,
      fetchedAt: new Date(),
    };
  }
}

export function getWeatherLabel(code: number | null): string {
  if (code === null) return "Meteo";

  if (code === 0) return "Despejado";
  if (code >= 1 && code <= 3) return "Poco nuboso";
  if (code >= 45 && code <= 48) return "Niebla";
  if (code >= 51 && code <= 57) return "Llovizna";
  if (code >= 61 && code <= 67) return "Lluvia";
  if (code >= 71 && code <= 77) return "Nieve";
  if (code >= 80 && code <= 82) return "Chubascos";
  if (code >= 95 && code <= 99) return "Tormenta";

  return "Meteo";
}











