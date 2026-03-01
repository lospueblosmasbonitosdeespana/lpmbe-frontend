'use client';

export default function DatosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-sm font-medium text-destructive mb-3">
        Error cargando el panel de métricas
      </p>
      <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Reintentar
      </button>
    </div>
  );
}
