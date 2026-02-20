'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  cerradoTemporal: boolean;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  scope?: string;
};

export default function MisRecursosClient() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/club/mis-recursos');

        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }

        if (res.status === 502) {
          const errData = await res.json().catch(() => null);
          setError(
            errData?.error === 'upstream_fetch_failed'
              ? 'No se pudo conectar al backend.'
              : 'El backend no está disponible.'
          );
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          setError(errData?.message || errData?.error || 'Error cargando recursos');
          return;
        }

        const data = await res.json();
        setRecursos(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-6 text-gray-500">Cargando recursos...</div>
    );
  }

  if (recursos.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
        No tienes recursos asignados.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {recursos.map((r) => {
        const scopeLabel = r.pueblo ? r.pueblo.nombre : 'Asociación';

        return (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{r.nombre}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {r.tipo}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.pueblo
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {scopeLabel}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                <span
                  className={
                    r.activo
                      ? 'text-green-600 font-medium'
                      : 'text-gray-400'
                  }
                >
                  {r.activo ? 'Activo' : 'Inactivo'}
                </span>
                {r.cerradoTemporal && (
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">
                    Cerrado temporal
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/gestion/mis-recursos/${r.id}`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Editar
            </Link>
          </div>
        );
      })}
    </div>
  );
}
