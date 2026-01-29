"use client";

import { PuebloCard } from "./PuebloCard";
import type { Pueblo } from "@/lib/api";
import { usePuebloPhotos } from "@/app/hooks/usePuebloPhotos";

type FeaturedPueblosGridProps = {
  pueblos: Pueblo[];
};

export function FeaturedPueblosGrid({ pueblos }: FeaturedPueblosGridProps) {
  // Eager loading para destacados (fetch inmediato, sin IntersectionObserver)
  const { photos } = usePuebloPhotos(pueblos, { eager: true });

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {pueblos.map((p) => {
        const photoData = photos[String(p.id)];
        const img = photoData?.url ?? null;
        
        return (
          <PuebloCard
            key={p.id}
            slug={p.slug}
            nombre={p.nombre}
            provincia={p.provincia}
            foto={img}
          />
        );
      })}
    </div>
  );
}
