'use client';

import { useEffect, useState } from 'react';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  codigoQr: string;
  scope?: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
};

export default function RecursosAsociacionClient() {
  const [items, setItems] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/club/recursos/asociacion')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar los recursos');
        return res.json();
      })
      .then((data: Recurso[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Error desconocido');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Cargando recursos…
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

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Recurso</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Código QR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay recursos de asociación creados.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {r.tipo?.toLowerCase().replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.activo ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {r.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.descuentoPorcentaje != null ? `${r.descuentoPorcentaje}%` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.codigoQr}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Total: {items.length} recurso{items.length !== 1 ? 's' : ''} de asociación
      </div>
    </div>
  );
}
