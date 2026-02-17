import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getRutas } from "@/lib/api";
import { createExcerpt } from "@/lib/sanitizeHtml";
import RutaMiniMap from "@/app/_components/RutaMiniMap";
import RutaCardStats from "@/app/_components/RutaCardStats";

export const metadata: Metadata = {
  title: "Rutas – Los Pueblos Más Bonitos de España",
  description: "Descubre rutas turísticas por los pueblos más bonitos de España",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RutasPage() {
  const locale = await getLocale();
  const t = await getTranslations("rutas");
  const tHome = await getTranslations("home");
  const rutas = await getRutas(locale);

  const rutasActivas = rutas.filter((r) => r.activo);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-gray-600">
          {t("pageDesc")}
        </p>
      </div>

      {rutasActivas.length === 0 ? (
        <p className="text-gray-600">{t("noRoutes")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rutasActivas.map((ruta) => (
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
                    <span className="text-sm text-muted-foreground">{tHome("noImage")}</span>
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

              {/* Franja de ubicación: mini-mapa + datos calculados via OSRM */}
              <div className="flex items-stretch gap-3 border-b border-border bg-accent/50 px-3 py-2.5">
                {/* Mini mapa */}
                <RutaMiniMap rutaId={ruta.id} width={100} height={70} />

                {/* Stats (calculadas dinámicamente via OSRM) */}
                <RutaCardStats rutaId={ruta.id} />
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {ruta.titulo}
                </h2>

                {/* Badges */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
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
          ))}
        </div>
      )}
    </main>
  );
}
