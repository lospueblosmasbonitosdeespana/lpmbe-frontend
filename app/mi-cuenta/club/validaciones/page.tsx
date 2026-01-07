'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useValidacionesClub } from '../_components/useValidacionesClub';

function formatFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function ValidacionesPage() {
  const { loading, error, data: validaciones, noDisponible } = useValidacionesClub();
  const [visibleCount, setVisibleCount] = useState(20);
  const [filtroResultado, setFiltroResultado] = useState<'TODOS' | 'OK' | 'NO_OK'>('TODOS');

  const validacionesFiltradas = useMemo(() => {
    let filtradas = validaciones;
    
    if (filtroResultado === 'OK') {
      filtradas = filtradas.filter(v => v.resultado === 'OK');
    } else if (filtroResultado === 'NO_OK') {
      filtradas = filtradas.filter(v => v.resultado !== 'OK');
    }
    
    return filtradas;
  }, [validaciones, filtroResultado]);

  const validacionesVisibles = validacionesFiltradas.slice(0, visibleCount);
  const hayMas = validacionesFiltradas.length > visibleCount;

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
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de Amigos
          </Link>
        </div>
      </div>
    );
  }

  if (noDisponible) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 14, color: '#666' }}>Historial no disponible todavía.</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de Amigos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Historial de validaciones</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de Amigos
          </Link>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 14, marginRight: 8 }}>Resultado:</label>
        <select
          value={filtroResultado}
          onChange={(e) => {
            setFiltroResultado(e.target.value as 'TODOS' | 'OK' | 'NO_OK');
            setVisibleCount(20);
          }}
          style={{ padding: '4px 8px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
        >
          <option value="TODOS">TODOS</option>
          <option value="OK">OK</option>
          <option value="NO_OK">NO OK</option>
        </select>
      </div>

      {validacionesFiltradas.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>
          {filtroResultado === 'TODOS' 
            ? 'Aún no has utilizado ningún beneficio del Club.'
            : `No hay validaciones con resultado ${filtroResultado === 'OK' ? 'OK' : 'NO OK'}.`}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
            Mostrando {validacionesVisibles.length} de {validacionesFiltradas.length} registros
          </div>
          
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Fecha/Hora</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pueblo</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Recurso</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Resultado</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Adultos</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Menores</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Descuento aplicado</th>
                </tr>
              </thead>
              <tbody>
                {validacionesVisibles.map((v, idx) => {
                  const fechaHora = formatFechaHora(v.scannedAt);
                  const estadoOk = v.resultado === 'OK';

                  return (
                    <tr
                      key={`${v.scannedAt ?? ""}-${v.puebloNombre ?? ""}-${v.recursoNombre ?? ""}-${idx}`}
                      style={{ borderBottom: '1px solid #eee' }}
                    >
                      <td style={{ padding: '8px' }}>{fechaHora}</td>
                      <td style={{ padding: '8px' }}>{v.puebloNombre || v.pueblo?.nombre || '—'}</td>
                      <td style={{ padding: '8px' }}>{v.recursoNombre || v.recurso?.nombre || '—'}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: estadoOk ? '#22c55e' : '#ef4444'
                          }}
                        >
                          {estadoOk ? 'OK' : (v.resultado || 'NO OK')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {v.adultosUsados ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {v.menoresUsados ?? '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {v.descuentoPorcentaje
                          ? `–${v.descuentoPorcentaje}%`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hayMas && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 20)}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Mostrar 20 más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

