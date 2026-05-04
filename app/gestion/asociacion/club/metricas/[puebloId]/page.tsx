'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconChart } from '../../../_components/asociacion-hero-icons';

const METRICAS_BACK = '/gestion/asociacion/club/metricas';
const METRICAS_BACK_LABEL = 'Volver a métricas del club';

type DiaMetrica = {
  fecha: string;
  total: number;
  ok: number;
  adultos: number;
  menores: number;
};

type Metricas = {
  hoy: {
    total: number;
    ok: number;
    noOk: number;
    adultos: number;
    menores: number;
  };
  ultimosDias: Array<DiaMetrica>;
  ultimosEscaneos: Array<{
    hora: string;
    resultado: 'OK' | 'NO_OK';
    adultosUsados?: number;
    menoresUsados?: number;
  }>;
  recursos?: Array<{
    recursoNombre?: string;
    recursoId?: number;
    total: number;
    ok: number;
    adultos: number;
    menores: number;
    dias?: Array<DiaMetrica>;
  }>;
};

const normalizeMetricas = (raw: any): Metricas => {
  const hoy = raw?.hoy ?? {};
  const dias = Array.isArray(raw?.dias) 
    ? raw.dias 
    : Array.isArray(raw?.ultimosDias) 
      ? raw.ultimosDias 
      : [];
  const escaneos = Array.isArray(raw?.ultimosEscaneos) 
    ? raw.ultimosEscaneos 
    : Array.isArray(raw?.escaneos) 
      ? raw.escaneos 
      : [];
  const recursos = Array.isArray(raw?.recursos) ? raw.recursos : [];

  return {
    hoy: {
      total: Number(hoy.total ?? hoy.count ?? 0),
      ok: Number(hoy.ok ?? hoy.validas ?? 0),
      noOk: Number(hoy.noOk ?? hoy.invalidas ?? 0),
      adultos: Number(hoy.adultos ?? hoy.adultosUsados ?? 0),
      menores: Number(hoy.menores ?? hoy.menoresUsados ?? 0),
    },
    ultimosDias: dias.map((d: any) => ({
      fecha: String(d.fecha ?? d.day ?? d.date ?? ''),
      total: Number(d.total ?? d.count ?? 0),
      ok: Number(d.ok ?? d.validas ?? 0),
      adultos: Number(d.adultos ?? d.adultosUsados ?? 0),
      menores: Number(d.menores ?? d.menoresUsados ?? 0),
    })),
    ultimosEscaneos: escaneos.map((e: any) => ({
      hora: String(e.hora ?? e.time ?? e.timestamp ?? e.scannedAt ?? e.fecha ?? ''),
      resultado: (e.resultado === 'OK' || e.resultado === 'VALID' || e.valid === true) ? 'OK' : 'NO_OK',
      adultosUsados: e.adultosUsados !== undefined ? Number(e.adultosUsados) : undefined,
      menoresUsados: e.menoresUsados !== undefined ? Number(e.menoresUsados) : undefined,
    })),
    recursos: recursos.map((r: any) => ({
      recursoNombre: String(r.recursoNombre ?? r.nombre ?? r.recurso?.nombre ?? '—'),
      recursoId: r.recursoId ?? r.id ?? r.recurso?.id,
      total: Number(r.total ?? r.count ?? 0),
      ok: Number(r.ok ?? r.validas ?? 0),
      adultos: Number(r.adultos ?? r.adultosUsados ?? 0),
      menores: Number(r.menores ?? r.menoresUsados ?? 0),
      dias: Array.isArray(r.dias)
        ? r.dias.map((d: any) => ({
            fecha: String(d.fecha ?? d.day ?? d.date ?? ''),
            total: Number(d.total ?? d.count ?? 0),
            ok: Number(d.ok ?? d.validas ?? 0),
            adultos: Number(d.adultos ?? d.adultosUsados ?? 0),
            menores: Number(d.menores ?? d.menoresUsados ?? 0),
          }))
        : undefined,
    })),
  };
};

export default function ClubMetricasPuebloPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const puebloId = params?.puebloId as string;
  const isGeo = searchParams?.get('tipo') === 'GEO';
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [puebloNombre, setPuebloNombre] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const exportarCSV = async (periodo: 'semana' | 'mes' | 'año') => {
    if (!puebloId) return;
    const days = periodo === 'semana' ? 7 : periodo === 'mes' ? 31 : 365;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    setExportLoading(periodo);
    try {
      const url = `/api/club/validador/metricas-pueblo?puebloId=${puebloId}&from=${fromStr}&to=${toStr}`;
      const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      const m = normalizeMetricas(data);

      const filas: string[] = [];
      const enc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

      filas.push('Resumen por día');
      if (isGeo) {
        filas.push('Fecha,Visitas GPS');
        for (const d of m.ultimosDias) {
          filas.push([d.fecha, d.total].map(enc).join(','));
        }
      } else {
        filas.push('Fecha,Total,OK,Adultos,Menores');
        for (const d of m.ultimosDias) {
          filas.push([d.fecha, d.total, d.ok, d.adultos, d.menores].map(enc).join(','));
        }
      }
      filas.push('');

      if (m.recursos && m.recursos.length > 0) {
        filas.push('Desglose por recurso y fecha');
        if (isGeo) {
          filas.push('Recurso,Fecha,Visitas GPS');
          for (const r of m.recursos) {
            if (r.dias && r.dias.length > 0) {
              for (const d of r.dias) {
                filas.push([r.recursoNombre ?? '', d.fecha, d.total].map(enc).join(','));
              }
            } else {
              filas.push([r.recursoNombre ?? '', '', r.total].map(enc).join(','));
            }
          }
        } else {
          filas.push('Recurso,Fecha,Total,OK,Adultos,Menores');
          for (const r of m.recursos) {
            if (r.dias && r.dias.length > 0) {
              for (const d of r.dias) {
                filas.push([r.recursoNombre ?? '', d.fecha, d.total, d.ok, d.adultos, d.menores].map(enc).join(','));
              }
            } else {
              filas.push([r.recursoNombre ?? '', '', r.total, r.ok, r.adultos, r.menores].map(enc).join(','));
            }
          }
        }
      }

      const csv = filas.join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `metricas-club-${puebloNombre || puebloId}-${periodo}-${fromStr}_${toStr}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError('Error al exportar CSV');
    } finally {
      setExportLoading(null);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!puebloId) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar métricas del pueblo
        const res = await fetch(`/api/club/validador/metricas-pueblo?puebloId=${puebloId}&days=7`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Error cargando métricas');
        }

        const data = await res.json();
        setMetricas(normalizeMetricas(data));

        // Intentar obtener nombre del pueblo
        try {
          const resPueblo = await fetch('/api/pueblos', { cache: 'no-store' });
          if (resPueblo.ok) {
            const pueblos = await resPueblo.json();
            const pueblo = Array.isArray(pueblos) 
              ? pueblos.find((p: any) => p.id === Number(puebloId))
              : null;
            if (pueblo) {
              setPuebloNombre(pueblo.nombre);
            }
          }
        } catch (e) {
          // Ignorar error al obtener nombre
        }
      } catch (e: any) {
        setError('Error cargando métricas');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [puebloId]);

  const shellTitle = isGeo
    ? `Visitas GPS · ${puebloNombre || `Pueblo ${puebloId}`}`
    : `Métricas · ${puebloNombre || `Pueblo ${puebloId}`}`;

  if (loading) {
    return (
      <GestionAsociacionSubpageShell
        title="Métricas del pueblo"
        subtitle="Cargando datos…"
        heroIcon={<AsociacionHeroIconChart />}
        maxWidthClass="max-w-6xl"
        backHref={METRICAS_BACK}
        backLabel={METRICAS_BACK_LABEL}
      >
        <p className="text-muted-foreground">Cargando…</p>
      </GestionAsociacionSubpageShell>
    );
  }

  if (error || !metricas) {
    return (
      <GestionAsociacionSubpageShell
        title="Métricas del pueblo"
        subtitle="Detalle de validaciones"
        heroIcon={<AsociacionHeroIconChart />}
        maxWidthClass="max-w-6xl"
        backHref={METRICAS_BACK}
        backLabel={METRICAS_BACK_LABEL}
      >
        <div className="space-y-4">
          <p className="text-destructive">{error || 'Error cargando métricas'}</p>
          <Link href={METRICAS_BACK} className="text-sm text-primary hover:underline">
            {METRICAS_BACK_LABEL}
          </Link>
        </div>
      </GestionAsociacionSubpageShell>
    );
  }

  return (
    <GestionAsociacionSubpageShell
      title={shellTitle}
      subtitle="Exportación CSV, histórico y escaneos recientes"
      heroIcon={<AsociacionHeroIconChart />}
      maxWidthClass="max-w-6xl"
      backHref={METRICAS_BACK}
      backLabel={METRICAS_BACK_LABEL}
      heroBadges={
        <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <span className="text-lg font-bold">{metricas.hoy.total}</span>
          <span className="ml-1.5 text-xs text-white/70">{isGeo ? 'visitas GPS hoy' : 'intentos hoy'}</span>
        </div>
      }
    >
      {/* HOY */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>HOY</div>
        <div style={{ fontSize: 14 }}>
          {isGeo ? (
            <>{metricas.hoy.total} visitas GPS</>
          ) : (
            <>{metricas.hoy.total} intentos | OK: {metricas.hoy.ok} | NO OK: {metricas.hoy.noOk} | Adultos: {metricas.hoy.adultos} | Menores: {metricas.hoy.menores}</>
          )}
        </div>
      </div>

      {/* Exportar CSV */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>EXPORTAR DATOS</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['semana', 'mes', 'año'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => exportarCSV(p)}
              disabled={!!exportLoading}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: exportLoading ? '#e5e7eb' : '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: exportLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {exportLoading === p ? 'Exportando…' : `CSV ${p === 'semana' ? '7 días' : p === 'mes' ? '31 días' : '365 días'}`}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          Descarga CSV con resumen por día y desglose por recurso y fecha para análisis y publicación.
        </div>
      </div>

      {/* Últimos 7 días */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          {isGeo ? 'GEOLOCALIZACIONES POR DÍA' : 'ÚLTIMOS 7 DÍAS'}
        </div>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>{isGeo ? 'Visitas GPS' : 'Total'}</th>
              {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>OK</th>}
              {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>Adultos</th>}
              {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>Menores</th>}
            </tr>
          </thead>
          <tbody>
            {metricas.ultimosDias.length === 0 ? (
              <tr>
                <td colSpan={isGeo ? 2 : 5} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  No hay datos
                </td>
              </tr>
            ) : (
              metricas.ultimosDias.map((dia, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    {dia.fecha ? new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{dia.total}</td>
                  {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.ok}</td>}
                  {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.adultos}</td>}
                  {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.menores}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Últimos escaneos — solo para RRTT normales (QR) */}
      {!isGeo && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS ESCANEOS</div>
          <div style={{ fontSize: 12, maxHeight: 400, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
            {metricas.ultimosEscaneos.length === 0 ? (
              <div style={{ color: '#666' }}>No hay escaneos recientes</div>
            ) : (
              metricas.ultimosEscaneos.map((escaneo, idx) => {
                const adultosStr = escaneo.adultosUsados !== undefined ? `A: ${escaneo.adultosUsados}` : '';
                const menoresStr = escaneo.menoresUsados !== undefined ? `M: ${escaneo.menoresUsados}` : '';
                const personasStr = [adultosStr, menoresStr].filter(Boolean).join(' / ');
                return (
                  <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                    {escaneo.hora || '—'} — <span style={{ color: escaneo.resultado === 'OK' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {escaneo.resultado === 'OK' ? 'OK' : 'NO OK'}
                    </span>
                    {personasStr && <span style={{ marginLeft: 8, fontSize: 11, color: '#666' }}>({personasStr})</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Desglose por recursos */}
      {metricas.recursos && metricas.recursos.length > 0 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>DESGLOSE POR RECURSOS</div>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Recurso</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>{isGeo ? 'Visitas GPS' : 'Total'}</th>
                {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>OK</th>}
                {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>Adultos</th>}
                {!isGeo && <th style={{ textAlign: 'center', padding: '8px' }}>Menores</th>}
              </tr>
            </thead>
            <tbody>
              {metricas.recursos.flatMap((recurso, idx) => {
                if (recurso.dias && recurso.dias.length > 0) {
                  return recurso.dias.map((dia, dIdx) => (
                    <tr key={`${idx}-${dIdx}`} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{recurso.recursoNombre}</td>
                      <td style={{ padding: '8px' }}>
                        {dia.fecha ? new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{dia.total}</td>
                      {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.ok}</td>}
                      {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.adultos}</td>}
                      {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{dia.menores}</td>}
                    </tr>
                  ));
                }
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{recurso.recursoNombre}</td>
                    <td style={{ padding: '8px', color: '#999' }}>—</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{recurso.total}</td>
                    {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{recurso.ok}</td>}
                    {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{recurso.adultos}</td>}
                    {!isGeo && <td style={{ textAlign: 'center', padding: '8px' }}>{recurso.menores}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GestionAsociacionSubpageShell>
  );
}



