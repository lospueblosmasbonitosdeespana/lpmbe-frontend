'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ClubMe = {
  isMember: boolean;
  plan: string | null;
  status: string | null;
  validUntil: string | null;
  qrToken?: string | null;
  qrPayload?: string | null;
};

type ClubVisita = {
  id: number;
  scannedAt: string;
  puntos?: number | null;
  puebloId?: number | null;
  recurso?: {
    id: number;
    nombre: string;
    tipo: string;
    codigoQr: string;
    puebloId?: number | null;
  };
};

type ClubVisitasResponse = {
  items?: ClubVisita[];
  total?: number;
};

type RecursoDisponible = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  codigoQr: string;
  puebloId?: number | null;
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
  const [visitas, setVisitas] = useState<ClubVisita[]>([]);
  const [recursosDisponibles, setRecursosDisponibles] = useState<RecursoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codigoQr, setCodigoQr] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroSuccess, setRegistroSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [meRes, visitasRes, recursosRes] = await Promise.all([
        fetch('/api/club/me'),
        fetch('/api/club/visitas'),
        fetch('/api/club/recursos/disponibles'),
      ]);

      if (meRes.status === 401 || visitasRes.status === 401 || recursosRes.status === 401) {
        window.location.href = '/entrar';
        return;
      }

      // Manejar errores 502 (backend no disponible)
      if (meRes.status === 502 || visitasRes.status === 502 || recursosRes.status === 502) {
        const errorData = await meRes.json().catch(() => visitasRes.json().catch(() => recursosRes.json().catch(() => null)));
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

      if (!visitasRes.ok) {
        const errorData = await visitasRes.json().catch(() => null);
        const errorText = errorData?.error || errorData?.detail || await visitasRes.text().catch(() => 'Error cargando visitas');
        throw new Error(errorText);
      }

      // Recursos disponibles: si falla, no es crítico, solo no los mostramos
      let recursos: RecursoDisponible[] = [];
      if (recursosRes.ok) {
        const recursosData = await recursosRes.json().catch(() => ({}));
        recursos = Array.isArray(recursosData) ? recursosData : (Array.isArray(recursosData.items) ? recursosData.items : []);
      }

      const meData = await meRes.json();
      const visitasData: ClubVisitasResponse = await visitasRes.json();

      setClubMe(meData);
      setVisitas(Array.isArray(visitasData.items) ? visitasData.items : []);
      setRecursosDisponibles(recursos);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleCopiarQR() {
    if (!clubMe?.qrPayload) return;

    try {
      await navigator.clipboard.writeText(clubMe.qrPayload);
      setRegistroSuccess('QR copiado al portapapeles');
      setTimeout(() => setRegistroSuccess(null), 2000);
    } catch (e) {
      setRegistroError('No se pudo copiar al portapapeles');
    }
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

  const visitasMostradas = visitas.slice(0, 30);

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

      {/* Tu QR */}
      {(clubMe?.qrPayload || clubMe?.qrToken) && (
        <div className="p-4 border rounded space-y-3">
          <h2 className="font-medium">Tu QR (para app)</h2>
          {clubMe.qrPayload && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Payload:</div>
              <div className="p-2 border rounded bg-gray-50 font-mono text-sm break-all">
                {clubMe.qrPayload}
              </div>
            </div>
          )}
          {clubMe.qrToken && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Token:</div>
              <div className="p-2 border rounded bg-gray-50 font-mono text-sm break-all">
                {clubMe.qrToken}
              </div>
            </div>
          )}
          {clubMe.qrPayload && (
            <button
              type="button"
              onClick={handleCopiarQR}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Copiar
            </button>
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
            {recursosDisponibles.map((r) => (
              <div key={r.id} className="p-3 border rounded space-y-1">
                <div className="text-sm">
                  <span className="text-gray-600">Pueblo ID: </span>
                  <span className="font-medium">{r.puebloId ?? '—'}</span>
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
            ))}
          </div>
        )}
      </div>

      {/* Recursos turísticos visitados */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Recursos turísticos visitados</h2>
        {visitas.length === 0 ? (
          <div className="text-sm text-gray-600">Aún no has registrado recursos</div>
        ) : (
          <>
            {visitas.length > 30 && (
              <div className="text-sm text-gray-600">
                Mostrando últimas {visitasMostradas.length} de {visitas.length}
              </div>
            )}
            <div className="space-y-2">
              {visitasMostradas.map((v) => (
                <div key={v.id} className="p-3 border rounded space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Fecha: </span>
                    <span className="font-medium">{formatFechaHora(v.scannedAt)}</span>
                  </div>
                  {v.recurso && (
                    <>
                      <div className="text-sm">
                        <span className="text-gray-600">Recurso: </span>
                        <span className="font-medium">{v.recurso.nombre}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Tipo: </span>
                        <span className="font-medium">{v.recurso.tipo}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Código QR: </span>
                        <span className="font-mono text-xs">{v.recurso.codigoQr}</span>
                      </div>
                    </>
                  )}
                  {v.puebloId && (
                    <div className="text-sm">
                      <span className="text-gray-600">Pueblo ID: </span>
                      <span className="font-medium">{v.puebloId}</span>
                    </div>
                  )}
                  {v.puntos !== null && v.puntos !== undefined && (
                    <div className="text-sm">
                      <span className="text-gray-600">Puntos: </span>
                      <span className="font-medium">{v.puntos}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Registrar visita (demo) */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Registrar visita (demo)</h2>
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
    </section>
  );
}
