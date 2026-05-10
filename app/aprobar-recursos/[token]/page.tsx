import type { Metadata } from 'next';
import AprobarRecursosClient from './AprobarRecursosClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const metadata: Metadata = {
  title: 'Aprobar recursos turísticos',
  description:
    'Validación de recursos turísticos pre-cargados para alcaldes de Los Pueblos Más Bonitos de España.',
  robots: { index: false, follow: false },
};

export default async function AprobarRecursosPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { token } = await params;
  const { modo } = await searchParams;
  return (
    <AprobarRecursosClient
      token={token}
      modoInicial={modo === 'todos' ? 'todos' : 'revisar'}
    />
  );
}
