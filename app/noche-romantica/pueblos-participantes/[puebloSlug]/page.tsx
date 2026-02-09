import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
}

interface Negocio {
  id: number;
  tipo: 'HOTEL' | 'RESTAURANTE' | 'COMERCIO' | 'OTRO';
  nombre: string;
  descripcion: string | null;
  horario: string | null;
  menuUrl: string | null;
  fotoUrl: string | null;
}

interface NRPuebloDetail {
  id: number;
  cartelUrl: string | null;
  titulo: string | null;
  descripcion: string | null;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  actividades: Actividad[];
  negocios: Negocio[];
}

const NEGOCIO_LABEL: Record<string, { title: string; icon: string }> = {
  HOTEL: { title: 'Dónde dormir', icon: '🏨' },
  RESTAURANTE: { title: 'Dónde comer', icon: '🍽️' },
  COMERCIO: { title: 'Dónde comprar', icon: '🛍️' },
  OTRO: { title: 'Otros servicios', icon: '📍' },
};

async function fetchPueblo(slug: string): Promise<NRPuebloDetail | null> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/noche-romantica/pueblos/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PuebloNocheRomanticaPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const data = await fetchPueblo(puebloSlug);

  if (!data) notFound();

  const negociosByType = data.negocios.reduce(
    (acc, n) => {
      if (!acc[n.tipo]) acc[n.tipo] = [];
      acc[n.tipo].push(n);
      return acc;
    },
    {} as Record<string, Negocio[]>,
  );

  const heroImage = data.cartelUrl || data.pueblo.foto_destacada;

  return (
    <main className="min-h-screen">
      {/* Hero / Cartel */}
      {heroImage && (
        <section className="relative w-full bg-gray-100">
          <img
            src={heroImage}
            alt={data.pueblo.nombre}
            className="w-full max-h-[60vh] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <p className="text-sm opacity-80">La Noche Romántica</p>
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
              {data.pueblo.nombre}
            </h1>
            <p className="mt-1 text-sm drop-shadow-md opacity-90">
              {data.pueblo.provincia}, {data.pueblo.comunidad}
            </p>
          </div>
        </section>
      )}

      {/* Sin hero */}
      {!heroImage && (
        <section className="bg-gradient-to-b from-rose-50 to-white py-12 text-center">
          <p className="text-sm text-rose-600">La Noche Romántica</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {data.pueblo.nombre}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data.pueblo.provincia}, {data.pueblo.comunidad}
          </p>
        </section>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/noche-romantica" className="hover:text-rose-600 hover:underline">
            La Noche Romántica
          </Link>
          <span>/</span>
          <Link
            href="/noche-romantica/pueblos-participantes"
            className="hover:text-rose-600 hover:underline"
          >
            Pueblos Participantes
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{data.pueblo.nombre}</span>
        </nav>

        {/* Título y descripción */}
        {data.titulo && (
          <h2 className="mb-4 text-2xl font-bold text-gray-800">{data.titulo}</h2>
        )}
        {data.descripcion && (
          <p className="mb-8 text-lg text-gray-600 leading-relaxed whitespace-pre-line">
            {data.descripcion}
          </p>
        )}

        {/* Actividades */}
        {data.actividades.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🎭</span> Programa de actividades
            </h2>
            <div className="space-y-4">
              {data.actividades.map((a) => (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row">
                    {a.fotoUrl && (
                      <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
                        <img
                          src={a.fotoUrl}
                          alt={a.titulo}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {a.titulo}
                      </h3>
                      {a.horario && (
                        <p className="mt-1 text-sm font-medium text-rose-600">
                          🕐 {a.horario}
                        </p>
                      )}
                      {a.descripcion && (
                        <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line">
                          {a.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Negocios */}
        {Object.keys(negociosByType).length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              Dónde comer, dormir y comprar
            </h2>
            <div className="space-y-8">
              {Object.entries(negociosByType).map(([tipo, negocios]) => {
                const meta = NEGOCIO_LABEL[tipo] ?? {
                  title: tipo,
                  icon: '📍',
                };
                return (
                  <div key={tipo}>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-700">
                      <span>{meta.icon}</span> {meta.title}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {negocios.map((n) => (
                        <div
                          key={n.id}
                          className="overflow-hidden rounded-xl border bg-white shadow-sm"
                        >
                          {n.fotoUrl && (
                            <img
                              src={n.fotoUrl}
                              alt={n.nombre}
                              className="h-40 w-full object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-800">
                              {n.nombre}
                            </h4>
                            {n.horario && (
                              <p className="text-sm text-rose-600">
                                🕐 {n.horario}
                              </p>
                            )}
                            {n.descripcion && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                                {n.descripcion}
                              </p>
                            )}
                            {n.menuUrl && (
                              <a
                                href={n.menuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm text-rose-600 hover:underline"
                              >
                                📋 Ver carta / menú
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-10 pt-6 border-t text-sm">
          <Link
            href="/noche-romantica/pueblos-participantes"
            className="text-rose-600 hover:underline"
          >
            ← Volver a Pueblos Participantes
          </Link>
        </div>
      </div>
    </main>
  );
}
