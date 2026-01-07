'use client';

import { useEffect, useState } from 'react';

type MetricasHoy = {
  total: number;
  ok: number;
  noOk: number;
  adultos: number;
  menores: number;
};

export default function MetricasResumen({ puebloId }: { puebloId: number }) {
  const [metricas, setMetricas] = useState<MetricasHoy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetricas() {
      try {
        const res = await fetch(`/api/club/validador/metricas-pueblo?puebloId=${puebloId}&days=7`, {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const hoy = data?.hoy ?? {};
          setMetricas({
            total: Number(hoy.total ?? hoy.count ?? 0),
            ok: Number(hoy.ok ?? hoy.validas ?? 0),
            noOk: Number(hoy.noOk ?? hoy.invalidas ?? 0),
            adultos: Number(hoy.adultos ?? hoy.adultosUsados ?? 0),
            menores: Number(hoy.menores ?? hoy.menoresUsados ?? 0),
          });
        }
      } catch (e) {
        // Ignorar errores silenciosamente
      } finally {
        setLoading(false);
      }
    }

    loadMetricas();
  }, [puebloId]);

  if (loading) {
    return <div className="mt-1 text-xs text-gray-500">Cargando métricas...</div>;
  }

  if (!metricas) {
    return null;
  }

  return (
    <div className="mt-1 text-xs text-gray-600">
      HOY: {metricas.total} intentos | OK: {metricas.ok} | NO OK: {metricas.noOk} | Adultos: {metricas.adultos} | Menores: {metricas.menores}
    </div>
  );
}


