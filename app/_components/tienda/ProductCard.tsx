'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Product } from '@/src/types/tienda';

interface ProductCardProps {
  product: Product;
  className?: string;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const precioFinal = toNum(product.finalPrice ?? product.precio);
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const precioOriginal = hasDiscount ? toNum(product.precio) : undefined;

  const rawImg = product.imagenUrl && String(product.imagenUrl).trim();
  const safeSrc = rawImg || undefined;
  const usePlaceholder = !safeSrc;

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className={cn('group block', className)}
    >
      <article className="flex flex-col">
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {usePlaceholder ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
              Sin imagen
            </div>
          ) : (
            <Image
              src={safeSrc}
              alt={product.nombre || 'Producto'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/5" />

          {/* Badge Destacado */}
          {product.destacado && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              Destacado
            </span>
          )}

          {/* Badge descuento */}
          {hasDiscount && !product.destacado && (
            <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              -{product.discountPercent}%
            </span>
          )}

          {/* Botón agregar al carrito (hover) */}
          <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="block rounded-md bg-card/95 px-4 py-2.5 text-center text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card">
              Ver producto
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.categoria || 'Producto'}
          </span>
          <h3 className="font-serif text-base font-medium leading-snug transition-colors group-hover:text-primary">
            {product.nombre}
          </h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">
              {precioFinal.toFixed(2)} €
            </span>
            {product.stock <= 0 ? (
              <span className="text-xs text-destructive">Agotado</span>
            ) : (
              <span className="text-xs text-green-600">En stock</span>
            )}
          </div>
          {precioOriginal && precioOriginal > precioFinal && (
            <span className="text-sm text-muted-foreground line-through">
              {precioOriginal.toFixed(2)} €
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
