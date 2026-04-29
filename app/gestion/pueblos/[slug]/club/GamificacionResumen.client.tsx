'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';

type Regla = {
  id: number;
  key: string;
  nombre: string;
  descripcion: string | null;
  puntos: number;
  activo: boolean;
  categoria: string;
};

/**
 * Tarjeta resumen de gamificación visible para alcaldes y admins en la página
 * del Club del pueblo. Muestra qué puntúa cada acción del Club. Solo lectura.
 */
export default function GamificacionResumen() {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/club/admin/gamificacion', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        setReglas(
          arr
            .filter((r: any) => (r.categoria ?? 'CLUB') === 'CLUB' && r.activo)
            .sort((a: any, b: any) => a.orden - b.orden),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (reglas.length === 0) return null;

  const principal = reglas.find((r) => r.key === 'RECURSO_VISITADO') ?? reglas[0];
  const otros = reglas.filter((r) => r.id !== principal.id);

  return (
    <div className="mb-6 rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/80 to-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="text-base font-semibold text-foreground">
              Gamificación del Club
            </div>
            <p className="text-sm text-muted-foreground">
              Cada visita validada de un recurso turístico de tu pueblo suma{' '}
              <strong className="text-fuchsia-700">+{principal.puntos} pts</strong>{' '}
              al socio del Club.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
          <Lock className="h-3 w-3" /> Solo el admin de la asociación puede cambiar estos valores
        </span>
      </div>

      {otros.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-fuchsia-700 hover:text-fuchsia-900"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? 'Ocultar' : 'Ver'} otras reglas del Club ({otros.length})
          </button>
          {open && (
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {otros.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs"
                >
                  <span className="truncate">
                    <code className="rounded bg-fuchsia-100 px-1.5 py-0.5 text-[10px] font-mono text-fuchsia-800">
                      {r.key}
                    </code>{' '}
                    <span className="text-muted-foreground">{r.nombre}</span>
                  </span>
                  <span className="shrink-0 font-mono text-fuchsia-700">+{r.puntos}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
