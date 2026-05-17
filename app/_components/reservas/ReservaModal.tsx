'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, X, Loader2, Star, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReservaTipoNegocio =
  | 'RESTAURANTE'
  | 'ALOJAMIENTO'
  | 'ACTIVIDAD'
  | 'COMERCIO'
  | 'OTRO';

interface Negocio {
  id: number;
  nombre: string;
  tipo: ReservaTipoNegocio;
}

interface MeData {
  id: number;
  nombre: string | null;
  email: string;
  telefono?: string | null;
  club?: { isMember?: boolean } | null;
}

interface ClubData {
  isMember?: boolean;
  numeroSocio?: number | null;
}

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  fecha: string;
  hora: string;
  fechaSalida: string;
  personas: number;
  ninos: number;
  habitaciones: number;
  notas: string;
  esSocio: boolean;
}

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export default function ReservaModal({
  negocio,
  open,
  onClose,
  triggerLabel,
}: {
  negocio: Negocio;
  open: boolean;
  onClose: () => void;
  triggerLabel?: string;
}) {
  const t = useTranslations('reservas');
  const locale = useLocale();
  const [me, setMe] = useState<MeData | null>(null);
  const [club, setClub] = useState<ClubData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    socioVerificado: boolean;
    numeroSocio: number | null;
    beneficio: string | null;
    pendienteConfirmacion?: boolean;
  }>(null);

  const [form, setForm] = useState<FormState>(() => ({
    nombre: '',
    email: '',
    telefono: '',
    fecha: negocio.tipo === 'ALOJAMIENTO' ? tomorrowISO() : todayISO(),
    hora: negocio.tipo === 'RESTAURANTE' ? '20:30' : negocio.tipo === 'ACTIVIDAD' ? '10:00' : '',
    fechaSalida: negocio.tipo === 'ALOJAMIENTO' ? tomorrowISO() : '',
    personas: 2,
    ninos: 0,
    habitaciones: 1,
    notas: '',
    esSocio: false,
  }));

  // Cuando se abre el modal, intenta cargar usuario actual
  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setLoadingMe(true);
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!cancel && r.ok) {
          const data = (await r.json()) as MeData;
          setMe(data);
          setForm((prev) => ({
            ...prev,
            nombre: prev.nombre || data.nombre || '',
            email: prev.email || data.email || '',
            telefono: prev.telefono || data.telefono || '',
            esSocio: prev.esSocio || !!data.club?.isMember,
          }));
          if (data.club?.isMember) {
            const c = await fetch('/api/club/me', { cache: 'no-store' });
            if (c.ok) setClub(await c.json());
          }
        }
      } catch {
        /* no-op */
      } finally {
        if (!cancel) setLoadingMe(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open]);

  // Bloquear scroll de fondo cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isLogueado = !!me;
  const esSocioVerificado = !!club?.isMember;

  const tipoLabel = useMemo(() => {
    switch (negocio.tipo) {
      case 'RESTAURANTE':
        return t('tipo.restaurante');
      case 'ALOJAMIENTO':
        return t('tipo.alojamiento');
      case 'ACTIVIDAD':
        return t('tipo.actividad');
      case 'COMERCIO':
        return t('tipo.comercio');
      default:
        return t('tipo.otro');
    }
  }, [negocio.tipo, t]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.esSocio && !isLogueado) {
      setError(t('errores.necesitaLogin'));
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        recursoId: negocio.id,
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        fecha: form.fecha,
        personas: form.personas,
        notas: form.notas.trim() || undefined,
        esSocio: form.esSocio,
        locale,
        _trap: '', // honeypot: siempre vacío; bots lo rellenan
      };
      if (negocio.tipo === 'RESTAURANTE' || negocio.tipo === 'ACTIVIDAD') {
        payload.hora = form.hora;
      }
      if (negocio.tipo === 'ALOJAMIENTO') {
        payload.fechaSalida = form.fechaSalida;
        payload.ninos = form.ninos;
        payload.habitaciones = form.habitaciones;
      }
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message
          ? Array.isArray(data.message)
            ? data.message.join(' · ')
            : String(data.message)
          : t('errores.generico');
        throw new Error(msg);
      }
      setSuccess({
        socioVerificado: !!data.socioVerificado,
        numeroSocio: data.numeroSocio ?? null,
        beneficio: data.beneficioClub ?? null,
        pendienteConfirmacion: !!data.pendienteConfirmacion,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errores.generico'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSuccess(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-modal-title"
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-amber-700 mb-0.5">
              {tipoLabel}
            </p>
            <h2 id="reserva-modal-title" className="text-lg font-serif text-stone-900 leading-tight">
              {triggerLabel || t('modal.tituloPrefix')} {negocio.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
            aria-label={t('modal.cerrar')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {success ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-emerald-600" size={28} />
              </div>
              <h3 className="text-xl font-serif text-stone-900 mb-2">{t('exito.titulo')}</h3>
              <p className="text-sm text-stone-600 max-w-sm mx-auto">{t('exito.descripcion')}</p>

              {/* Aviso de doble opt-in pendiente */}
              {success.pendienteConfirmacion && (
                <div className="mt-5 mx-auto max-w-sm p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <p className="text-sm font-semibold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    {t('exito.confirmacionEmail.titulo')}
                  </p>
                  <p className="text-xs text-blue-800 mt-1">{t('exito.confirmacionEmail.descripcion')}</p>
                </div>
              )}
              {success.socioVerificado && success.numeroSocio && (
                <div className="mt-5 mx-auto max-w-sm p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-left">
                  <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    {t('exito.socio.titulo', { numero: success.numeroSocio })}
                  </p>
                  {success.beneficio && (
                    <p className="text-xs text-amber-800 mt-1">
                      <strong>{t('exito.socio.beneficioLabel')}:</strong> {success.beneficio}
                    </p>
                  )}
                  <p className="text-[11px] text-amber-700 mt-2">{t('exito.socio.lleva')}</p>
                </div>
              )}
              {form.esSocio && !success.socioVerificado && (
                <div className="mt-5 mx-auto max-w-sm p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-left">
                  <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    {t('exito.socioSinVerificar.titulo')}
                  </p>
                  <p className="text-xs text-amber-800 mt-1">{t('exito.socioSinVerificar.descripcion')}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                {t('exito.cerrar')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos personales */}
              <div className="grid gap-3">
                <Field
                  label={t('campos.nombre')}
                  value={form.nombre}
                  onChange={(v) => setField('nombre', v)}
                  required
                  autoComplete="name"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('campos.email')}
                    type="email"
                    value={form.email}
                    onChange={(v) => setField('email', v)}
                    required
                    autoComplete="email"
                  />
                  <Field
                    label={t('campos.telefono')}
                    type="tel"
                    value={form.telefono}
                    onChange={(v) => setField('telefono', v)}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Detalles de la reserva */}
              <div className="grid gap-3">
                {negocio.tipo === 'ALOJAMIENTO' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label={t('campos.fechaEntrada')}
                        type="date"
                        value={form.fecha}
                        onChange={(v) => setField('fecha', v)}
                        required
                        min={todayISO()}
                      />
                      <Field
                        label={t('campos.fechaSalida')}
                        type="date"
                        value={form.fechaSalida}
                        onChange={(v) => setField('fechaSalida', v)}
                        required
                        min={form.fecha || todayISO()}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field
                        label={t('campos.adultos')}
                        type="number"
                        value={String(form.personas)}
                        onChange={(v) => setField('personas', Math.max(1, parseInt(v) || 1))}
                        min={1}
                        max={20}
                        required
                      />
                      <Field
                        label={t('campos.ninos')}
                        type="number"
                        value={String(form.ninos)}
                        onChange={(v) => setField('ninos', Math.max(0, parseInt(v) || 0))}
                        min={0}
                        max={10}
                      />
                      <Field
                        label={t('campos.habitaciones')}
                        type="number"
                        value={String(form.habitaciones)}
                        onChange={(v) => setField('habitaciones', Math.max(1, parseInt(v) || 1))}
                        min={1}
                        max={10}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field
                      label={t('campos.fecha')}
                      type="date"
                      value={form.fecha}
                      onChange={(v) => setField('fecha', v)}
                      required
                      min={todayISO()}
                    />
                    {(negocio.tipo === 'RESTAURANTE' || negocio.tipo === 'ACTIVIDAD') && (
                      <Field
                        label={t('campos.hora')}
                        type="time"
                        value={form.hora}
                        onChange={(v) => setField('hora', v)}
                        required
                      />
                    )}
                    <Field
                      label={
                        negocio.tipo === 'RESTAURANTE'
                          ? t('campos.comensales')
                          : negocio.tipo === 'ACTIVIDAD'
                            ? t('campos.participantes')
                            : t('campos.personas')
                      }
                      type="number"
                      value={String(form.personas)}
                      onChange={(v) => setField('personas', Math.max(1, parseInt(v) || 1))}
                      min={1}
                      max={50}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                    {t('campos.notas')}
                  </label>
                  <textarea
                    rows={3}
                    value={form.notas}
                    onChange={(e) => setField('notas', e.target.value)}
                    maxLength={1000}
                    placeholder={t('campos.notasPlaceholder')}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Sección socio del Club */}
              <div
                className={cn(
                  'rounded-lg border p-3.5 transition-colors',
                  form.esSocio
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'border-stone-200 bg-stone-50',
                )}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.esSocio}
                    onChange={(e) => setField('esSocio', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-400 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-600 fill-amber-400" />
                      <span className="text-sm font-semibold text-stone-900">{t('club.titulo')}</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">{t('club.descripcion')}</p>
                  </div>
                </label>

                {form.esSocio && (
                  <div className="mt-3 pl-7 text-xs">
                    {loadingMe ? (
                      <span className="text-stone-500">{t('club.cargando')}</span>
                    ) : esSocioVerificado && club?.numeroSocio ? (
                      <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        {t('club.verificado', { numero: club.numeroSocio })}
                      </p>
                    ) : isLogueado ? (
                      <p className="text-amber-700">
                        {t('club.logueadoNoSocio')}
                      </p>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-stone-700 flex-1">{t('club.necesitaLogin')}</p>
                        <a
                          href={`/entrar?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                        >
                          <LogIn size={12} />
                          {t('club.iniciarSesion')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  {t('modal.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {t('modal.enviando')}
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={14} />
                      {t('modal.enviar')}
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-stone-500 text-center pt-1">{t('modal.legal')}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pequeño campo de formulario reutilizable
// ─────────────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  min,
  max,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  );
}
