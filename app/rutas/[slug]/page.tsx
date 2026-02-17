import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getRutas, getRutaById, getRutaMapa } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from "@/lib/seo";
import { sanitizeHtml, createExcerpt } from "@/lib/sanitizeHtml";
import RutaParadasConMapa from "@/app/_components/RutaParadasConMapa";

export const revalidate = 60;

type DescripcionSplit = {
  intro: string | null;
  outro: string | null;
};

function splitDescripcionIntoIntroAndOutro(descripcion: string | null): DescripcionSplit {
  if (!descripcion) return { intro: null, outro: null };

  // 1. Buscar "¡Empezamos!" como punto de corte preferido
  const empezamosIndex = descripcion.indexOf('¡Empezamos!');
  
  if (empezamosIndex !== -1) {
    // Cortar en "¡Empezamos!"
    const intro = descripcion.slice(0, empezamosIndex + '¡Empezamos!'.length);
    const resto = descripcion.slice(empezamosIndex + '¡Empezamos!'.length);
    
    // Ahora buscar el final del bloque numerado en "resto"
    const outro = extraerOutro(resto);
    
    return { intro, outro };
  }
  
  // 2. Fallback: buscar el primer "1." o "1 -" o similar
  const match = descripcion.match(/(\n|^)\s*1\.\s+/);
  
  if (match && match.index !== undefined) {
    const intro = descripcion.slice(0, match.index);
    const resto = descripcion.slice(match.index);
    const outro = extraerOutro(resto);
    
    return { intro, outro };
  }
  
  // 3. No se detectó patrón: devolver toda la descripción como intro
  return { intro: descripcion, outro: null };
}

function extraerOutro(resto: string): string | null {
  // Buscar marcadores de fin del bloque numerado
  const marcadoresFin = [
    'TIPS DE RUTA',
    'Tips de ruta',
    'CONOCE MÁS RUTAS',
    'Conoce más rutas',
    'TIPS',
    'Tips',
  ];
  
  for (const marcador of marcadoresFin) {
    const index = resto.indexOf(marcador);
    if (index !== -1) {
      // Encontrado: el outro empieza aquí
      return resto.slice(index);
    }
  }
  
  // No se encontró marcador: no hay outro
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const rutas = await getRutas(locale);
  const ruta = rutas.find((r) => r.slug === slug);
  
  if (!ruta) {
    return {
      title: "Ruta no encontrada – Los Pueblos Más Bonitos de España",
    };
  }

  const title = `${ruta.titulo} – Los Pueblos Más Bonitos de España`;
  const description = ruta.descripcion
    ? createExcerpt(ruta.descripcion, 160)
    : "Ruta turística por los pueblos más bonitos de España";
  const path = `/rutas/${ruta.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      type: "article",
      images: ruta.foto_portada
        ? [{ url: ruta.foto_portada, alt: ruta.titulo }]
        : undefined,
    },
    twitter: {
      card: ruta.foto_portada ? "summary_large_image" : "summary",
      title,
      description,
      images: ruta.foto_portada ? [ruta.foto_portada] : undefined,
    },
  };
}

export default async function RutaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("rutas");

  // 1. Resolver slug → ruta
  const rutas = await getRutas(locale);
  const rutaBasica = rutas.find((r) => r.slug === slug);

  if (!rutaBasica) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-red-600">{t("routeNotFound")}</h1>
        <Link href="/rutas" className="mt-4 inline-block text-blue-600 hover:underline">
          {t("backToRoutes")}
        </Link>
      </main>
    );
  }

  // 2. Obtener detalles completos
  const ruta = await getRutaById(rutaBasica.id, locale);
  
  // 3. Obtener paradas desde ruta.pueblos (con fallbacks)
  const paradas = Array.isArray((ruta as any)?.pueblos) 
    ? (ruta as any).pueblos 
    : Array.isArray((ruta as any)?.rutaPueblos)
    ? (ruta as any).rutaPueblos
    : Array.isArray((ruta as any)?.ruta_pueblos)
    ? (ruta as any).ruta_pueblos
    : [];
  
  // 4. Obtener mapa
  let rutaMapa;
  try {
    rutaMapa = await getRutaMapa(ruta.id, locale);
  } catch (err) {
    console.error(`Error cargando mapa de ruta ${ruta.id}:`, err);
    rutaMapa = null;
  }

  const pueblosOrdenados = rutaMapa?.pueblos ?? [];
  
  // Split de descripción (intro/outro)
  const descripcionRaw = ruta.descripcion ?? null;
  const { intro, outro } = paradas.length > 0 
    ? splitDescripcionIntoIntroAndOutro(descripcionRaw)
    : { intro: descripcionRaw, outro: null };
  
  // Limpiar "Saber más" de intro y outro ANTES de renderizar
  const introSinSaberMas = intro ? intro.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n') : null;
  const outroSinSaberMas = outro ? outro.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n') : null;
  
  const introLimpia = introSinSaberMas ? sanitizeHtml(introSinSaberMas) : null;
  const outroLimpia = outroSinSaberMas ? sanitizeHtml(outroSinSaberMas) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/rutas" className="text-blue-600 hover:underline">
          {t("backToRoutes")}
        </Link>
      </div>

      {/* Hero: título a la izquierda, logo a la derecha (encima del header) */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{ruta.titulo}</h1>
          {/* Metadatos (sin km/tiempo: se muestran correctamente en el Resumen via OSRM) */}
          <div className="mt-4 flex flex-wrap gap-3">
            {ruta.dificultad && (
              <div className="rounded-lg bg-blue-50 px-4 py-2">
                <span className="text-xs font-medium uppercase text-blue-600">Dificultad</span>
                <p className="mt-1 text-sm font-semibold text-blue-900">{ruta.dificultad}</p>
              </div>
            )}
            {ruta.tipo && (
              <div className="rounded-lg bg-green-50 px-4 py-2">
                <span className="text-xs font-medium uppercase text-green-600">Tipo</span>
                <p className="mt-1 text-sm font-semibold text-green-900">{ruta.tipo}</p>
              </div>
            )}
          </div>
        </div>
        {(ruta as any).logo?.url && (
          <div className="flex-shrink-0">
            <img
              src={(ruta as any).logo.url}
              alt={(ruta as any).logo.nombre ?? ruta.titulo}
              className="max-h-24 w-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Foto portada */}
      {ruta.foto_portada && (
        <div className="mb-8">
          <img
            src={ruta.foto_portada}
            alt={ruta.titulo}
            className="w-full rounded-lg shadow-lg"
            style={{ maxHeight: "500px", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Intro: oculto cuando hay paradas (evita duplicar texto que ya está en cada pueblo) */}
      {introLimpia && paradas.length === 0 && (
        <section className="mb-8">
          <div 
            className="prose max-w-none text-gray-700 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: introLimpia }}
          />
        </section>
      )}

      {/* Paradas + Mapa + Distancias (componente cliente) */}
      {paradas.length > 0 && (
        <RutaParadasConMapa
          paradas={paradas}
          tips={Array.isArray((ruta as any).tips) ? (ruta as any).tips : []}
          totalDistanciaKm={(ruta as any).distancia_km ?? (ruta as any).distanciaKm ?? null}
          totalTiempoEstimado={(ruta as any).tiempo_estimado ?? (ruta as any).tiempoEstimado ?? null}
        />
      )}

      {/* Tips de la ruta (tarjetas con iconos SVG) */}
      {(() => {
        const tips = Array.isArray((ruta as any).tips) ? (ruta as any).tips : [];
        if (tips.length === 0) return null;

        const svgProps = { className: "h-6 w-6", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

        const iconMap: Record<string, React.ReactNode> = {
          clock: (
            <svg {...svgProps}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          lightbulb: (
            <svg {...svgProps}>
              <path d="M9 18h6" /><path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A7 7 0 1 0 4.5 11.5c.76.76 1.23 1.52 1.41 2.5" />
            </svg>
          ),
          car: (
            <svg {...svgProps}>
              <path d="M5 17h14v-5l-2-4H7l-2 4v5z" />
              <circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
              <path d="M3 17h2" /><path d="M19 17h2" />
            </svg>
          ),
          leaf: (
            <svg {...svgProps}>
              <path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7 5 0 9 4 9 9a7 7 0 0 1-7 7Z" />
              <path d="M10 13V7.5" /><path d="M7 10h6" />
            </svg>
          ),
          calendar: (
            <svg {...svgProps}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
          utensils: (
            <svg {...svgProps}>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          ),
          bed: (
            <svg {...svgProps}>
              <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" />
              <path d="M2 17h20" /><path d="M6 8v4" />
            </svg>
          ),
          sun: (
            <svg {...svgProps}>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ),
          backpack: (
            <svg {...svgProps}>
              <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10H4V10Z" />
              <path d="M9 6V4a3 3 0 0 1 6 0v2" />
              <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
            </svg>
          ),
          info: (
            <svg {...svgProps}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        };

        return (
          <section className="mt-12 mb-8">
            <h2 className="text-2xl font-semibold mb-6">{t("tipsTitle")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip: any, idx: number) => (
                <details
                  key={idx}
                  className="group rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <summary className="flex cursor-pointer items-center gap-3 p-4 list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                      {iconMap[tip.icono] ?? iconMap.info}
                    </span>
                    <span className="flex-1 font-medium text-foreground text-sm leading-tight">
                      {tip.titulo}
                    </span>
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {tip.contenido}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Lista de pueblos (legacy, solo si no hay paradas) */}
      {paradas.length === 0 && pueblosOrdenados.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Pueblos de la ruta</h2>
          <div className="space-y-3">
            {pueblosOrdenados.map((pueblo, idx) => (
              <Link
                key={pueblo.id}
                href={`/pueblos/${pueblo.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {pueblo.nombre}
                  </h3>
                </div>
                <div className="text-gray-400">→</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mapa de la ruta (si no hay paradas, mostrar solo el mapa) */}
      {paradas.length === 0 && pueblosOrdenados.length > 0 && (
        <section id="mapa" className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Mapa de la ruta</h2>
          <RutaParadasConMapa
            paradas={pueblosOrdenados.map((pueblo: any, idx: number) => ({
              pueblo,
              orden: idx + 1,
              lat: pueblo.lat,
              lng: pueblo.lng,
              titulo: pueblo.nombre,
            }))}
            tips={[]}
            totalDistanciaKm={(ruta as any).distancia_km ?? null}
            totalTiempoEstimado={(ruta as any).tiempo_estimado ?? null}
          />
        </section>
      )}
    </main>
  );
}
