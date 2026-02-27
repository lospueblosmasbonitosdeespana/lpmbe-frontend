import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PuebloMetricasDashboard from './PuebloMetricasDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PuebloMetricasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (!['ADMIN', 'EDITOR', 'ALCALDE'].includes(me.rol)) redirect('/mi-cuenta');

  const { slug } = await params;

  if (me.rol === 'ALCALDE') {
    const misPueblos = await getMisPueblosServer();
    const tieneAcceso = misPueblos?.some((p) => p.slug === slug);
    if (!tieneAcceso) redirect('/gestion/mis-pueblos');
  }

  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloId = pueblo?.id ?? null;
  } catch {
    puebloId = null;
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a gestión del pueblo
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Métricas del pueblo
        </h1>
      </div>
      <PuebloMetricasDashboard slug={slug} puebloId={puebloId} />
    </main>
  );
}
