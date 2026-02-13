import Link from "next/link";
import { getRutas } from "@/lib/api";
import RutaMiniMap from "@/app/_components/RutaMiniMap";

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
          <p className="mt-2 text-sm text-muted-foreground">
            Itinerarios diseñados para recorrer los pueblos más bonitos
          </p>
        </div>
        <Link
          href="/rutas"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {rutasRandom.map((ruta) => {
          const km = (ruta as any).distancia_km ?? (ruta as any).distanciaKm ?? ruta.distancia;
          const tiempo = (ruta as any).tiempo_estimado ?? (ruta as any).tiempoEstimado ?? ruta.tiempo;

          return (
            <Link
              key={ruta.id}
              href={`/rutas/${ruta.slug}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-lg hover:border-primary/30"
            >
              {/* Foto portada */}
              <div className="relative h-40 w-full overflow-hidden bg-accent">
                {ruta.foto_portada ? (
                  <img
                    src={ruta.foto_portada}
                    alt={ruta.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent">
                    <span className="text-xs text-muted-foreground">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Mini-mapa + stats compactos */}
              <div className="flex items-center gap-2 border-b border-border bg-accent/50 px-2.5 py-2">
                <RutaMiniMap rutaId={ruta.id} width={70} height={50} />
                <div className="flex flex-col gap-0.5 text-xs">
                  {km != null && (
                    <span className="font-bold text-foreground">{km} km</span>
                  )}
                  {tiempo != null && (
                    <span className="font-medium text-muted-foreground">{tiempo} h</span>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {ruta.titulo}
                </h3>

                {/* Badges */}
                <div className="mt-1.5 flex flex-wrap gap-1 text-xs">
                  {ruta.tipo && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {ruta.tipo}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
