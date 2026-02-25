'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Product } from '@/src/types/tienda';
import { useTranslations, useLocale } from 'next-intl';

interface ProductCardProps {
  product: Product;
  className?: string;
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function localized(field: string | null | undefined, i18n: Record<string, string> | null | undefined, locale: string): string | null {
  if (locale !== 'es' && i18n && i18n[locale]) return i18n[locale];
  return field ?? null;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations('tienda');
  const locale = useLocale();
  const precioOriginal = toNum(product.precio);
  const precioFinal = toNum(product.finalPrice ?? product.precio);
  const hasDiscount =
    (product.discountPercent != null && product.discountPercent > 0) ||
    (product.discount != null) ||
    (precioFinal > 0 && precioOriginal > precioFinal);
  const discountPercent =
    product.discountPercent ??
    product.discount?.percent ??
    (precioOriginal > 0 ? Math.round(((precioOriginal - precioFinal) / precioOriginal) * 100) : 0);
  const ahorro = hasDiscount ? precioOriginal - precioFinal : 0;

  const rawImg =
    (product.imagenUrl && String(product.imagenUrl).trim()) ||
    (product.images?.[0]?.url && String(product.images[0].url).trim());
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
              {t('noImage')}
            </div>
          ) : (
            <>
              {/* Fondo desenfocado para imágenes que no llenan el cuadrado */}
              <Image
                src={safeSrc}
                alt=""
                fill
                aria-hidden
                className="object-cover scale-110 blur-xl brightness-75 saturate-125"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
              />
              {/* Imagen real centrada, sin recorte */}
              <Image
                src={safeSrc}
                alt={localized(product.nombre, product.nombre_i18n, locale) || 'Producto'}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105 relative z-10"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
              />
            </>
          )}
          <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/5" />

          {/* Badge Destacado (top-left) */}
          {product.destacado && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              {t('featured')}
            </span>
          )}

          {/* Badge descuento/oferta (top-right, siempre visible si hay descuento) */}
          {hasDiscount && discountPercent > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              -{discountPercent}%
            </span>
          )}

          {/* Botón agregar al carrito (hover) */}
          <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="block rounded-md bg-card/95 px-4 py-2.5 text-center text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card">
              {t('viewProduct')}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {localized(product.categoria, product.categoria_i18n, locale) || t('product')}
          </span>
          <h3 className="font-serif text-base font-medium leading-snug transition-colors group-hover:text-primary">
            {localized(product.nombre, product.nombre_i18n, locale)}
          </h3>
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              {hasDiscount ? (
                <>
                  <span className="font-semibold text-destructive">
                    {precioFinal.toFixed(2)} €
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {precioOriginal.toFixed(2)} €
                  </span>
                </>
              ) : (
                <span className="font-medium text-foreground">
                  {precioFinal.toFixed(2)} €
                </span>
              )}
              {product.stock <= 0 ? (
                <span className="text-xs text-destructive">{t('outOfStock')}</span>
              ) : (
                <span className="text-xs text-green-600">{t('inStock')}</span>
              )}
            </div>
            {hasDiscount && ahorro > 0 && (
              <span className="text-xs font-medium text-green-600">
                {t('savings', { amount: ahorro.toFixed(2) })}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
