import { headers } from "next/headers";
import { getComunidadFlagSrc } from "@/lib/flags";
import { MeteoListingRow } from "./MeteoListingRow";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow, Headline, Lead } from "@/app/components/ui/typography";

type MeteoAlerta = {
  kind: string;
  title: string | null;
  detail: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
};

type MeteoItem = {
  pueblo: {
    id: number;
    slug: string;
    nombre: string;
    provincia: string | null;
    comunidad: string | null;
    lat: number | null;
    lng: number | null;
  };
  meteo: {
    timezone: string;
    generatedAt: string;
    current: {
      time: string;
      temperatureC: number | null;
      windKph: number | null;
      weatherCode: number | null;
    };
    daily: Array<{
      date: string;
      precipitationMm: number | null;
    }>;
  };
  acumulados?: {
    lluviaHoyMm?: number | null;
    nieveHoyCm?: number | null;
  } | null;
  alertas?: MeteoAlerta[] | null;
};

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3001";
  return `${proto}://${host}`;
}

export const dynamic = "force-dynamic";

export default async function MeteoPage() {
  const origin = await getOrigin();
  const res = await fetch(`${origin}/api/meteo/pueblos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Meteo agregada: HTTP ${res.status}`);

  const items: MeteoItem[] = await res.json();

  const sorted = items
    .slice()
    .sort((a, b) => (a.meteo.current.temperatureC ?? 9999) - (b.meteo.current.temperatureC ?? 9999));

  return (
    <main className="min-h-screen">
      {/* Header - diseño V0 (igual que app/meteo en v0-tourism-website-design) */}
      <Section background="card" spacing="lg">
        <Container size="md">
          <Eyebrow className="mb-2 block">Tiempo</Eyebrow>
          <Headline className="text-3xl md:text-4xl">Meteo</Headline>
          <Lead className="mt-2">
            Ordenado de temperatura más baja a más alta · {sorted.length} pueblos
          </Lead>
        </Container>
      </Section>

      {/* Lista - diseño V0 */}
      <Section background="default" spacing="md">
        <Container size="lg">
          <div className="space-y-2">
            {sorted.map((it) => {
              const flagSrc = getComunidadFlagSrc(it.pueblo.comunidad);
              const rowData = {
                pueblo: it.pueblo,
                meteo: {
                  current: {
                    temperatureC: it.meteo.current.temperatureC,
                    windKph: it.meteo.current.windKph,
                    weatherCode: it.meteo.current.weatherCode,
                    time: it.meteo.current.time,
                  },
                },
                acumulados: it.acumulados
                  ? {
                      lluviaHoyMm: it.acumulados.lluviaHoyMm ?? it.meteo.daily?.[0]?.precipitationMm,
                      nieveHoyCm: it.acumulados.nieveHoyCm,
                    }
                  : null,
                alertas: it.alertas ?? [],
              };
              return (
                <MeteoListingRow
                  key={it.pueblo.id}
                  data={rowData}
                  flagSrc={flagSrc}
                />
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Mostrando {sorted.length} pueblos · Datos actualizados cada hora
          </div>
        </Container>
      </Section>
    </main>
  );
}
