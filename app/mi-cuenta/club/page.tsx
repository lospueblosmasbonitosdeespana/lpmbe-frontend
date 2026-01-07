'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

const IS_DEV = process.env.NODE_ENV === 'development';

type ClubMe = {
  isMember: boolean;
  plan: string | null;
  status: string | null;
  validUntil: string | null;
  qrToken?: string | null;
  qrPayload?: string | null;
};

type ClubValidacion = {
  id: number;
  scannedAt: string;
  resultado?: 'OK' | 'CADUCADO' | 'YA_USADO' | 'INVALIDO' | string | null;
  puebloId?: number | null;
  puebloNombre?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
  } | null;
  recursoId?: number | null;
  recursoNombre?: string | null;
  recurso?: {
    id: number;
    nombre: string;
  } | null;
  adultosUsados?: number | null;
  menoresUsados?: number | null;
  descuentoPorcentaje?: number | null;
};

type ClubValidacionesResponse = {
  items?: ClubValidacion[];
  total?: number;
};

type RecursoDisponible = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  codigoQr: string;
  puebloId?: number | null;
  puebloNombre?: string | null;
  activo?: boolean;
};

type Pueblo = {
  id: number;
  nombre: string;
  slug?: string;
};

type QrGenerado = {
  qrPayload: string;
  expiresAt: string;
  recursoId: number;
};

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

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

export default function ClubPage() {
  const [clubMe, setClubMe] = useState<ClubMe | null>(null);
  const [validaciones, setValidaciones] = useState<ClubValidacion[]>([]);
  const [validacionesNoDisponible, setValidacionesNoDisponible] = useState(false);
  const [recursosDisponibles, setRecursosDisponibles] = useState<RecursoDisponible[]>([]);
  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const [recursosDelPuebloSeleccionado, setRecursosDelPuebloSeleccionado] = useState<RecursoDisponible[]>([]);
  const [cargandoRecursos, setCargandoRecursos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codigoQr, setCodigoQr] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroSuccess, setRegistroSuccess] = useState<string | null>(null);

  // Nuevo flujo QR dinámico
  const [puebloSeleccionado, setPuebloSeleccionado] = useState<number | null>(null);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<number | null>(null);
  const [qrGenerado, setQrGenerado] = useState<QrGenerado | null>(null);
  const [generando, setGenerando] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [meRes, validacionesRes, recursosRes] = await Promise.all([
        fetch('/api/club/me', { cache: 'no-store' }),
        fetch('/api/club/validaciones', { cache: 'no-store' }),
        fetch('/api/club/recursos/disponibles', { cache: 'no-store' }),
      ]);

      if (meRes.status === 401 || validacionesRes.status === 401 || recursosRes.status === 401) {
        window.location.href = '/entrar';
        return;
      }

      // Manejar errores 502 (backend no disponible)
      if (meRes.status === 502 || validacionesRes.status === 502 || recursosRes.status === 502) {
        const errorData = await meRes.json().catch(() => validacionesRes.json().catch(() => recursosRes.json().catch(() => null)));
        if (errorData?.error === 'upstream_fetch_failed') {
          setError(`No se pudo conectar al backend. Verifica que el servidor esté ejecutándose en ${errorData.upstream || 'http://localhost:3000'}`);
        } else {
          setError('El backend no está disponible. Verifica que el servidor esté ejecutándose.');
        }
        return;
      }

      if (!meRes.ok) {
        const errorData = await meRes.json().catch(() => null);
        const errorText = errorData?.error || errorData?.detail || await meRes.text().catch(() => 'Error cargando datos del club');
        throw new Error(errorText);
      }

      // Validaciones: si falla con 404/501, no es crítico, solo no las mostramos
      let validaciones: ClubValidacion[] = [];
      if (validacionesRes.ok) {
        const validacionesData: ClubValidacionesResponse = await validacionesRes.json().catch(() => ({}));
        validaciones = Array.isArray(validacionesData) 
          ? validacionesData 
          : (Array.isArray(validacionesData.items) ? validacionesData.items : []);
        setValidacionesNoDisponible(false);
      } else if (validacionesRes.status === 404 || validacionesRes.status === 501) {
        // Endpoint aún no disponible en backend
        validaciones = [];
        setValidacionesNoDisponible(true);
      } else {
        setValidacionesNoDisponible(false);
      }

      // Recursos disponibles: si falla, no es crítico, solo no los mostramos
      let recursos: RecursoDisponible[] = [];
      if (recursosRes.ok) {
        const recursosData = await recursosRes.json().catch(() => ({}));
        recursos = Array.isArray(recursosData) ? recursosData : (Array.isArray(recursosData.items) ? recursosData.items : []);
      }

      const meData = await meRes.json();

      setClubMe(meData);
      setValidaciones(validaciones);
      setRecursosDisponibles(recursos);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  // Cargar todos los pueblos desde el endpoint canónico
  useEffect(() => {
    const cargarPueblos = async () => {
      try {
        const res = await fetch('/api/pueblos', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setPueblos(
          data
            .filter((p: any) => p.id && p.nombre)
            .sort((a: any, b: any) =>
              a.nombre.localeCompare(b.nombre, 'es')
            )
        );
      } catch (e) {
        // Ignorar errores silenciosamente
      }
    };

    cargarPueblos();
  }, []);

  // Cargar recursos del pueblo seleccionado
  useEffect(() => {
    if (!puebloSeleccionado) {
      setRecursosDelPuebloSeleccionado([]);
      return;
    }

    const cargarRecursosDelPueblo = async () => {
      setCargandoRecursos(true);
      try {
        const res = await fetch(`/api/club/recursos/pueblo/${puebloSeleccionado}`, { cache: 'no-store' });
        if (!res.ok) {
          setRecursosDelPuebloSeleccionado([]);
          return;
        }
        const data = await res.json();
        const recursos = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        // Filtrar solo recursos activos
        setRecursosDelPuebloSeleccionado(recursos.filter((r: RecursoDisponible) => r.activo !== false));
      } catch (e) {
        setRecursosDelPuebloSeleccionado([]);
      } finally {
        setCargandoRecursos(false);
      }
    };

    cargarRecursosDelPueblo();
  }, [puebloSeleccionado]);

  // Contador regresivo para QR
  useEffect(() => {
    if (!qrGenerado?.expiresAt) {
      setTiempoRestante(null);
      return;
    }

    const updateTimer = () => {
      const ahora = new Date().getTime();
      const expira = new Date(qrGenerado.expiresAt).getTime();
      const restante = Math.max(0, Math.floor((expira - ahora) / 1000));
      setTiempoRestante(restante);

      if (restante <= 0) {
        setQrGenerado(null);
        setRecursoSeleccionado(null);
        setQrError(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrGenerado]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset recurso y QR cuando cambia el pueblo
  useEffect(() => {
    setRecursoSeleccionado(null);
    setQrGenerado(null);
    setQrError(null);
    setTiempoRestante(null);
  }, [puebloSeleccionado]);

  async function handleRegistrarVisita() {
    if (!codigoQr.trim()) {
      setRegistroError('El código QR no puede estar vacío');
      return;
    }

    setRegistrando(true);
    setRegistroError(null);
    setRegistroSuccess(null);

    try {
      const res = await fetch('/api/club/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoQr: codigoQr.trim(),
          origen: 'WEB',
          meta: { source: 'web-demo' },
        }),
      });

      // Manejar error 502 (backend no disponible)
      if (res.status === 502) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData?.error === 'upstream_fetch_failed') {
          setRegistroError(`No se pudo conectar al backend. Verifica que el servidor esté ejecutándose.`);
        } else {
          setRegistroError('El backend no está disponible. Verifica que el servidor esté ejecutándose.');
        }
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setRegistroError('No eres miembro del Club');
        return;
      }

      if (res.status === 404) {
        setRegistroError('QR no encontrado');
        return;
      }

      if (!res.ok) {
        const errorText = data.error || data.detail || data.message || 'Error al registrar visita';
        setRegistroError(errorText);
        return;
      }

      if (data.duplicated === true) {
        setRegistroSuccess('Ya estaba registrado');
      } else {
        setRegistroSuccess('Visita registrada correctamente');
      }

      setCodigoQr('');
      await loadData();
    } catch (e: any) {
      setRegistroError(e?.message ?? 'Error desconocido');
    } finally {
      setRegistrando(false);
    }
  }

  async function handleGenerarQR() {
    if (!recursoSeleccionado) {
      setQrError('Selecciona un recurso');
      return;
    }

    setGenerando(true);
    setQrError(null);

    try {
      const res = await fetch('/api/club/qr/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recursoId: recursoSeleccionado,
        }),
      });

      if (res.status === 502) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData?.error === 'upstream_fetch_failed') {
          setQrError('No se pudo conectar al backend. Verifica que el servidor esté ejecutándose.');
        } else {
          setQrError('El backend no está disponible.');
        }
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || errorData?.detail || await res.text().catch(() => 'Error generando QR');
        setQrError(errorText);
        return;
      }

      const data = await res.json();
      setQrGenerado({
        qrPayload: data.qrPayload,
        expiresAt: data.expiresAt,
        recursoId: recursoSeleccionado,
      });
    } catch (e: any) {
      setQrError(e?.message ?? 'Error desconocido');
    } finally {
      setGenerando(false);
    }
  }

  function formatTiempoRestante(segundos: number): string {
    if (segundos <= 0) return 'Caducado';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Club de Amigos</h1>
        <div className="p-4 border rounded text-sm text-gray-600">Cargando...</div>
      </section>
    );
  }

  if (error && !clubMe) {
    return (
      <section className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Club de Amigos</h1>
        <div className="p-4 border rounded text-sm text-red-600">{error}</div>
        <Link href="/mi-cuenta" className="text-sm text-blue-600 hover:underline">
          ← Volver a Mi Cuenta
        </Link>
      </section>
    );
  }

  const validacionesMostradas = validaciones.slice(0, 30);

  // Helper para verificar si un recurso fue visitado
  const esRecursoVisitado = (recursoId: number): { visitado: boolean; hoy: boolean } => {
    const validacionesOk = validaciones.filter(v => v.resultado === 'OK' && v.recursoId === recursoId);
    if (validacionesOk.length === 0) {
      return { visitado: false, hoy: false };
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const visitadoHoy = validacionesOk.some(v => {
      const fecha = new Date(v.scannedAt);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    });
    
    return { visitado: true, hoy: visitadoHoy };
  };

  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Club de Amigos</h1>
        <Link href="/mi-cuenta" className="text-sm text-gray-600 hover:underline">
          ← Volver
        </Link>
      </div>

      {/* Estado */}
      <div className="p-4 border rounded space-y-2">
        <h2 className="font-medium">Estado</h2>
        <div>
          <span className="text-sm text-gray-600">Miembro: </span>
          <span className="font-medium">{clubMe?.isMember ? 'ACTIVO' : 'NO ACTIVO'}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Plan: </span>
          <span className="font-medium">{clubMe?.plan ?? '—'}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Status: </span>
          <span className="font-medium">{clubMe?.status ?? '—'}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Válido hasta: </span>
          <span className="font-medium">{formatFecha(clubMe?.validUntil)}</span>
        </div>
      </div>

      {/* Tu código de acceso */}
      {clubMe?.isMember && (
        <div className="p-4 border rounded space-y-3">
          <h2 className="font-medium">Tu código de acceso</h2>
          <p className="text-sm text-gray-600">
            Selecciona el recurso que vas a visitar y muestra este código en la entrada.
          </p>
          
          {!qrGenerado && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pueblo</label>
                <select
                  value={puebloSeleccionado ?? ''}
                  onChange={(e) => setPuebloSeleccionado(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded"
                  disabled={generando}
                >
                  <option value="">Selecciona un pueblo</option>
                  {pueblos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {puebloSeleccionado && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Recurso</label>
                  {cargandoRecursos ? (
                    <div className="text-sm text-gray-600 py-2">Cargando recursos...</div>
                  ) : recursosDelPuebloSeleccionado.length === 0 ? (
                    <div className="text-sm text-gray-600 py-2">
                      Este pueblo no tiene recursos disponibles
                    </div>
                  ) : (
                    <select
                      value={recursoSeleccionado ?? ''}
                      onChange={(e) => setRecursoSeleccionado(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border rounded"
                      disabled={generando}
                    >
                      <option value="">Selecciona un recurso</option>
                      {recursosDelPuebloSeleccionado.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} {r.descuentoPorcentaje ? `(${r.descuentoPorcentaje}%)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerarQR}
                disabled={generando || !recursoSeleccionado || recursosDelPuebloSeleccionado.length === 0}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {generando ? 'Generando…' : 'Mostrar QR'}
              </button>

              {qrError && (
                <div className="text-sm text-red-600">{qrError}</div>
              )}
            </>
          )}

          {qrGenerado && (
            <div className="mt-4 p-4 border rounded space-y-3 bg-gray-50">
              {/* QR visual */}
              <div className="p-4 border rounded bg-white text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrGenerado.qrPayload)}`}
                  alt="Código QR"
                  className="mx-auto"
                  style={{ maxWidth: '300px', width: '100%', height: 'auto' }}
                />
              </div>
              
              <p className="text-xs text-gray-600 text-center">
                Muestra este código en el acceso al recurso
              </p>

              {tiempoRestante !== null && (
                <div className="text-sm text-gray-600 text-center">
                  Expira en: <strong>{formatTiempoRestante(tiempoRestante)}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Descuentos en recursos turísticos */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Descuentos en recursos turísticos</h2>
        {recursosDisponibles.length === 0 ? (
          <div className="text-sm text-gray-600">No hay recursos disponibles con descuentos.</div>
        ) : (
          <div className="space-y-3">
            {recursosDisponibles.map((r) => {
              const { visitado, hoy } = esRecursoVisitado(r.id);
              return (
                <div key={r.id} className="p-3 border rounded space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="text-gray-600">Pueblo: </span>
                        <span className="font-medium">{r.puebloNombre ?? r.puebloId ?? '—'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Nombre: </span>
                        <span className="font-medium">{r.nombre}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Tipo: </span>
                        <span className="font-medium">{r.tipo || '—'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Precio: </span>
                        <span className="font-medium">
                          {r.precioCents ? `${(r.precioCents / 100).toFixed(2)} €` : '—'}
                        </span>
                      </div>
                      {r.descuentoPorcentaje && r.precioCents && (
                        <div className="text-sm text-green-600 font-medium">
                          Con descuento: {((r.precioCents / 100) * (1 - r.descuentoPorcentaje / 100)).toFixed(2)} €
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-gray-600">Descuento: </span>
                        <span className="font-medium">
                          {r.descuentoPorcentaje !== null && r.descuentoPorcentaje !== undefined
                            ? `${r.descuentoPorcentaje}%`
                            : '—'}
                        </span>
                      </div>
                      {clubMe?.isMember && (
                        <div className="text-sm">
                          <span className="text-gray-600">Código QR: </span>
                          <span className="font-mono text-xs break-all">{r.codigoQr}</span>
                        </div>
                      )}
                    </div>
                    {visitado && (
                      <div className="ml-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          hoy ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {hoy ? 'VISITADO HOY' : 'VISITADO'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de validaciones */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Historial de validaciones</h2>
        <p className="text-sm text-gray-600">
          Aquí puedes ver los beneficios del Club de Amigos que ya has utilizado.
        </p>
        
        {validacionesNoDisponible && (
          <p className="text-sm text-gray-500 mt-4">
            Historial no disponible todavía.
          </p>
        )}

        {!validacionesNoDisponible && validaciones.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">
            Aún no has utilizado ningún beneficio del Club.
          </p>
        )}

        {validaciones.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha/Hora</th>
                  <th className="px-3 py-2 text-left">Pueblo</th>
                  <th className="px-3 py-2 text-left">Recurso</th>
                  <th className="px-3 py-2 text-center">Resultado</th>
                  <th className="px-3 py-2 text-center">Adultos</th>
                  <th className="px-3 py-2 text-center">Menores</th>
                  <th className="px-3 py-2 text-center">Descuento aplicado</th>
                </tr>
              </thead>
              <tbody>
                {validaciones.map((v, idx) => {
                  const fechaHora = formatFechaHora(v.scannedAt);
                  const estadoOk = v.resultado === 'OK';

                  return (
                    <tr
                      key={`${v.scannedAt ?? ""}-${v.puebloNombre ?? ""}-${v.recursoNombre ?? ""}-${idx}`}
                      className="border-t"
                    >
                      <td className="px-3 py-2">{fechaHora}</td>
                      <td className="px-3 py-2">{v.puebloNombre || v.pueblo?.nombre || '—'}</td>
                      <td className="px-3 py-2">{v.recursoNombre || v.recurso?.nombre || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`font-semibold ${
                            estadoOk ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {estadoOk ? 'OK' : (v.resultado || 'NO OK')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {v.adultosUsados ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {v.menoresUsados ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
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
        )}
      </div>

      {/* Registrar visita (demo) - SOLO DEV */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 border rounded space-y-3">
          <h2 className="font-medium">Registrar visita (demo) [SOLO DEV]</h2>
          <div className="text-xs text-gray-500 mb-2">
            Esta sección será movida a /validador en el futuro
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código QR</label>
            <input
              type="text"
              value={codigoQr}
              onChange={(e) => setCodigoQr(e.target.value)}
              disabled={registrando}
              placeholder="Introduce el código QR"
              className="w-full px-3 py-2 border rounded disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={handleRegistrarVisita}
            disabled={registrando || !codigoQr.trim()}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {registrando ? 'Registrando…' : 'Registrar'}
          </button>
          {registroError && (
            <div className="text-sm text-red-600">{registroError}</div>
          )}
          {registroSuccess && (
            <div className="text-sm text-green-600">{registroSuccess}</div>
          )}
        </div>
      )}
    </section>
  );
}
