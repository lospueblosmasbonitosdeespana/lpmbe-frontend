import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ValidadorGlobalClient from './ValidadorGlobalClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function ValidadorGlobalPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'COLABORADOR') {
    redirect('/cuenta');
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/cuenta"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Mi cuenta
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">
          Validador QR del Club
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecciona un recurso o negocio y valida los carnets del Club con
          pistola lectora QR, cámara o tecleando el código a mano.
        </p>
      </header>

      <ValidadorGlobalClient />
    </main>
  );
}
