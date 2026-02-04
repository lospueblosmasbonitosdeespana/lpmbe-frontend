import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaSlug: string }>;
}) {
  const { slug } = await params;
  redirect(`/pueblos/${slug}`);
}
