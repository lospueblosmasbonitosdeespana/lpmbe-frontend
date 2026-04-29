import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mountain, ChevronLeft } from 'lucide-react';
import { getMeServer } from '@/lib/me';
import RecursosRuralesAdmin from '../_components/RecursosRuralesAdmin';

export const dynamic = 'force-dynamic';

export default async function RecursosRuralesAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/gestion/asociacion"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a Gestión de la asociación
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
          <Mountain className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Recursos rurales / naturales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cascadas, miradores, parajes, dólmenes, ermitas en ruta…{' '}
            <strong>Sin QR</strong>: el socio del Club valida la visita por
            geolocalización (GPS). Aquí gestionas los recursos de la{' '}
            <strong>asociación</strong> (fuera de pueblos) y consultas los de
            cada pueblo de la red.
          </p>
        </div>
      </div>

      <RecursosRuralesAdmin />
    </main>
  );
}
