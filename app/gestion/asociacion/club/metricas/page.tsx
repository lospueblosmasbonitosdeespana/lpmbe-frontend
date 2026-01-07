'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MetricasResumen = {
  hoy: {
    total: number;
    ok: number;
    noOk: number;
    adultos: number;
    menores: number;
  };
  ultimosDias?: Array<{
    fecha: string;
    total: number;
    ok: number;
    adultos: number;
    menores: number;
  }>;
  porPuebloHoy: Array<{
    puebloId: number;
    puebloNombre: string;
    total: number;
    ok: number;
    adultos: number;
    menores: number;
  }>;
};

const normalizeMetricasResumen = (raw: any): MetricasResumen => {
  const hoy = raw?.hoy ?? {};
  const dias = Array.isArray(raw?.dias) 
    ? raw.dias 
    : Array.isArray(raw?.ultimosDias) 
      ? raw.ultimosDias 
      : [];
  const porPuebloHoy = Array.isArray(raw?.porPuebloHoy) 
    ? raw.porPuebloHoy 
    : Array.isArray(raw?.pueblos) 
      ? raw.pueblos 
      : [];

  return {
    hoy: {
      total: Number(hoy.total ?? hoy.count ?? 0),
      ok: Number(hoy.ok ?? hoy.validas ?? 0),
      noOk: Number(hoy.noOk ?? hoy.invalidas ?? 0),
      adultos: Number(hoy.adultos ?? hoy.adultosUsados ?? 0),
      menores: Number(hoy.menores ?? hoy.menoresUsados ?? 0),
    },
    ultimosDias: dias.length > 0 ? dias.map((d: any) => ({
      fecha: String(d.fecha ?? d.day ?? d.date ?? ''),
      total: Number(d.total ?? d.count ?? 0),
      ok: Number(d.ok ?? d.validas ?? 0),
      adultos: Number(d.adultos ?? d.adultosUsados ?? 0),
      menores: Number(d.menores ?? d.menoresUsados ?? 0),
    })) : undefined,
    porPuebloHoy: porPuebloHoy.map((p: any) => ({
      puebloId: Number(p.puebloId ?? p.id ?? 0),
      puebloNombre: String(p.puebloNombre ?? p.nombre ?? '—'),
      total: Number(p.total ?? p.count ?? 0),
      ok: Number(p.ok ?? p.validas ?? 0),
      adultos: Number(p.adultos ?? p.adultosUsados ?? 0),
      menores: Number(p.menores ?? p.menoresUsados ?? 0),
    })),
  };
};

export default function ClubMetricasPage() {
  const [loading, setLoading] = useState(true);
  const [metricasResumen, setMetricasResumen] = useState<MetricasResumen | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Cargar métricas resumen (ligero, solo HOY)
        const res = await fetch('/api/club/admin/metricas-resumen?days=7', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setMetricasResumen(normalizeMetricasResumen(data));
        } else {
          setError('Error cargando métricas');
        }
      } catch (e: any) {
        setError('Error cargando métricas');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '8px 16px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Métricas (globales)</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/gestion/asociacion/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de amigos
          </Link>
        </div>
      </div>

      {/* TOTAL ASOCIACIÓN */}
      {metricasResumen && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Total asociación</h2>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>HOY</div>
            <div style={{ fontSize: 14 }}>
              {metricasResumen.hoy.total} intentos | OK: {metricasResumen.hoy.ok} | NO OK: {metricasResumen.hoy.noOk} | Adultos: {metricasResumen.hoy.adultos} | Menores: {metricasResumen.hoy.menores}
            </div>
          </div>

          {metricasResumen.ultimosDias && metricasResumen.ultimosDias.length > 0 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Últimos 7 días</div>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>OK</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Adultos</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Menores</th>
                  </tr>
                </thead>
                <tbody>
                  {metricasResumen.ultimosDias.map((dia, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>
                        {dia.fecha ? new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{dia.total}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{dia.ok}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{dia.adultos}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{dia.menores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PUEBLOS */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Pueblos</h2>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Pueblo</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Hoy total</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Hoy OK</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Adultos</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Menores</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Ver detalle</th>
            </tr>
          </thead>
          <tbody>
            {!metricasResumen || metricasResumen.porPuebloHoy.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  No hay pueblos
                </td>
              </tr>
            ) : (
              metricasResumen.porPuebloHoy.map((p) => (
                <tr key={p.puebloId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{p.puebloNombre}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{p.total}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{p.ok}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{p.adultos}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{p.menores}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <Link
                      href={`/gestion/asociacion/club/metricas/${p.puebloId}`}
                      style={{ color: '#0066cc', textDecoration: 'none' }}
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

