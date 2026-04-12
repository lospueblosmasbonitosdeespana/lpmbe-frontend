"use client";

import Link from "next/link";
import { useState, useMemo, memo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import SemaforoBadge from "../components/pueblos/SemaforoBadge";
import { TagIcon } from "@/lib/tag-icon-map";
import { type Pueblo, getPuebloMainPhoto } from "@/lib/api";
import { usePuebloPhotos } from "@/app/hooks/usePuebloPhotos";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Container } from "@/app/components/ui/container";

type TagBadge = { tag: string; icono: string; color: string; nombre_i18n: Record<string, string>; cantidad: number | null };

type PueblosListProps = {
  pueblos: Pueblo[];
  initialComunidad?: string;
  initialProvincia?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

// Placeholder cuando no hay imagen o falla la carga
function ImagePlaceholder() {
  return (
        <div className="flex h-full w-full items-center justify-center bg-muted">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-10 w-10 text-primary/50"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

// All tags are displayed without truncation

const PuebloCard = memo(function PuebloCard({
  pueblo,
  foto,
  isPriority,
  observe,
  alertCount,
  tags,
}: {
  pueblo: Pueblo;
  foto: string | null;
  isPriority: boolean;
  observe: (el: HTMLElement | null) => void;
  alertCount: number;
  tags?: TagBadge[];
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

  const visibleTags = tags;

  return (
    <article
      ref={observe}
      data-pueblo-slug={pueblo.slug}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <Link href={`/pueblos/${pueblo.slug}`} className="contents">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {showImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={foto!}
              alt={`${pueblo.nombre}, ${pueblo.provincia} - Los Pueblos Más Bonitos de España`}
              width={400}
              height={250}
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

        <div className="flex flex-1 flex-col px-3 py-2">
          <h3 className="font-display text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary">
            {pueblo.nombre}
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {pueblo.provincia}, {pueblo.comunidad}
          </p>
          {visibleTags && visibleTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {visibleTags.map((t) => (
                <span
                  key={t.tag}
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: `${t.color}14` }}
                  title={t.nombre_i18n?.es ?? t.tag}
                >
                  <TagIcon name={t.icono} color={t.color} size={12} />
                  {t.cantidad && t.cantidad > 1 && (
                    <span className="text-[9px] font-semibold leading-none" style={{ color: t.color }}>
                      {t.cantidad}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between px-3 pb-2 pt-1">
        <div>
          <SemaforoBadge estado={estado} variant="badge" />
        </div>
        {alertCount > 0 ? (
          <Link
            href={`/pueblos/${pueblo.slug}/alertas`}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-amber-600 hover:bg-amber-50"
            title={`Ver ${alertCount} alerta${alertCount === 1 ? "" : "s"}`}
            aria-label={`Ver ${alertCount} alerta${alertCount === 1 ? "" : "s"} de ${pueblo.nombre}`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold">{alertCount}</span>
          </Link>
        ) : (
          <span className="h-6 w-6" aria-hidden />
        )}
      </div>
    </article>
  );
});

export default function PueblosList({
  pueblos: initialPueblos,
  initialComunidad = "",
  initialProvincia = "",
}: PueblosListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({});

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

  const [bulkTags, setBulkTags] = useState<Record<string, TagBadge[]>>({});
  const t = useTranslations("explore");
  const tTabs = useTranslations("tabs");
  const hasActiveFilters = comunidadNorm || provinciaNorm;
  const { photos, observe } = usePuebloPhotos(pueblosFiltrados);

  useEffect(() => {
    let cancelled = false;

    async function loadAlertCounts() {
      try {
        const res = await fetch(
          "/api/public/notificaciones/feed?limit=200&tipos=ALERTA_PUEBLO",
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const feedItems = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        const nextCounts: Record<string, number> = {};

        for (const item of feedItems) {
          const slug = item?.pueblo?.slug;
          if (!slug) continue;
          nextCounts[slug] = (nextCounts[slug] ?? 0) + 1;
        }

        if (!cancelled) setAlertCounts(nextCounts);
      } catch {}
    }

    loadAlertCounts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ids = pueblosOrdenados.map((p) => p.id);
    if (ids.length === 0) return;

    async function loadBulkTags() {
      try {
        const res = await fetch(`/api/public/caracteristicas/bulk?ids=${ids.join(",")}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && typeof data === "object") setBulkTags(data);
      } catch {}
    }

    loadBulkTags();
    return () => { cancelled = true; };
  }, [pueblosOrdenados]);

  const breadcrumbItems = [
    { label: tTabs("pueblos"), href: "/pueblos" },
    ...(provinciaNorm
      ? [
          { label: t("byProvince"), href: "/pueblos/provincias" },
          { label: initialProvincia },
        ]
      : comunidadNorm
        ? [
            { label: t("communities"), href: "/pueblos/comunidades" },
            { label: initialComunidad },
          ]
        : []),
  ];

  return (
    <main className="min-h-screen bg-background">
      {breadcrumbItems.length > 1 && (
        <div className="border-b border-border bg-background py-4">
          <Container>
            <Breadcrumbs items={breadcrumbItems} />
          </Container>
        </div>
      )}
      {/* Header con diseño 2.0 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center md:py-16">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("discover")}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t("pageHeading")}
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
            {t("introText")}
          </p>
          <p className="mt-2 text-base text-muted-foreground">
            {pueblosFiltrados.length}{" "}
            {pueblosFiltrados.length === 1 ? t("village") : t("villages")}
          </p>
          <div className="mt-6">
            <input
              type="text"
              placeholder={t("searchPlaceholderExtended")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-xl rounded-lg border border-input bg-background px-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {hasActiveFilters && (
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium">{t("activeFilters")}</span>
            {comunidadNorm && (
              <span className="text-sm text-muted-foreground">
                {t("community")} <strong className="text-foreground">{initialComunidad}</strong>
              </span>
            )}
            {provinciaNorm && (
              <span className="text-sm text-muted-foreground">
                {t("province")} <strong className="text-foreground">{initialProvincia}</strong>
              </span>
            )}
            <Link
              href="/pueblos"
              className="ml-auto text-sm font-medium text-primary hover:underline"
            >
              {t("clearFilters")}
            </Link>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        {pueblosFiltrados.length > 0 ? (
          <div
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            role="list"
          >
            {pueblosFiltrados.map((pueblo, index) => {
              const photoData = photos[String(pueblo.id)];
              // Priorizar foto_destacada (como detalle) para que tarjeta y hero coincidan
              const foto = getPuebloMainPhoto(pueblo) ?? photoData?.url ?? null;
              const isPriority = index < 8;

              return (
                <PuebloCard
                  key={pueblo.id}
                  pueblo={pueblo}
                  foto={foto}
                  isPriority={isPriority}
                  observe={observe}
                  alertCount={alertCounts[pueblo.slug] ?? 0}
                  tags={bulkTags[String(pueblo.id)]}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            {searchTerm
              ? t("noResultsSearch")
              : t("noVillages")}
          </p>
        )}
      </section>
    </main>
  );
}
