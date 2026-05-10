'use client';

import { useState } from 'react';
import { AgenteAdminView, ESTADO_LABEL } from '../_types';

interface Props {
  agente: AgenteAdminView;
  onConfig: () => void;
  onChange: () => Promise<void> | void;
}

export function AgenteCard({ agente, onConfig, onChange }: Props) {
  const [busy, setBusy] = useState<null | 'toggle' | 'run'>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleActivo = async () => {
    setError(null);
    setBusy('toggle');
    try {
      const res = await fetch(`/api/admin/agentes/${agente.nombre}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !agente.activo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      await onChange();
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(null);
    }
  };

  const ejecutarAhora = async () => {
    if (!agente.implementado) return;

    // Para los agentes de pre-carga IA permitimos elegir un pueblo concreto
    // (modo piloto) o ejecutar el barrido vacío. El backend acepta puebloId
    // numérico en `input.puebloId`.
    let input: Record<string, unknown> = {};
    const esPrecarga =
      agente.nombre === 'precarga-recursos-turisticos' ||
      agente.nombre === 'precarga-recursos-naturales';
    if (esPrecarga) {
      const respuesta = window.prompt(
        `Ejecutar "${agente.titulo}":\n\n` +
          'Escribe el ID del pueblo para hacer un PILOTO en uno solo (ej. 37 = Aínsa).\n' +
          'Deja vacío para el barrido completo (hasta 10 pueblos por defecto).\n\n' +
          'Tip: añade "dry" después del id para no escribir en BD (ej. "37 dry").',
        '',
      );
      if (respuesta === null) return; // cancel
      const partes = respuesta.trim().split(/\s+/).filter(Boolean);
      const id = Number(partes[0] ?? '');
      if (Number.isFinite(id) && id > 0) input.puebloId = id;
      if (partes.includes('dry')) input.dryRun = true;
    } else if (
      !confirm(`¿Ejecutar "${agente.titulo}" ahora? Llamará a la IA y consumirá tokens.`)
    ) {
      return;
    }

    setError(null);
    setBusy('run');
    try {
      const res = await fetch(`/api/admin/agentes/${agente.nombre}/ejecutar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      await onChange();
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(null);
    }
  };

  const dot = agente.implementado
    ? agente.activo
      ? 'bg-emerald-500'
      : 'bg-slate-300'
    : 'bg-amber-400';

  const estadoLabel = agente.ultimoEstado
    ? ESTADO_LABEL[agente.ultimoEstado]
    : '—';

  return (
    <article className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
            <h3 className="text-base font-semibold text-foreground">
              {agente.titulo}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
            {agente.nombre}
          </p>
        </div>
        {!agente.implementado && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Stub
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-slate-600">
        {agente.descripcion}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Field label="Modelo" value={agente.modeloIaEfectivo} mono />
        <Field
          label="Cron"
          value={agente.cronExprEfectivo ?? '—'}
          mono
        />
        <Field
          label="Presupuesto"
          value={`${agente.presupuestoMensualEur.toFixed(2)} €/mes`}
        />
        <Field
          label="Gasto mes"
          value={`${agente.gastoMesActualEur.toFixed(2)} €`}
          tone={
            agente.gastoMesActualEur >= agente.presupuestoMensualEur * 0.8
              ? 'red'
              : undefined
          }
        />
        <Field
          label="Ejecuciones"
          value={String(agente.ejecucionesMesActual)}
        />
        <Field label="Último estado" value={estadoLabel} />
      </dl>

      {agente.requiereRevisionHumana && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
          La salida queda en bandeja de pendientes hasta tu aprobación.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-md bg-rose-50 px-3 py-1.5 text-[11px] text-rose-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleActivo}
          disabled={busy !== null || !agente.implementado}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            agente.activo
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {busy === 'toggle' ? '…' : agente.activo ? 'Pausar' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={ejecutarAhora}
          disabled={busy !== null || !agente.implementado}
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
        >
          {busy === 'run' ? 'Ejecutando…' : 'Ejecutar ahora'}
        </button>
        <button
          type="button"
          onClick={onConfig}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Configurar
        </button>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'red';
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`${mono ? 'font-mono text-[11px]' : 'text-xs'} ${
          tone === 'red' ? 'text-rose-600 font-semibold' : 'text-slate-800'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
