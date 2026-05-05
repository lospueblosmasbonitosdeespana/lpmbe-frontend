'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Metricas = {
  hoy: {
    total: number;
    ok: number;
    noOk: number;
    adultos: number;
    menores: number;
  };
  ultimosDias: Array<{
    fecha: string;
    total: number;
    ok: number;
    adultos: number;
    menores: number;
  }>;
  ultimosEscaneos: Array<{
    hora: string;
    resultado: 'OK' | 'NO_OK';
    adultosUsados?: number;
    menoresUsados?: number;
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
  };
};

export default function ClubMetricasPuebloPage() {
  const params = useParams();
  const puebloId = params?.puebloId as string;
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas>(() => normalizeMetricas(null));
  const [puebloNombre, setPuebloNombre] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!puebloId) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar métricas del pueblo
        const res = await fetch(`/api/club/validador/metricas-pueblo?puebloId=${puebloId}&days=7`, {
          cache: 'no-store',
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
        <div style={{ marginTop: 16 }}>
          <Link href="/gestion/asociacion/club/metricas" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a métricas globales
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Métricas Club de Amigos {puebloNombre && `- ${puebloNombre}`}
        </h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/gestion/asociacion/club/metricas" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a métricas globales
          </Link>
        </div>
      </div>

      {/* HOY */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>HOY</div>
        <div style={{ fontSize: 14 }}>
          {metricas.hoy.total} intentos | OK: {metricas.hoy.ok} | NO OK: {metricas.hoy.noOk} | Adultos: {metricas.hoy.adultos} | Menores: {metricas.hoy.menores}
        </div>
      </div>

      {/* Últimos 7 días */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS 7 DÍAS</div>
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
            {metricas.ultimosDias.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
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
                  <td style={{ textAlign: 'center', padding: '8px' }}>{dia.ok}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{dia.adultos}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{dia.menores}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Últimos escaneos */}
      <div>
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
    </div>
  );
}

