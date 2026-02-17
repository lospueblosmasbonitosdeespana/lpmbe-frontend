import Link from "next/link";
import { getPuebloMainPhoto } from "@/lib/api";
import type { PuebloLite } from "@/lib/api";
import { getTranslations } from "next-intl/server";

/** Distancia Haversine en km */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // radio Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Props = {
  puebloActual: { id: number; lat: number | null; lng: number | null };
  pueblos: PuebloLite[];
  /** Foto principal por pueblo id (desde bulk API). Si no se pasa, usa foto_destacada. */
  photosByPuebloId?: Record<string, { url: string } | null>;
  limit?: number;
};

export default async function PueblosCercanosSection({
  puebloActual,
  pueblos,
  photosByPuebloId,
  limit = 4,
}: Props) {
  const t = await getTranslations("puebloPage");
  const { lat, lng } = puebloActual;
  if (lat == null || lng == null) return null;

  const otros = pueblos.filter((p) => p.id !== puebloActual.id);
  if (otros.length === 0) return null;

  const conDistancia = otros
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      ...p,
      km: haversineKm(lat, lng, p.lat!, p.lng!),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);

  if (conDistancia.length === 0) return null;

  return (
    <section
      className="mt-16 py-16 bg-[var(--color-bg-section)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-700/90 dark:text-amber-400/90">
          {t("nearbyEyebrow")}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-gray-900 dark:text-foreground md:text-3xl">
          {t("nearbyTitle")}
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {conDistancia.map((pueblo) => {
            const foto =
              photosByPuebloId?.[String(pueblo.id)]?.url ??
              getPuebloMainPhoto(pueblo) ??
              pueblo.foto_destacada;
            return (
              <Link
                key={pueblo.id}
                href={`/pueblos/${pueblo.slug}`}
                className="group block overflow-hidden rounded-lg bg-white dark:bg-card shadow-sm transition-shadow hover:shadow-md border border-transparent dark:border-border"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-200 dark:bg-muted">
                  {foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={foto}
                      alt={pueblo.nombre}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-muted">
                      <span className="text-sm text-gray-500 dark:text-muted-foreground">
                        {pueblo.nombre}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-800/80 dark:text-amber-400/80">
                    {pueblo.provincia}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-gray-900 dark:text-foreground group-hover:text-amber-800 dark:group-hover:text-amber-400">
                    {pueblo.nombre}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
