'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/src/store/cart';
import { formatEUR } from '@/src/lib/money';
import type { Product } from '@/src/types/tienda';
import { useTranslations, useLocale } from 'next-intl';

function localized(field: string | null | undefined, i18n: Record<string, string> | null | undefined, locale: string): string {
  if (locale !== 'es' && i18n && i18n[locale]) return i18n[locale];
  return field ?? '';
}

type ProductDetailClientProps = {
  product: Product;
};

function toTime(v?: string) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const t = useTranslations('tienda');
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productName = localized(product.nombre, product.nombre_i18n, locale);
  const productDesc = localized(product.descripcion, product.descripcion_i18n, locale);
  const productCat = localized(product.categoria, product.categoria_i18n, locale);

  // 1) Imagen principal por defecto: product.imagenUrl
  const mainDefaultUrl = product?.imagenUrl?.trim() || null;

  // 2) Galería: product.images ordenadas (sin mezclar con principal)
  const galleryImages = useMemo(() => {
    const imgs = Array.isArray(product?.images) ? product.images : [];
    
    return [...imgs]
      .sort((a: any, b: any) => {
        const ao = Number(a?.order ?? 0);
        const bo = Number(b?.order ?? 0);
        if (ao !== bo) return ao - bo;
        return toTime(a?.createdAt) - toTime(b?.createdAt);
      })
      .filter((i: any) => i?.url && String(i.url).trim().length > 0);
  }, [product?.images]);

  // 3) Estado: reset SOLO cuando cambia product.id
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mainDefaultUrl) {
      setSelectedUrl(mainDefaultUrl);
    } else {
      setSelectedUrl(galleryImages[0]?.url ?? null);
    }
  }, [product?.id, mainDefaultUrl, galleryImages]);

  // 4) Imagen principal: cascada selectedUrl → mainDefaultUrl → primera galería
  const mainUrl = selectedUrl ?? mainDefaultUrl ?? galleryImages[0]?.url ?? null;

  // 5) Thumbnails: incluir principal + galería (sin duplicar)
  const allThumbs = useMemo(() => {
    const thumbs: any[] = [];
    
    // Añadir principal si existe
    if (mainDefaultUrl) {
      thumbs.push({ url: mainDefaultUrl, type: 'main', alt: productName });
    }
    
    // Añadir galería (evitar duplicados con principal)
    galleryImages.forEach((img: any) => {
      if (img.url !== mainDefaultUrl) {
        thumbs.push({ ...img, type: 'gallery' });
      }
    });
    
    return thumbs;
  }, [mainDefaultUrl, galleryImages, productName]);

  const hasThumbs = allThumbs.length > 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const canAdd = product.activo && product.stock > 0 && quantity <= product.stock;

  // ✅ NUEVO SISTEMA: usar finalPrice y discount del backend
  const hasDiscount = product.finalPrice && product.finalPrice < product.precio;
  const displayPrice = product.finalPrice ?? product.precio;
  const discountInfo = product.discount;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-600 hover:text-gray-900"
      >
        {t('backToShop')}
      </button>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Imagen + Galería */}
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-[#faf8f5]">
            {mainUrl ? (
              <img
                src={mainUrl}
                alt={productName || t('product')}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                {t('noImage')}
              </div>
            )}
          </div>

          {/* Thumbnails: principal + galería */}
          {hasThumbs && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {allThumbs.map((img: any) => {
                const active = img.url === mainUrl;
                const isMain = img.type === 'main';
                return (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setSelectedUrl(img.url)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded border ${
                      active ? "border-blue-600" : "border-gray-200"
                    } bg-gray-100 relative`}
                    aria-label={t('viewProduct')}
                  >
                    <img 
                      src={img.url} 
                      alt={img.alt || productName || t('product')} 
                      className="h-full w-full object-cover" 
                    />
                    {isMain && (
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5">
                        {t('principalImage')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          {/* Badges: SOLO si hay descuento con info del backend */}
          <div className="flex gap-2 mb-3">
            {hasDiscount && discountInfo && (
              <span className="inline-block rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                🔥 {discountInfo.label || t('discountApplied')}
                {discountInfo.percent > 0 && ` −${discountInfo.percent}%`}
              </span>
            )}
            {product.destacado && (
              <span className="inline-block rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                ⭐ {t('featuredBadge')}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold">{productName}</h1>

          {productCat && (
            <p className="mt-2 text-sm text-gray-500">{productCat}</p>
          )}

          {/* Precio con descuento del backend */}
          <div className="mt-6">
            {hasDiscount ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-red-600">{formatEUR(displayPrice)} €</span>
                  <span className="text-xl text-gray-400 line-through">{formatEUR(product.precio)} €</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {t('savingsDetail', { amount: formatEUR(product.precio - displayPrice) })}
                </p>
                <p className="mt-2 text-sm text-green-700 font-medium">
                  {t('discountAutoApplied', { label: discountInfo?.label || t('discountApplied') })}
                  {discountInfo?.source && (
                    <span className="ml-1 text-xs text-gray-600">
                      ({discountInfo.source === 'PRODUCT' ? t('sourceProduct') : t('sourceGlobal')})
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <span className="text-4xl font-bold">{formatEUR(displayPrice)} €</span>
            )}
          </div>

          {/* Stock */}
          <div className="mt-4">
            {product.stock <= 0 ? (
              <span className="text-red-600 font-medium">{t('outOfStock')}</span>
            ) : (
              <span className="text-green-600">{t('inStock')}</span>
            )}
          </div>

          {/* Descripción */}
          {productDesc && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">{t('description')}</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {productDesc}
              </p>
            </div>
          )}

          {/* Cantidad + Añadir al carrito */}
          {product.activo && product.stock > 0 && (
            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('quantityLabel')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Reducir cantidad"
                    className="h-10 w-10 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(product.stock, val)));
                    }}
                    className="h-10 w-20 rounded border border-gray-300 text-center"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    aria-label="Aumentar cantidad"
                    className="h-10 w-10 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={`w-full rounded-lg py-3 px-6 font-semibold transition-colors ${
                  canAdd
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {added ? t('addedToCart') : t('addToCart')}
              </button>

              <button
                onClick={() => router.push('/tienda/carrito')}
                className="w-full rounded-lg border border-gray-300 py-3 px-6 font-semibold hover:bg-gray-50"
              >
                {t('viewCart')}
              </button>
            </div>
          )}

          {!product.activo && (
            <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-gray-600">{t('productUnavailable')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
