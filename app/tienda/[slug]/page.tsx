import { notFound } from 'next/navigation';
import { getProductBySlug, getProductBySlugFast } from '@/src/lib/tiendaApi';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, seoDescription, seoTitle, slugToTitle, type SupportedLocale } from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const path = `/tienda/${slug}`;
  const fallbackName = slugToTitle(slug) || "Producto";

  try {
    const product = await getProductBySlugFast(slug);
    if (!product) {
      return {
        title: seoTitle(`Producto: ${fallbackName}`),
        description: seoDescription(`Informacion y detalles del producto ${fallbackName}.`),
        alternates: {
          canonical: getCanonicalUrl(path, locale as SupportedLocale),
          languages: getLocaleAlternates(path),
        },
      };
    }

    const productName = product.nombre?.trim() || fallbackName;
    const rawDesc = product.descripcion?.replace(/<[^>]*>/g, " ").trim();
    return {
      title: seoTitle(productName),
      description: seoDescription(rawDesc || `Compra ${productName} en la tienda oficial.`),
      alternates: {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      },
    };
  } catch {
    return {
      title: seoTitle(`Producto: ${fallbackName}`),
      description: seoDescription(`Informacion y detalles del producto ${fallbackName}.`),
      alternates: {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      },
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product = null;
  try {
    product = await getProductBySlug(slug);
  } catch (e) {
    // Error del servidor
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          Error cargando producto
        </div>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
