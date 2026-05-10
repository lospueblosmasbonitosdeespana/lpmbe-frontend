'use client';

import { useState } from 'react';
import { AgenteEjecucion } from '../_types';

interface Props {
  initial: AgenteEjecucion[];
}

export function PendientesClient({ initial }: Props) {
  const [items, setItems] = useState<AgenteEjecucion[]>(initial);
  const [busy, setBusy] = useState<number | null>(null);

  const refresh = async () => {
    const r = await fetch('/api/admin/agentes/pendientes?limit=100', {
      cache: 'no-store',
    });
    if (r.ok) setItems(await r.json());
  };

  const accion = async (id: number, tipo: 'aprobar' | 'rechazar') => {
    const notas = tipo === 'rechazar'
      ? prompt('Motivo del rechazo (opcional):') ?? undefined
      : undefined;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/agentes/pendientes/${id}/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas }),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        alert(r?.error || r?.message || `HTTP ${res.status}`);
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
        No hay nada pendiente. Todo aprobado.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
                {item.agenteNombre}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                #{item.id} · {new Date(item.startedAt).toLocaleString('es-ES')}
                {item.modeloIa ? ` · ${item.modeloIa}` : ''}
                {item.costeEstimadoEur
                  ? ` · ${Number(item.costeEstimadoEur).toFixed(4)} €`
                  : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => accion(item.id, 'aprobar')}
                disabled={busy === item.id}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => accion(item.id, 'rechazar')}
                disabled={busy === item.id}
                className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-slate-600">
              Ver salida
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-white p-3 text-[11px] leading-relaxed text-slate-800 ring-1 ring-slate-200">
{JSON.stringify(item.output, null, 2)}
            </pre>
          </details>

          {item.input ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-medium text-slate-500">
                Ver input
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
{JSON.stringify(item.input, null, 2)}
              </pre>
            </details>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
