import Link from "next/link";
import type { Metadata } from "next";
import { getRutas, getRutaById, getRutaMapa } from "@/lib/api";
import { sanitizeHtml, createExcerpt } from "@/lib/sanitizeHtml";

export const revalidate = 300;

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
  
  // 3. Obtener mapa
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
  
  // Sanitizar descripción
  const descripcionLimpia = ruta.descripcion ? sanitizeHtml(ruta.descripcion) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/rutas" className="text-blue-600 hover:underline">
          ← Volver a rutas
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{ruta.titulo}</h1>
        
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

      {/* Descripción */}
      {descripcionLimpia && (
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Descripción</h2>
          <div 
            className="prose max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: descripcionLimpia }}
          />
        </section>
      )}

      {/* Lista de pueblos */}
      {pueblosOrdenados.length > 0 && (
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
          <iframe
            src={`https://maps.lospueblosmasbonitosdeespana.org/es/${boldestSlug}`}
            style={{ width: "100%", height: 600, border: 0, borderRadius: 12 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-600">
            Mapa pendiente de configurar
          </div>
        )}
      </section>
    </main>
  );
}
