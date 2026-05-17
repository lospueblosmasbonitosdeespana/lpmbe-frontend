'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Ban,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCcw,
  Users,
  MessageSquare,
  MailX,
} from 'lucide-react';

type Estado = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'NO_SHOW' | 'COMPLETADA';

interface Reserva {
  id: number;
  createdAt: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  hora: string | null;
  fechaSalida: string | null;
  personas: number;
  ninos: number | null;
  habitaciones: number | null;
  notas: string | null;
  esSocio: boolean;
  socioVerificado: boolean;
  numeroSocio: number | null;
  beneficioClub: string | null;
  estado: Estado;
  notaNegocio: string | null;
  tipoNegocio: string;
  pendienteConfirmacion: boolean;
  socioUser: {
    id: number;
    nombre: string | null;
    email: string;
    numeroSocio: number | null;
    clubQrToken: string | null;
  } | null;
}

const ESTADO_META: Record<Estado, { label: string; color: string; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendientes', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: Clock },
  CONFIRMADA: { label: 'Confirmadas', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: CheckCircle2 },
  RECHAZADA: { label: 'Rechazadas', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: XCircle },
  CANCELADA: { label: 'Canceladas', color: 'bg-stone-100 text-stone-700 border-stone-300', icon: XCircle },
  NO_SHOW: { label: 'No-show', color: 'bg-orange-100 text-orange-900 border-orange-300', icon: XCircle },
  COMPLETADA: { label: 'Completadas', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: CheckCircle2 },
};

const ESTADOS_VISIBLES: Estado[] = ['PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'NO_SHOW', 'COMPLETADA'];

function formatFechaHora(fecha: string, hora: string | null): string {
  const d = new Date(fecha);
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return hora ? `${dia} · ${hora}` : dia;
}

function tiempoTranscurrido(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

export default function ReservasNegocioClient({
  negocioId,
  negocioNombre,
  negocioTipo,
}: {
  negocioId: number;
  negocioNombre: string;
  negocioTipo: string | null;
}) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [sinEmail, setSinEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Estado | 'TODAS'>('PENDIENTE');
  const [sel, setSel] = useState<Reserva | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservas/recurso/${negocioId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudieron cargar las reservas');
      const data = await res.json();
      // La API devuelve { reservas, sinEmail } o un array (retrocompatibilidad)
      if (Array.isArray(data)) {
        setReservas(data);
      } else {
        setReservas(Array.isArray(data.reservas) ? data.reservas : []);
        setSinEmail(!!data.sinEmail);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => {
    if (filtro === 'TODAS') return reservas;
    return reservas.filter((r) => r.estado === filtro);
  }, [reservas, filtro]);

  const contadores = useMemo(() => {
    const c: Partial<Record<Estado, number>> = {};
    for (const r of reservas) c[r.estado] = (c[r.estado] ?? 0) + 1;
    return c;
  }, [reservas]);

  async function responder(id: number, estado: Estado, notaNegocio?: string) {
    try {
      const res = await fetch(`/api/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, notaNegocio }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'No se pudo actualizar');
      }
      await cargar();
      setSel(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  async function bloquearCliente(reservaId: number, motivo?: string) {
    if (!confirm('¿Bloquear a este cliente? No podrá enviar más solicitudes a este negocio.')) return;
    try {
      const res = await fetch(`/api/reservas/${reservaId}/bloquear-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivo || '' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'No se pudo bloquear');
      }
      alert('Cliente bloqueado. No podrá enviar más solicitudes a este negocio.');
      setSel(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al bloquear');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/gestion/asociacion"
            className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-3"
          >
            <ArrowLeft size={14} /> Volver a Asociación
          </Link>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-amber-700 font-semibold mb-1">
                Solicitudes de reserva
              </p>
              <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">{negocioNombre}</h1>
              {negocioTipo && <p className="text-sm text-stone-500 mt-0.5">{negocioTipo}</p>}
            </div>
            <button
              onClick={cargar}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-sm hover:bg-white"
            >
              <RefreshCcw size={14} /> Actualizar
            </button>
          </div>
        </div>

        {/* Aviso sin email */}
        {sinEmail && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <MailX size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Sin email de reservas configurado.</strong> Las notificaciones de nuevas
              solicitudes no se están enviando. Ve a{' '}
              <Link href={`/gestion/asociacion/negocios/datos`} className="underline hover:text-rose-700">
                la configuración del negocio
              </Link>{' '}
              y añade un email de reservas para recibir avisos.
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FiltroBtn
            label={`Todas (${reservas.length})`}
            active={filtro === 'TODAS'}
            onClick={() => setFiltro('TODAS')}
          />
          {ESTADOS_VISIBLES.map((e) => (
            <FiltroBtn
              key={e}
              label={`${ESTADO_META[e].label} (${contadores[e] ?? 0})`}
              active={filtro === e}
              onClick={() => setFiltro(e)}
            />
          ))}
        </div>

        {/* Listado */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-stone-500">Cargando…</div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-rose-700">{error}</div>
          ) : filtradas.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarCheck className="mx-auto text-stone-300 mb-3" size={36} />
              <p className="text-sm text-stone-500">
                {filtro === 'PENDIENTE'
                  ? 'No tienes solicitudes pendientes. ¡Buen trabajo!'
                  : 'No hay reservas en este estado.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {filtradas.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSel(r)}
                    className="w-full text-left px-4 sm:px-5 py-4 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${ESTADO_META[r.estado].color}`}
                    >
                      {ESTADO_META[r.estado].label.replace(/s$/, '')}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-900 truncate">{r.nombre}</span>
                        {r.pendienteConfirmacion && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <MailX size={9} /> Pendiente confirmar email
                          </span>
                        )}
                        {r.esSocio && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              r.socioVerificado
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <Star size={9} className="fill-current" />
                            {r.socioVerificado ? `Socio #${r.numeroSocio ?? '?'}` : 'Socio sin verificar'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {formatFechaHora(r.fecha, r.hora)} · {r.personas}{' '}
                        {r.tipoNegocio === 'ALOJAMIENTO' ? 'pers.' : 'pax'}
                      </p>
                    </div>

                    <div className="text-xs text-stone-400 whitespace-nowrap">
                      {tiempoTranscurrido(r.createdAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {sel && (
        <DetalleReserva
          reserva={sel}
          onClose={() => setSel(null)}
          onResponder={(estado, nota) => responder(sel.id, estado, nota)}
          onBloquear={(motivo) => bloquearCliente(sel.id, motivo)}
        />
      )}
    </div>
  );
}

function FiltroBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Detalle / responder
// ─────────────────────────────────────────────────────────────────────
function DetalleReserva({
  reserva,
  onClose,
  onResponder,
  onBloquear,
}: {
  reserva: Reserva;
  onClose: () => void;
  onResponder: (estado: Estado, nota?: string) => void;
  onBloquear: (motivo?: string) => void;
}) {
  const [nota, setNota] = useState('');
  const cerrada = reserva.estado !== 'PENDIENTE' && reserva.estado !== 'CONFIRMADA';
  const showRespond = reserva.estado === 'PENDIENTE';

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700 font-semibold mb-0.5">
              Solicitud #{reserva.id}
            </p>
            <h2 className="text-lg font-semibold text-stone-900">{reserva.nombre}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{tiempoTranscurrido(reserva.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 p-1.5 rounded-full hover:bg-stone-200"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Estado */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${ESTADO_META[reserva.estado].color}`}
            >
              {ESTADO_META[reserva.estado].label.replace(/s$/, '')}
            </span>
            {reserva.pendienteConfirmacion && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
                <AlertTriangle size={11} /> Pendiente de confirmación de email
              </span>
            )}
          </div>

          {/* Datos cliente */}
          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-3">
              Datos del cliente
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href={`tel:${reserva.telefono}`}
                className="flex items-center gap-2 text-sm text-stone-800 hover:text-amber-700"
              >
                <Phone size={14} className="text-stone-400" />
                <span className="font-medium">{reserva.telefono}</span>
              </a>
              <a
                href={`mailto:${reserva.email}`}
                className="flex items-center gap-2 text-sm text-stone-800 hover:text-amber-700 truncate"
              >
                <Mail size={14} className="text-stone-400 shrink-0" />
                <span className="truncate">{reserva.email}</span>
              </a>
            </div>
          </div>

          {/* Club */}
          {reserva.esSocio && (
            <div
              className={`rounded-lg p-4 border ${
                reserva.socioVerificado ? 'bg-amber-50 border-amber-300' : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Star className="text-amber-600 fill-amber-400 mt-0.5 shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  {reserva.socioVerificado && reserva.numeroSocio ? (
                    <>
                      <p className="text-sm font-semibold text-amber-900">
                        Socio del Club LPMBE verificado · #{reserva.numeroSocio}
                      </p>
                      {reserva.beneficioClub && (
                        <p className="text-xs text-amber-800 mt-1">
                          <strong>Beneficio aplicable:</strong> {reserva.beneficioClub}
                        </p>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs text-amber-900">
                        <ShieldCheck size={12} />
                        Pide al cliente el carnet del Club LPMBE al llegar (escanea su QR)
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-amber-900">
                        Declara ser socio del Club LPMBE (sin verificar)
                      </p>
                      <p className="text-xs text-amber-800 mt-1">
                        No inició sesión al hacer la solicitud. Pídele el carnet digital del Club
                        LPMBE en el momento de la visita para confirmar y aplicar el beneficio.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Detalles reserva */}
          <div className="rounded-lg border border-stone-200 p-4 space-y-2.5">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-1">
              Detalles de la reserva
            </h3>
            <DetailRow
              icon={<CalendarCheck size={14} />}
              label={reserva.tipoNegocio === 'ALOJAMIENTO' ? 'Entrada' : 'Fecha'}
              value={formatFechaHora(reserva.fecha, reserva.hora)}
            />
            {reserva.fechaSalida && (
              <DetailRow
                icon={<CalendarCheck size={14} />}
                label="Salida"
                value={formatFechaHora(reserva.fechaSalida, null)}
              />
            )}
            <DetailRow
              icon={<Users size={14} />}
              label={
                reserva.tipoNegocio === 'ALOJAMIENTO'
                  ? `Adultos${reserva.ninos ? ' + niños' : ''}`
                  : reserva.tipoNegocio === 'RESTAURANTE'
                    ? 'Comensales'
                    : 'Personas'
              }
              value={`${reserva.personas}${reserva.ninos ? ` + ${reserva.ninos} niños` : ''}`}
            />
            {reserva.habitaciones && (
              <DetailRow
                icon={<CalendarCheck size={14} />}
                label="Habitaciones"
                value={String(reserva.habitaciones)}
              />
            )}
            {reserva.notas && (
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-500 font-semibold mb-1 flex items-center gap-1">
                  <MessageSquare size={11} /> Petición del cliente
                </p>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{reserva.notas}</p>
              </div>
            )}
          </div>

          {/* Respuesta previa */}
          {reserva.notaNegocio && (
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-sm">
              <p className="text-xs font-semibold text-stone-500 mb-1">Tu respuesta:</p>
              <p className="text-stone-800">«{reserva.notaNegocio}»</p>
            </div>
          )}

          {/* Mensaje para el cliente */}
          {showRespond && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                Mensaje para el cliente (opcional)
              </label>
              <textarea
                rows={2}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. Confirmada con mesa junto a la ventana. Si prefiere terraza, llámenos."
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              />
            </div>
          )}

          {/* Bloquear cliente */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onBloquear()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              <Ban size={12} /> Bloquear este cliente
            </button>
            <p className="text-[10px] text-stone-400 mt-1">
              Le impedirás enviar más solicitudes a este negocio.
            </p>
          </div>
        </div>

        {/* Footer acciones */}
        {!cerrada && (
          <div className="border-t border-stone-200 p-4 bg-stone-50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              {reserva.estado === 'CONFIRMADA' && (
                <>
                  <button
                    onClick={() => onResponder('COMPLETADA', nota.trim() || undefined)}
                    className="px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                  >
                    Marcar completada
                  </button>
                  <button
                    onClick={() => onResponder('NO_SHOW', nota.trim() || undefined)}
                    className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
                  >
                    No se presentó
                  </button>
                </>
              )}
              {reserva.estado === 'PENDIENTE' && (
                <button
                  onClick={() => onResponder('RECHAZADA', nota.trim() || undefined)}
                  className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-semibold"
                >
                  Rechazar
                </button>
              )}
            </div>
            {reserva.estado === 'PENDIENTE' && (
              <button
                onClick={() => onResponder('CONFIRMADA', nota.trim() || undefined)}
                className="px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Confirmar reserva
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-stone-500 flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        {label}
      </span>
      <span className="text-stone-900 font-medium text-right">{value}</span>
    </div>
  );
}
