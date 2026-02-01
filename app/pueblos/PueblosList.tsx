"use client";

import Link from "next/link";
import { useState, useMemo, memo } from "react";
import SemaforoBadge from "../components/pueblos/SemaforoBadge";
import { type Pueblo } from "@/lib/api";
import { usePuebloPhotos } from "@/app/hooks/usePuebloPhotos";

type PueblosListProps = {
  pueblos: Pueblo[];
  initialComunidad?: string;
  initialProvincia?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

// Placeholder cuando no hay imagen o falla la carga
function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-10 w-10 text-blue-500"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

const PuebloCard = memo(function PuebloCard({
  pueblo,
  foto,
  isPriority,
  observe,
}: {
  pueblo: Pueblo;
  foto: string | null;
  isPriority: boolean;
  observe: (el: HTMLElement | null) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = foto && !imgError;

  const estado =
    pueblo.semaforo?.estado ??
    (typeof pueblo.semaforo === "object" &&
    pueblo.semaforo !== null &&
    "estado" in pueblo.semaforo
      ? (pueblo.semaforo as { estado?: string }).estado
      : null);

  return (
    <Link
      href={`/pueblos/${pueblo.slug}`}
      ref={observe}
      data-pueblo-slug={pueblo.slug}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {/* Imagen 16:10 (landscape) - v0 villagesDense */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-200">
        {showImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={foto!}
            alt={`Vista de ${pueblo.nombre}`}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      {/* Contenido compacto */}
      <div className="flex flex-1 flex-col px-3 py-2">
        <h3 className="font-display text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-700">
          {pueblo.nombre}
        </h3>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500">
          {pueblo.provincia}, {pueblo.comunidad}
        </p>
        <div className="mt-auto pt-2">
          <SemaforoBadge estado={estado} variant="badge" />
        </div>
      </div>
    </Link>
  );
});

export default function PueblosList({
  pueblos: initialPueblos,
  initialComunidad = "",
  initialProvincia = "",
}: PueblosListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const comunidadNorm = initialComunidad ? norm(initialComunidad) : "";
  const provinciaNorm = initialProvincia ? norm(initialProvincia) : "";

  const pueblosOrdenados = useMemo(() => {
    return [...initialPueblos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [initialPueblos]);

  const pueblosFiltrados = useMemo(() => {
    let filtered = pueblosOrdenados;

    if (comunidadNorm) {
      filtered = filtered.filter(
        (p) => norm(p.comunidad ?? "") === comunidadNorm
      );
    }

    if (provinciaNorm) {
      filtered = filtered.filter(
        (p) => norm(p.provincia ?? "") === provinciaNorm
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pueblo) =>
          pueblo.nombre.toLowerCase().includes(term) ||
          pueblo.provincia.toLowerCase().includes(term) ||
          pueblo.comunidad.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [pueblosOrdenados, comunidadNorm, provinciaNorm, searchTerm]);

  const hasActiveFilters = comunidadNorm || provinciaNorm;
  const { photos, observe } = usePuebloPhotos(pueblosFiltrados);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg-section)" }}
    >
      {/* Page header - v0 centered */}
      <section className="bg-white/80 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Descubre
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-gray-900 md:text-4xl">
            Pueblos
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {pueblosFiltrados.length}{" "}
            {pueblosFiltrados.length === 1 ? "pueblo" : "pueblos"}
          </p>

          {/* Buscador */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Buscar por nombre, provincia o comunidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-100 px-4 py-3">
            <span className="text-sm font-medium">Filtros activos:</span>
            {comunidadNorm && (
              <span className="text-sm text-gray-600">
                Comunidad: <strong>{initialComunidad}</strong>
              </span>
            )}
            {provinciaNorm && (
              <span className="text-sm text-gray-600">
                Provincia: <strong>{initialProvincia}</strong>
              </span>
            )}
            <Link
              href="/pueblos"
              className="ml-auto text-sm text-blue-600 underline hover:text-blue-700"
            >
              Quitar filtros
            </Link>
          </div>
        </div>
      )}

      {/* Grid - v0 villagesDense: 4 cols desktop, 3 tablet, 2 mobile */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        {pueblosFiltrados.length > 0 ? (
          <div
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {pueblosFiltrados.map((pueblo, index) => {
              const photoData = photos[String(pueblo.id)];
              const foto = photoData?.url ?? pueblo.mainPhotoUrl ?? null;
              const isPriority = index < 8;

              return (
                <PuebloCard
                  key={pueblo.id}
                  pueblo={pueblo}
                  foto={foto}
                  isPriority={isPriority}
                  observe={observe}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            {searchTerm
              ? "No se encontraron pueblos con ese criterio de búsqueda"
              : "No hay pueblos disponibles"}
          </p>
        )}
      </section>
    </main>
  );
}
