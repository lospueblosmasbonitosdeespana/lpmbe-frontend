import Link from "next/link";
import { getRutas } from "@/lib/api";

type RutasSectionProps = {
  count?: number;
  enabled?: boolean;
};

export async function RutasSection({ count = 4, enabled = true }: RutasSectionProps) {
  if (!enabled) {
    return null;
  }

  // Fetch todas las rutas activas
  const todasLasRutas = await getRutas();
  const rutasActivas = todasLasRutas.filter((r) => r.activo);

  // Seleccionar N rutas aleatorias
  const shuffled = [...rutasActivas].sort(() => Math.random() - 0.5);
  const rutasRandom = shuffled.slice(0, count);

  if (rutasRandom.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Descubre nuestras rutas</h2>
          <p className="mt-2 text-sm text-gray-600">
            Itinerarios diseñados para recorrer los pueblos más bonitos
          </p>
        </div>
        <Link
          href="/rutas"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {rutasRandom.map((ruta) => (
          <Link
            key={ruta.id}
            href={`/rutas/${ruta.slug}`}
            className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {/* Foto portada */}
            <div className="relative h-40 w-full overflow-hidden bg-gray-200">
              {ruta.foto_portada ? (
                <img
                  src={ruta.foto_portada}
                  alt={ruta.titulo}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300">
                  <span className="text-xs text-gray-500">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                {ruta.titulo}
              </h3>

              {/* Metadatos compactos */}
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {ruta.dificultad && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                    {ruta.dificultad}
                  </span>
                )}
                {ruta.distancia && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                    {ruta.distancia} km
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
