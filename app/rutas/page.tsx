import Link from "next/link";
import type { Metadata } from "next";
import { getRutas } from "@/lib/api";
import { createExcerpt } from "@/lib/sanitizeHtml";

export const metadata: Metadata = {
  title: "Rutas – Los Pueblos Más Bonitos de España",
  description: "Descubre rutas turísticas por los pueblos más bonitos de España",
};

export const dynamic = "force-dynamic";

export const revalidate = 300;

export default async function RutasPage() {
  const rutas = await getRutas();

  // Filtrar solo rutas activas
  const rutasActivas = rutas.filter((r) => r.activo);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Rutas</h1>
        <p className="mt-2 text-gray-600">
          Descubre rutas turísticas por los pueblos más bonitos de España
        </p>
      </div>

      {rutasActivas.length === 0 ? (
        <p className="text-gray-600">No hay rutas disponibles</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rutasActivas.map((ruta) => (
            <Link
              key={ruta.id}
              href={`/rutas/${ruta.slug}`}
              className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Foto portada */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                {ruta.foto_portada ? (
                  <img
                    src={ruta.foto_portada}
                    alt={ruta.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-300">
                    <span className="text-sm text-gray-500">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {ruta.titulo}
                </h2>

                {/* Metadatos */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                  {ruta.dificultad && (
                    <span className="rounded bg-blue-100 px-2 py-1 font-medium text-blue-700">
                      {ruta.dificultad}
                    </span>
                  )}
                  {ruta.tipo && (
                    <span className="rounded bg-green-100 px-2 py-1 font-medium text-green-700">
                      {ruta.tipo}
                    </span>
                  )}
                  {ruta.distancia && (
                    <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700">
                      {ruta.distancia} km
                    </span>
                  )}
                  {ruta.tiempo && (
                    <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700">
                      {ruta.tiempo}h
                    </span>
                  )}
                </div>

                {/* Descripción */}
                {ruta.descripcion && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {createExcerpt(ruta.descripcion, 120)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
