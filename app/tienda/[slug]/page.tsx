import { notFound } from 'next/navigation';
import { getProductBySlug, getProductBySlugFast } from '@/src/lib/tiendaApi';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  metaLocaleLead,
  seoDescription,
  seoTitle,
  slugToTitle,
  type SupportedLocale,
} from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const localeSuffix = locale === 'es' ? '' : ` (${locale.toUpperCase()})`;
  const path = `/tienda/${slug}`;
  const fallbackName = slugToTitle(slug) || "Producto";

  try {
    const product = await getProductBySlugFast(slug);
    if (!product) {
      return {
        title: seoTitle(`Producto: ${fallbackName}${localeSuffix}`),
        description: seoDescription(
          `${metaLocaleLead(locale as SupportedLocale)}Información del producto ${fallbackName}.${localeSuffix} · ${slug}`,
        ),
        alternates: {
          canonical: getCanonicalUrl(path, locale as SupportedLocale),
          languages: getLocaleAlternates(path),
        },
      };
    }

    const productName = product.nombre?.trim() || fallbackName;
    const rawDesc = product.descripcion?.replace(/<[^>]*>/g, " ").trim();
    const lead = metaLocaleLead(locale as SupportedLocale);
    const body = rawDesc || `Compra ${productName} en la tienda oficial.`;
    return {
      title: seoTitle(`${productName}${localeSuffix}`),
      description: seoDescription(`${lead}${body}${localeSuffix} · ${slug}`),
      alternates: {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      },
    };
  } catch {
    return {
      title: seoTitle(`Producto: ${fallbackName}`),
      description: seoDescription(
        `${metaLocaleLead(locale as SupportedLocale)}Información del producto ${fallbackName}. · ${slug}`,
      ),
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
