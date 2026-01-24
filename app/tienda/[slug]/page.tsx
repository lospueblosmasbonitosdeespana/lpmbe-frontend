import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/src/lib/tiendaApi';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
