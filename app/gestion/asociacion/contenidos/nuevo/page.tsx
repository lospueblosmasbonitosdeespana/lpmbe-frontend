import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NuevoContenidoClient from './NuevoContenidoClient';

export default async function NuevoContenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; category?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;

  return (
    <NuevoContenidoClient
      tipoInicial={params.tipo}
      categoriaInicial={params.category}
    />
  );
}
