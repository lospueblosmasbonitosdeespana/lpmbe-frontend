"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: "new" | "sale" | "bestseller" | "limited";
  villageOrigin?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

const badgeStyles = {
  new: "bg-accent text-accent-foreground",
  sale: "bg-destructive text-primary-foreground",
  bestseller: "bg-primary text-primary-foreground",
  limited: "bg-foreground text-background",
};

const badgeLabels = {
  new: "Nuevo",
  sale: "Oferta",
  bestseller: "Favorito",
  limited: "Edición limitada",
};

export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className={cn("group block", className)}
    >
      <article className="flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/5" />
          
          {/* Badge */}
          {product.badge && (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                badgeStyles[product.badge]
              )}
            >
              {badgeLabels[product.badge]}
            </span>
          )}
          
          {/* Quick add button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic
            }}
            className="absolute bottom-3 left-3 right-3 translate-y-2 rounded-md bg-card/95 px-4 py-2.5 text-sm font-medium text-foreground opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-card"
          >
            Agregar al carrito
          </button>
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.category}
          </span>
          <h3 className="font-serif text-base font-medium leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          {product.villageOrigin && (
            <span className="text-xs text-muted-foreground">
              Origen: {product.villageOrigin}
            </span>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className="font-medium text-foreground">
              {product.price.toFixed(2)} €
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {product.originalPrice!.toFixed(2)} €
                </span>
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ----- SKELETON ----- */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-lg bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}
