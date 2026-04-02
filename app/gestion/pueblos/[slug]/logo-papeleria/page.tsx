import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoPapeleriaClient from './LogoPapeleriaClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LogoPapeleriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  let pueblo: { id: number; nombre: string; slug: string } | null = null;
  try {
    pueblo = await getPuebloBySlug(slug);
  } catch {}

  if (!pueblo) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center">
          <p className="font-semibold text-red-800">No se pudo cargar el pueblo.</p>
          <Link
            href="/gestion/mis-pueblos"
            className="mt-4 inline-flex text-sm font-medium text-red-700 underline hover:text-red-900"
          >
            Ir a mis pueblos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/gestion/pueblos/${slug}`}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión del pueblo
      </Link>
      <LogoPapeleriaClient puebloId={pueblo.id} puebloNombre={pueblo.nombre} puebloSlug={slug} />
    </main>
  );
}
