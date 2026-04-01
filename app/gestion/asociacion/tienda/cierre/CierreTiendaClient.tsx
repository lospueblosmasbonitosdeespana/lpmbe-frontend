'use client';

import { useEffect, useState } from 'react';

type TiendaEstado = 'ABIERTA' | 'ENVIO_DIFERIDO' | 'CERRADA';

const ESTADOS: { value: TiendaEstado; label: string; desc: string; color: string; icon: string }[] = [
  {
    value: 'ABIERTA',
    label: 'Tienda abierta',
    desc: 'Todo funciona con normalidad. Los usuarios compran y reciben sus pedidos en los plazos habituales.',
    color: 'border-emerald-300 bg-emerald-50 ring-emerald-200',
    icon: '🟢',
  },
  {
    value: 'ENVIO_DIFERIDO',
    label: 'Envío diferido',
    desc: 'El usuario puede comprar pero se le avisa de que el envío se realizará a partir de una fecha concreta (ej. Semana Santa, puentes).',
    color: 'border-amber-300 bg-amber-50 ring-amber-200',
    icon: '🟡',
  },
  {
    value: 'CERRADA',
    label: 'Tienda cerrada',
    desc: 'No se permite comprar. Los productos se siguen viendo pero el carrito y el checkout quedan bloqueados (ej. vacaciones de verano).',
    color: 'border-red-300 bg-red-50 ring-red-200',
    icon: '🔴',
  },
];

export default function CierreTiendaClient() {
  const [estado, setEstado] = useState<TiendaEstado>('ABIERTA');
  const [estadoGuardado, setEstadoGuardado] = useState<TiendaEstado>('ABIERTA');
  const [mensaje, setMensaje] = useState('');
  const [reapertura, setReapertura] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/site-settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Error cargando');
        const data = await res.json();
        const est = data.tiendaEstado ?? 'ABIERTA';
        setEstado(est);
        setEstadoGuardado(est);
        setMensaje(data.tiendaMensaje ?? '');
        if (data.tiendaReapertura) {
          setReapertura(data.tiendaReapertura.slice(0, 10));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const body: Record<string, unknown> = {
        tiendaEstado: estado,
        tiendaMensaje: mensaje || null,
        tiendaReapertura: reapertura ? new Date(reapertura + 'T00:00:00Z').toISOString() : null,
      };
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error guardando');
      setEstadoGuardado(estado);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally { setSaving(false); }
  }

  const estadoGuardadoInfo = ESTADOS.find((e) => e.value === estadoGuardado)!;
  const hayPendiente = estado !== estadoGuardado;

  const BADGE_STYLES: Record<TiendaEstado, string> = {
    ABIERTA: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ENVIO_DIFERIDO: 'bg-amber-100 text-amber-800 border-amber-300',
    CERRADA: 'bg-red-100 text-red-800 border-red-300',
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="h-6 w-48 rounded bg-slate-200 mb-4" />
        <div className="h-4 w-full rounded bg-slate-100 mb-2" />
        <div className="h-4 w-3/4 rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Cabecera con badge de estado actual */}
      <div className="border-b border-border bg-gradient-to-r from-slate-50 to-white px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-amber-500 shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Cierre parcial o total de Tienda</h2>
              <p className="text-sm text-muted-foreground">Controla la disponibilidad de la tienda para vacaciones, puentes o periodos sin personal.</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${BADGE_STYLES[estadoGuardado]}`}>
            <span>{estadoGuardadoInfo.icon}</span>
            <span>ACTIVO: {estadoGuardadoInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Banner de estado activo */}
        <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${estadoGuardadoInfo.color}`}>
          <span className="text-xl">{estadoGuardadoInfo.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{estadoGuardadoInfo.label}</p>
              <span className="inline-flex items-center rounded-full bg-white/80 border border-current/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                Estado actual
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{estadoGuardadoInfo.desc}</p>
          </div>
        </div>

        {hayPendiente && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tienes cambios sin guardar. Pulsa &quot;Guardar cambios&quot; para aplicar el nuevo estado.
          </div>
        )}

        {/* Selector de estado */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">Estado de la tienda</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEstado(e.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${estado === e.value ? e.color + ' ring-2 shadow-sm' : 'border-border bg-white hover:border-slate-300 hover:shadow-sm'}`}
              >
                <span className="text-lg">{e.icon}</span>
                <p className="mt-1 font-semibold text-sm">{e.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje personalizado */}
        {estado !== 'ABIERTA' && (
          <div className="space-y-4 rounded-xl border border-border bg-slate-50/50 p-5">
            <div>
              <label className="text-sm font-semibold text-foreground">
                {estado === 'ENVIO_DIFERIDO' ? 'Mensaje para el comprador' : 'Mensaje de tienda cerrada'}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {estado === 'ENVIO_DIFERIDO'
                  ? 'Se mostrará como aviso en la tienda, el carrito y al finalizar la compra.'
                  : 'Se mostrará en la tienda y bloqueará el proceso de compra.'}
              </p>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                placeholder={
                  estado === 'ENVIO_DIFERIDO'
                    ? 'Ej: Debido a las vacaciones de Semana Santa, los pedidos realizados se enviarán a partir del lunes 21 de abril.'
                    : 'Ej: La tienda permanecerá cerrada del 1 al 20 de agosto por vacaciones. Disculpa las molestias.'
                }
                className="mt-2 w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">
                {estado === 'ENVIO_DIFERIDO' ? 'Fecha de envío a partir de' : 'Fecha de reapertura'}
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {estado === 'ENVIO_DIFERIDO'
                  ? 'Los compradores verán esta fecha como referencia para recibir su pedido.'
                  : 'Se mostrará a los visitantes para que sepan cuándo volver.'}
              </p>
              <input
                type="date"
                value={reapertura}
                onChange={(e) => setReapertura(e.target.value)}
                className="mt-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Previsualización */}
        {estado !== 'ABIERTA' && mensaje && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vista previa del banner</p>
            <div className={`rounded-xl px-5 py-4 text-sm ${estado === 'ENVIO_DIFERIDO' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{estado === 'ENVIO_DIFERIDO' ? '📦' : '🔒'}</span>
                <div>
                  <p className="font-semibold">{estado === 'ENVIO_DIFERIDO' ? 'Aviso sobre envíos' : 'Tienda temporalmente cerrada'}</p>
                  <p className="mt-1">{mensaje}</p>
                  {reapertura && (
                    <p className="mt-1 font-medium">
                      {estado === 'ENVIO_DIFERIDO' ? 'Envíos a partir del' : 'Reapertura estimada:'}{' '}
                      {new Date(reapertura + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                Guardando...
              </>
            ) : 'Guardar cambios'}
          </button>
          {saved && <span className="text-sm font-medium text-emerald-600">Guardado correctamente</span>}
          {error && <span className="text-sm font-medium text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
