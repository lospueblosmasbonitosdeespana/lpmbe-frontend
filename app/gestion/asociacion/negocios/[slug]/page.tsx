import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NegociosPuebloClient from './NegociosPuebloClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function NegociosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  const { slug } = await params;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <NegociosPuebloClient puebloSlug={slug} />

      <div className="mt-8 text-sm">
        <Link className="text-gray-500 hover:underline" href="/gestion/asociacion/negocios">
          &larr; Volver a Negocios
        </Link>
      </div>
    </main>
  );
}
