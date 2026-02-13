import Link from "next/link";
import type { Metadata } from "next";
import { getRutas } from "@/lib/api";
import { createExcerpt } from "@/lib/sanitizeHtml";
import RutaMiniMap from "@/app/_components/RutaMiniMap";

export const metadata: Metadata = {
  title: "Rutas – Los Pueblos Más Bonitos de España",
  description: "Descubre rutas turísticas por los pueblos más bonitos de España",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          {rutasActivas.map((ruta) => {
            const km = (ruta as any).distancia_km ?? (ruta as any).distanciaKm ?? ruta.distancia;
            const tiempo = (ruta as any).tiempo_estimado ?? (ruta as any).tiempoEstimado ?? ruta.tiempo;
            const pueblosCount = Array.isArray((ruta as any).pueblos) ? (ruta as any).pueblos.length : null;

            return (
              <Link
                key={ruta.id}
                href={`/rutas/${ruta.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-lg hover:border-primary/30"
              >
                {/* Foto portada */}
                <div className="relative h-48 w-full overflow-hidden bg-accent">
                  {ruta.foto_portada ? (
                    <img
                      src={ruta.foto_portada}
                      alt={ruta.titulo}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-accent">
                      <span className="text-sm text-muted-foreground">Sin imagen</span>
                    </div>
                  )}
                  {/* Logo overlay */}
                  {ruta.logo?.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-4">
                      <img
                        src={ruta.logo.url}
                        alt={ruta.logo.nombre}
                        className="max-h-16 max-w-[80%] object-contain drop-shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Franja de ubicación: mini-mapa + datos */}
                <div className="flex items-stretch gap-3 border-b border-border bg-accent/50 px-3 py-2.5">
                  {/* Mini mapa */}
                  <RutaMiniMap rutaId={ruta.id} width={100} height={70} />

                  {/* Stats */}
                  <div className="flex flex-1 flex-col justify-center gap-1.5">
                    {km != null && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-sm font-bold text-foreground">{km} km</span>
                      </div>
                    )}
                    {tiempo != null && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="text-sm font-bold text-foreground">{tiempo} h</span>
                      </div>
                    )}
                    {pueblosCount != null && pueblosCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
                        </svg>
                        <span className="text-sm font-bold text-foreground">{pueblosCount} paradas</span>
                      </div>
                    )}
                    {!km && !tiempo && !pueblosCount && (
                      <span className="text-xs text-muted-foreground">Ubicación en España</span>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {ruta.titulo}
                  </h2>

                  {/* Badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {ruta.tipo && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                        {ruta.tipo}
                      </span>
                    )}
                    {ruta.dificultad && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-foreground">
                        {ruta.dificultad}
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  {ruta.descripcion && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {createExcerpt(ruta.descripcion, 120)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
