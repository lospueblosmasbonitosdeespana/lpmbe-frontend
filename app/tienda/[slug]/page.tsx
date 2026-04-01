import { notFound } from 'next/navigation';
import { getProductBySlug, getProductBySlugFast } from '@/src/lib/tiendaApi';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  slugToTitle,
  type SupportedLocale,
} from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 60;
type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const path = `/tienda/${slug}`;
  const fallbackName = slugToTitle(slug) || "Producto";
  const tSeo = await getTranslations('seo');

  try {
    const product = await getProductBySlugFast(slug);
    const productName = product?.nombre?.trim() || fallbackName;
    const rawDesc = product?.descripcion?.replace(/<[^>]*>/g, " ").trim();
    const title = seoTitle(productName);
    const description = seoDescription(
      rawDesc || tSeo("productoDescription", { nombre: productName })
    );
    return {
      title,
      description,
      alternates: {
        canonical: getCanonicalUrl(path, locale),
        languages: getLocaleAlternates(path),
      },
      openGraph: { title, description, url: getCanonicalUrl(path, locale), locale: getOGLocale(locale) },
    };
  } catch {
    const title = seoTitle(`Producto: ${fallbackName}`);
    const description = seoDescription(tSeo("productoDescription", { nombre: fallbackName }));
    return {
      title,
      description,
      alternates: {
        canonical: getCanonicalUrl(path, locale),
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
