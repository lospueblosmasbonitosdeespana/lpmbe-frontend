'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMisRecursos,
  getMetricasRecurso,
  toggleCerradoTemporal,
  getExportCsvUrl,
  type RecursoTuristico,
  type MetricasRecurso,
} from '@/src/lib/api/club';

export default function ColaboradorPage() {
  const [recursos, setRecursos] = useState<RecursoTuristico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecurso, setSelectedRecurso] = useState<number | null>(null);
  const [metricas, setMetricas] = useState<MetricasRecurso | null>(null);
  const [metricasDays, setMetricasDays] = useState(7);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const loadRecursos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMisRecursos();
      setRecursos(data);
      if (data.length > 0 && !selectedRecurso) {
        setSelectedRecurso(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando recursos');
    } finally {
      setLoading(false);
    }
  }, [selectedRecurso]);

  const loadMetricas = useCallback(async () => {
    if (!selectedRecurso) return;
    try {
      setLoadingMetricas(true);
      const data = await getMetricasRecurso(selectedRecurso, metricasDays);
      setMetricas(data);
    } catch {
      setMetricas(null);
    } finally {
      setLoadingMetricas(false);
    }
  }, [selectedRecurso, metricasDays]);

  useEffect(() => { loadRecursos(); }, [loadRecursos]);
  useEffect(() => { loadMetricas(); }, [loadMetricas]);

  const handleToggleCerrado = async (recurso: RecursoTuristico) => {
    try {
      await toggleCerradoTemporal(recurso.id, !recurso.cerradoTemporal);
      setRecursos((prev) =>
        prev.map((r) =>
          r.id === recurso.id ? { ...r, cerradoTemporal: !r.cerradoTemporal } : r,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Asegúrate de haber iniciado sesión con una cuenta de colaborador.
        </p>
      </div>
    );
  }

  if (recursos.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Sin recursos asignados</h2>
        <p style={{ color: '#6b7280' }}>
          No tienes ningún recurso turístico asignado. Contacta con el alcalde o administrador
          para que te asignen acceso.
        </p>
      </div>
    );
  }

  const recursoActual = recursos.find((r) => r.id === selectedRecurso);

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>Mis Recursos Turísticos</h1>

      {/* Lista de recursos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {recursos.map((r) => (
          <div
            key={r.id}
            onClick={() => setSelectedRecurso(r.id)}
            style={{
              border: selectedRecurso === r.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer',
              background: selectedRecurso === r.id ? '#eff6ff' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{r.nombre}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  {r.pueblo?.nombre ?? `Pueblo ${r.puebloId}`} &middot; {r.tipo}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!r.activo && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    Inactivo
                  </span>
                )}
                {r.cerradoTemporal && (
                  <span style={{ background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    Cerrado
                  </span>
                )}
              </div>
            </div>
            {r.descuentoPorcentaje != null && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#059669' }}>
                {r.descuentoPorcentaje}% descuento
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Detalle y métricas del recurso seleccionado */}
      {recursoActual && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{recursoActual.nombre}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleToggleCerrado(recursoActual)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: recursoActual.cerradoTemporal ? '#fef3c7' : '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {recursoActual.cerradoTemporal ? 'Reabrir recurso' : 'Cerrar temporalmente'}
              </button>
              <a
                href={getExportCsvUrl(recursoActual.id, 30)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  textDecoration: 'none',
                  color: '#374151',
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Exportar CSV
              </a>
            </div>
          </div>

          {/* Selector de días */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setMetricasDays(d)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 4,
                  border: metricasDays === d ? '2px solid #2563eb' : '1px solid #d1d5db',
                  background: metricasDays === d ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: metricasDays === d ? 600 : 400,
                }}
              >
                {d} días
              </button>
            ))}
          </div>

          {loadingMetricas ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
              Cargando métricas...
            </div>
          ) : metricas ? (
            <div>
              {/* Tarjetas resumen HOY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                <MetricaCard label="Validaciones hoy" value={metricas.hoy.ok} />
                <MetricaCard label="Adultos hoy" value={metricas.hoy.adultos} />
                <MetricaCard label="Menores hoy" value={metricas.hoy.menores} />
                <MetricaCard label="Total período" value={metricas.periodo.ok} />
              </div>

              {/* Tabla de últimos escaneos */}
              {metricas.ultimosEscaneos.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>Últimas validaciones</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Fecha</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Hora</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>Resultado</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>Adultos</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>Menores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.ultimosEscaneos.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 12px' }}>
                            {new Date(e.scannedAt).toLocaleDateString('es-ES')}
                          </td>
                          <td style={{ padding: '6px 12px' }}>{e.hora}</td>
                          <td style={{ padding: '6px 12px' }}>
                            <span
                              style={{
                                color: e.resultado === 'OK' ? '#059669' : '#dc2626',
                                fontWeight: 600,
                              }}
                            >
                              {e.resultado}
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{e.adultosUsados}</td>
                          <td style={{ padding: '6px 12px', textAlign: 'right' }}>{e.menoresUsados}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Gráfico simple por días */}
              {metricas.dias.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>Validaciones por día</h3>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
                    {metricas.dias.map((d) => {
                      const maxVal = Math.max(...metricas.dias.map((x) => x.ok), 1);
                      const height = Math.max((d.ok / maxVal) * 100, 2);
                      return (
                        <div
                          key={d.fecha}
                          title={`${d.fecha}: ${d.ok} OK, ${d.adultos} adultos, ${d.menores} menores`}
                          style={{
                            flex: 1,
                            background: d.ok > 0 ? '#3b82f6' : '#e5e7eb',
                            height: `${height}%`,
                            borderRadius: '4px 4px 0 0',
                            minWidth: 8,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {metricas.dias.map((d) => (
                      <div
                        key={d.fecha}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          fontSize: 10,
                          color: '#9ca3af',
                          overflow: 'hidden',
                        }}
                      >
                        {d.fecha.slice(5)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No hay datos de métricas disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricaCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '16px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}
