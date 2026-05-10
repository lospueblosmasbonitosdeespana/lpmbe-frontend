'use client';

import { useState } from 'react';
import { AgenteAdminView } from '../_types';

interface Props {
  agente: AgenteAdminView;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

const MODELOS = [
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-4.5',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
];

export function AgenteConfigModal({ agente, onClose, onSaved }: Props) {
  const [activo, setActivo] = useState(agente.activo);
  const [cronExpr, setCronExpr] = useState(agente.cronExprEfectivo ?? '');
  const [modelo, setModelo] = useState(agente.modeloIaEfectivo);
  const [presupuesto, setPresupuesto] = useState(
    String(agente.presupuestoMensualEur),
  );
  const [requiereRevision, setRequiereRevision] = useState(
    agente.requiereRevisionHumana,
  );
  const [notas, setNotas] = useState(agente.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setError(null);
    setSaving(true);
    try {
      const presupuestoNum = parseFloat(presupuesto);
      const body = {
        activo,
        cronExprOverride: cronExpr.trim() || null,
        modeloIaOverride: modelo,
        presupuestoMensualEur: Number.isFinite(presupuestoNum)
          ? presupuestoNum
          : null,
        requiereRevisionHumana: requiereRevision,
        notas: notas.trim() || null,
      };
      const res = await fetch(`/api/admin/agentes/${agente.nombre}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const r = await res.json().catch(() => ({}));
        throw new Error(r?.error || r?.message || `HTTP ${res.status}`);
      }
      await onSaved();
    } catch (e: any) {
      setError(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-foreground">{agente.titulo}</h2>
        <p className="mt-0.5 font-mono text-xs text-slate-500">
          {agente.nombre}
        </p>

        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              disabled={!agente.implementado}
              className="h-4 w-4"
            />
            <span>
              Activo en producción
              {!agente.implementado && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] font-bold uppercase text-amber-800">
                  Stub: aún no implementado
                </span>
              )}
            </span>
          </label>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
              Cron (formato @nestjs/schedule)
            </label>
            <input
              type="text"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              placeholder="0 7 * * 1"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Vacío = solo manual. Ej: <code>0 7 * * 1</code> (lunes 07:00).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
              Modelo IA
            </label>
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {MODELOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
              Presupuesto mensual (€)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Si se supera durante el mes, el agente se autopausa hasta el mes
              siguiente.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiereRevision}
              onChange={(e) => setRequiereRevision(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Requiere revisión humana antes de aplicar efectos</span>
          </label>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
              Notas internas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={saving}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
