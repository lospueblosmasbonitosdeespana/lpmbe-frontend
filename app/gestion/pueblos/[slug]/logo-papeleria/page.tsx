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
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">No se pudo cargar el pueblo.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Logo y papelería</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <strong>{pueblo.nombre}</strong> — Sube tu logotipo y documentos de papelería. Puedes marcar los documentos como compartidos para que otros alcaldes puedan verlos y descargarlos.
      </p>
      <LogoPapeleriaClient puebloId={pueblo.id} puebloNombre={pueblo.nombre} puebloSlug={slug} />
    </main>
  );
}
