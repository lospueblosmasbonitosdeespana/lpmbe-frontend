'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">Algo salió mal</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Ha ocurrido un error cargando esta página. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
