'use client';

import { useEffect, useState } from 'react';

type MetricasHoy = {
  total: number;
  ok: number;
  gpsOk: number;
  qrOk: number;
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
            gpsOk: Number(hoy.gpsOk ?? 0),
            qrOk: Number(hoy.qrOk ?? 0),
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
    return <div className="mt-1 text-xs text-muted-foreground">Cargando métricas...</div>;
  }

  if (!metricas) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>HOY:</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
        {metricas.total} intentos
      </span>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
        OK: {metricas.ok}
      </span>
      <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
        GPS: {metricas.gpsOk}
      </span>
      <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
        QR: {metricas.qrOk}
      </span>
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
        NO OK: {metricas.noOk}
      </span>
      <span>Adultos: {metricas.adultos}</span>
      <span>Menores: {metricas.menores}</span>
    </div>
  );
}



