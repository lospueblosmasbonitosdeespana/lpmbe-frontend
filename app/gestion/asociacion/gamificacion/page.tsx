'use client';

import Link from 'next/link';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { GamificacionAdminEditor } from '../_components/GamificacionAdminEditor';

export default function GamificacionGlobalAdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/gestion/asociacion"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a Gestión de la asociación
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-md">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Gamificación · web completa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Único sitio donde se editan los puntos de cualquier mecánica de la
            web. Agrupado por categorías:{' '}
            <strong>Club</strong>, <strong>Pueblos</strong>, <strong>Negocios</strong> y{' '}
            <strong>General</strong>. Solo los administradores pueden modificar
            puntos. Los alcaldes pueden consultarlos pero nunca tocarlos.
          </p>
        </div>
      </div>

      <GamificacionAdminEditor />
    </main>
  );
}
