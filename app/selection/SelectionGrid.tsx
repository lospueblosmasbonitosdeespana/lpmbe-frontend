"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const TIPO_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  CASA_RURAL: "Casa rural",
  RESTAURANTE: "Restaurante",
  BAR: "Bar / Cafetería",
  COMERCIO: "Comercio",
  TIENDA_ARTESANIA: "Tienda de artesanía",
  BODEGA: "Bodega",
  EXPERIENCIA: "Experiencia",
  OTRO: "Otro",
};

const ACCOMMODATION_TYPES = new Set(["HOTEL", "CASA_RURAL"]);
const RESTAURANT_TYPES = new Set(["RESTAURANTE", "BAR"]);

type Negocio = {
  id: number;
  slug: string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  fotoUrl?: string | null;
  imagenes?: Array<{ url: string; alt: string | null }>;
  localidad?: string | null;
  provincia?: string | null;
  comunidad?: string | null;
  pueblo?: { nombre: string; slug: string } | null;
  descuentoPorcentaje?: number | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  ofertas?: Array<{ titulo: string; tipoOferta: string }>;
};

type FilterKey = "all" | "hotel" | "restaurante" | "otro";

export function SelectionGrid({
  negocios,
  imprescindibleLabel,
}: {
  negocios: Negocio[];
  imprescindibleLabel: string;
}) {
  const t = useTranslations("selection");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = negocios;
    if (filter === "hotel") list = list.filter((n) => ACCOMMODATION_TYPES.has(n.tipo));
    else if (filter === "restaurante") list = list.filter((n) => RESTAURANT_TYPES.has(n.tipo));
    else if (filter === "otro") list = list.filter((n) => !ACCOMMODATION_TYPES.has(n.tipo) && !RESTAURANT_TYPES.has(n.tipo));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.nombre.toLowerCase().includes(q) ||
          n.localidad?.toLowerCase().includes(q) ||
          n.provincia?.toLowerCase().includes(q) ||
          n.pueblo?.nombre.toLowerCase().includes(q)
      );
    }
    return list;
  }, [negocios, filter, search]);

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "filterAll" },
    { key: "hotel", labelKey: "filterHotel" },
    { key: "restaurante", labelKey: "filterRestaurante" },
    { key: "otro", labelKey: "filterOtro" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-64 rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("notFoundDesc")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => {
            const mainImg = n.imagenes?.[0]?.url ?? n.fotoUrl ?? null;
            const location = n.pueblo?.nombre ?? n.localidad ?? n.provincia ?? "";
            const href = n.pueblo
              ? `/pueblos/${n.pueblo.slug}/club/${n.slug}`
              : `/selection/${n.slug}`;

            return (
              <Link
                key={n.id}
                href={href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={n.nombre}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                    <svg className="h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Selection
                  </div>
                  {n.imprescindible && (
                    <div
                      className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md ring-1 ring-amber-700/20"
                      title={
                        n.ratingVerificado?.rating
                          ? `${imprescindibleLabel} · ★ ${n.ratingVerificado.rating}`
                          : imprescindibleLabel
                      }
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {imprescindibleLabel}
                    </div>
                  )}
                  {n.descuentoPorcentaje != null && n.descuentoPorcentaje > 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                      {n.descuentoPorcentaje}% dto.
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {TIPO_LABELS[n.tipo] ?? n.tipo}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {n.nombre}
                  </h3>
                  {location && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{location}</p>
                  )}
                  {n.descripcion && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
                      {n.descripcion}
                    </p>
                  )}
                  {n.ofertas && n.ofertas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {n.ofertas.slice(0, 2).map((o, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                        >
                          {o.titulo}
                        </span>
                      ))}
                      {n.ofertas.length > 2 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{n.ofertas.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
