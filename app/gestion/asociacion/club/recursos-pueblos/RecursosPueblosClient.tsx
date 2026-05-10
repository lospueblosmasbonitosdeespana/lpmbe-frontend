'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import ValidarConAlcaldeModal from './ValidarConAlcaldeModal';

type PuebloRecursos = {
  id: number;
  nombre: string;
  slug: string;
  /** Recursos activos (los que ve el público). */
  count: number;
  /** Recursos pre-cargados por IA pendientes de validar (activo=false + precargadoPorIa=true). */
  precargadosPendientes: number;
  /** ISO datetime del último envío al alcalde, si lo hubo. */
  ultimoEnvioAt: string | null;
  /** ISO datetime del momento en que el alcalde aprobó (token usado). */
  validadoAt: string | null;
};

export default function RecursosPueblosClient() {
  const [items, setItems] = useState<PuebloRecursos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPueblo, setModalPueblo] = useState<PuebloRecursos | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        '/api/admin/club/preload-validation/pueblos-recursos-extendido',
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error('Error al cargar los datos');
      const data: PuebloRecursos[] = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Cargando pueblos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const totalRecursos = items.reduce((s, p) => s + (p.count ?? 0), 0);
  const totalPrecargados = items.reduce(
    (s, p) => s + (p.precargadosPendientes ?? 0),
    0,
  );
  const pueblosConRecursos = items.filter((p) => (p.count ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-medium text-gray-700">
          {items.length} pueblos
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {pueblosConRecursos} con recursos activos
        </span>
        <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
          {totalRecursos} recursos en total
        </span>
        {totalPrecargados > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900">
            ⏳ {totalPrecargados} precargados por IA pendientes de validar
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Pueblo</th>
                <th className="w-24 px-4 py-3 text-center">Activos</th>
                <th className="w-32 px-4 py-3 text-center">Pre-cargados</th>
                <th className="w-44 px-4 py-3">Email al alcalde</th>
                <th className="w-32 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No hay datos
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const tienePendientes = (p.precargadosPendientes ?? 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{p.nombre}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 font-semibold ${
                            (p.count ?? 0) > 0
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {p.count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tienePendientes ? (
                          <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-amber-100 px-2 font-semibold text-amber-900">
                            {p.precargadosPendientes}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <EstadoEnvio
                          ultimoEnvioAt={p.ultimoEnvioAt}
                          validadoAt={p.validadoAt}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {tienePendientes ? (
                            <button
                              type="button"
                              onClick={() => setModalPueblo(p)}
                              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                            >
                              Validar con alcalde
                            </button>
                          ) : null}
                          <Link
                            href={`/gestion/pueblos/${p.slug}/club`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Ver →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalPueblo ? (
        <ValidarConAlcaldeModal
          pueblo={modalPueblo}
          onClose={() => setModalPueblo(null)}
          onSent={() => {
            setModalPueblo(null);
            cargar();
          }}
        />
      ) : null}
    </div>
  );
}

function EstadoEnvio({
  ultimoEnvioAt,
  validadoAt,
}: {
  ultimoEnvioAt: string | null;
  validadoAt: string | null;
}) {
  if (validadoAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900">
        ✓ Validado {fechaCorta(validadoAt)}
      </span>
    );
  }
  if (ultimoEnvioAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-900">
        Enviado {fechaCorta(ultimoEnvioAt)}
      </span>
    );
  }
  return <span className="text-muted-foreground">Sin enviar</span>;
}

function fechaCorta(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}
