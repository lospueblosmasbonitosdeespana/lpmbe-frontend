import Link from "next/link";
import type { Metadata } from "next";
import { getRutas, getRutaById, getRutaMapa } from "@/lib/api";
import { sanitizeHtml, createExcerpt } from "@/lib/sanitizeHtml";

export const revalidate = 300;

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
  
  // Obtener todas las rutas y buscar por slug
  const rutas = await getRutas();
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
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
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
  
  // 1. Resolver slug → ruta
  const rutas = await getRutas();
  const rutaBasica = rutas.find((r) => r.slug === slug);
  
  if (!rutaBasica) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-red-600">Ruta no encontrada</h1>
        <Link href="/rutas" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Volver a rutas
        </Link>
      </main>
    );
  }

  // 2. Obtener detalles completos
  const ruta = await getRutaById(rutaBasica.id);
  
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
    rutaMapa = await getRutaMapa(ruta.id);
  } catch (err) {
    console.error(`Error cargando mapa de ruta ${ruta.id}:`, err);
    rutaMapa = null;
  }

  // SOLO usar boldestMapSlug (priorizar ruta.boldestMapSlug)
  const boldestSlug =
    (ruta as any).boldestMapSlug ??
    (rutaMapa?.ruta?.boldest?.slug ?? null);

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
          ← Volver a rutas
        </Link>
      </div>

      {/* Logo encima del Hero */}
      {(ruta as any).logo?.url && (
        <div className="mb-6 flex justify-center">
          <img
            src={(ruta as any).logo.url}
            alt={(ruta as any).logo.nombre}
            className="max-h-24 w-auto object-contain"
          />
        </div>
      )}

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{ruta.titulo}</h1>
        
        {/* Distancia y Tiempo (compacto) */}
        {(() => {
          const km = (ruta as any).distancia_km ?? (ruta as any).distanciaKm;
          const t = (ruta as any).tiempo_estimado ?? (ruta as any).tiempoEstimado;
          
          return (km || t) ? (
            <div className="mt-2 text-sm text-gray-600">
              {km ? `${km} km` : null}
              {km && t ? ' · ' : null}
              {t ? `${t} h` : null}
            </div>
          ) : null;
        })()}
        
        {/* Metadatos */}
        <div className="mt-4 flex flex-wrap gap-3">
          {ruta.dificultad && (
            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-xs font-medium uppercase text-blue-600">
                Dificultad
              </span>
              <p className="mt-1 text-sm font-semibold text-blue-900">
                {ruta.dificultad}
              </p>
            </div>
          )}
          
          {ruta.tipo && (
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <span className="text-xs font-medium uppercase text-green-600">
                Tipo
              </span>
              <p className="mt-1 text-sm font-semibold text-green-900">
                {ruta.tipo}
              </p>
            </div>
          )}
          
          {ruta.distancia && (
            <div className="rounded-lg bg-gray-50 px-4 py-2">
              <span className="text-xs font-medium uppercase text-gray-600">
                Distancia
              </span>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {ruta.distancia} km
              </p>
            </div>
          )}
          
          {ruta.tiempo && (
            <div className="rounded-lg bg-gray-50 px-4 py-2">
              <span className="text-xs font-medium uppercase text-gray-600">
                Tiempo estimado
              </span>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {ruta.tiempo}h
              </p>
            </div>
          )}
        </div>
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

      {/* Paradas de la ruta */}
      {paradas.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Paradas de la ruta</h2>

          <div className="mt-4 space-y-6">
            {paradas.map((p: any, idx: number) => {
              const pueblo = p.pueblo ?? {};
              const orden = Number(p.orden ?? (idx + 1));
              const titulo = (p.titulo?.trim() || pueblo.nombre || `Parada ${orden}`) as string;

              const descripcion = (p.descripcion ?? '').toString().trim();
              const fotoUrl = (p.fotoUrl || '').toString().trim();

              return (
                <article key={`${p.puebloId}-${orden}`} className="rounded-lg border p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {orden}
                    </div>
                    <h3 className="text-xl font-semibold">{titulo}</h3>
                  </div>

                  {fotoUrl ? (
                    <div className="mt-4">
                      {(pueblo as any).slug ? (
                        <Link
                          href={`/pueblos/${(pueblo as any).slug}`}
                          className="block transition hover:opacity-90"
                        >
                          <img
                            src={fotoUrl}
                            alt={titulo}
                            className="mt-3 rounded-md border cursor-pointer"
                            style={{ width: 260, height: 'auto' }}
                          />
                          <span className="mt-1 block text-sm text-primary hover:underline">
                            Ver pueblo →
                          </span>
                        </Link>
                      ) : (
                        <img
                          src={fotoUrl}
                          alt={titulo}
                          className="mt-3 rounded-md border"
                          style={{ width: 260, height: 'auto' }}
                        />
                      )}
                    </div>
                  ) : null}

                  {descripcion ? (
                    <div className="mt-4 prose prose-gray max-w-none">
                      <p className="whitespace-pre-line">{descripcion}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Outro (tips y cierre) */}
      {outroLimpia && (
        <section className="mb-8">
          <div 
            className="prose max-w-none text-gray-700 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: outroLimpia }}
          />
        </section>
      )}

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

      {/* Mapa Boldest */}
      <section id="mapa" className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Mapa de la ruta</h2>

        {boldestSlug ? (
          <div style={{ height: "80vh", minHeight: 700, maxHeight: 900 }}>
            <iframe
              src={`https://maps.lospueblosmasbonitosdeespana.org/es/${boldestSlug}`}
              style={{ width: "100%", height: "100%", border: 0, borderRadius: 12 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allow="geolocation"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-600">
            Mapa pendiente de configurar
          </div>
        )}
      </section>
    </main>
  );
}
