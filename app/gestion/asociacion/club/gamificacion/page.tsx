'use client';

import Link from 'next/link';
import { Sparkles, ChevronLeft, ExternalLink } from 'lucide-react';
import { GamificacionAdminEditor } from '../../_components/GamificacionAdminEditor';

export default function GamificacionClubAdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al Club
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-md">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Gamificación del Club
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reglas que otorgan puntos al socio: <strong>Club</strong> (RRTT,
            naturales, sorteos…) y <strong>Negocios</strong> (visita validada,
            puntos por plan). Los alcaldes no pueden modificarlas. Si necesitas
            ajustar puntos individuales por recurso (p. ej. SELECTION o una
            cascada lejana), usa{' '}
            <Link
              href="/gestion/asociacion/datos/puntos-recursos"
              className="font-medium text-fuchsia-700 underline hover:text-fuchsia-900"
            >
              Puntos por recurso
            </Link>
            . Para ver TODAS las categorías (también Pueblos y General), usa la{' '}
            <Link
              href="/gestion/asociacion/gamificacion"
              className="inline-flex items-center gap-1 text-fuchsia-700 underline hover:text-fuchsia-900"
            >
              vista global <ExternalLink className="h-3 w-3" />
            </Link>
            .
          </p>
        </div>
      </div>

      <GamificacionAdminEditor categoriaFiltro={['CLUB', 'NEGOCIOS']} />
    </main>
  );
}
