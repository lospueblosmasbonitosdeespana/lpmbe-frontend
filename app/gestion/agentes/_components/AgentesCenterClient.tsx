'use client';

import { useMemo, useState } from 'react';
import {
  AgenteAdminView,
  AgenteCategoria,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
} from '../_types';
import { AgenteCard } from './AgenteCard';
import { AgenteConfigModal } from './AgenteConfigModal';

interface Props {
  initial: AgenteAdminView[];
}

const CATEGORIAS_ORDER: AgenteCategoria[] = [
  'INSTITUCIONAL',
  'CONTENIDO',
  'TURISTAS',
  'GAMIFICACION',
  'NEGOCIOS',
  'CALIDAD',
  'INTERNO',
];

export function AgentesCenterClient({ initial }: Props) {
  const [agentes, setAgentes] = useState<AgenteAdminView[]>(initial);
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'implementados' | 'stubs'>(
    'todos',
  );
  const [seleccionado, setSeleccionado] = useState<AgenteAdminView | null>(null);

  const refresh = async () => {
    const res = await fetch('/api/admin/agentes', { cache: 'no-store' });
    if (res.ok) setAgentes(await res.json());
  };

  const totales = useMemo(() => {
    const total = agentes.length;
    const implementados = agentes.filter((a) => a.implementado).length;
    const activos = agentes.filter((a) => a.activo).length;
    const gastoMes = agentes.reduce((s, a) => s + (a.gastoMesActualEur || 0), 0);
    const presupuestoMes = agentes.reduce(
      (s, a) => (a.activo ? s + (a.presupuestoMensualEur || 0) : s),
      0,
    );
    return { total, implementados, activos, gastoMes, presupuestoMes };
  }, [agentes]);

  const filtered = useMemo(() => {
    return agentes.filter((a) => {
      if (filtro === 'activos') return a.activo;
      if (filtro === 'implementados') return a.implementado;
      if (filtro === 'stubs') return !a.implementado;
      return true;
    });
  }, [agentes, filtro]);

  const grouped = useMemo(() => {
    const out: Record<AgenteCategoria, AgenteAdminView[]> = {
      INSTITUCIONAL: [],
      CONTENIDO: [],
      GAMIFICACION: [],
      TURISTAS: [],
      NEGOCIOS: [],
      CALIDAD: [],
      INTERNO: [],
    };
    for (const a of filtered) out[a.categoria].push(a);
    return out;
  }, [filtered]);

  return (
    <div>
      {/* Resumen ejecutivo */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Agentes totales" value={String(totales.total)} />
        <KpiCard
          label="Implementados"
          value={`${totales.implementados} / ${totales.total}`}
        />
        <KpiCard
          label="Activos en producción"
          value={String(totales.activos)}
          tone="emerald"
        />
        <KpiCard
          label="Gasto del mes"
          value={`${totales.gastoMes.toFixed(2)} €`}
          subtitle={`Presup. activos: ${totales.presupuestoMes.toFixed(0)} €`}
          tone="violet"
        />
      </section>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'activos', label: 'Activos' },
          { id: 'implementados', label: 'Implementados' },
          { id: 'stubs', label: 'Stubs (sin implementar)' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id as typeof filtro)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filtro === f.id
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {CATEGORIAS_ORDER.map((cat) => {
        const lista = grouped[cat];
        if (lista.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              {CATEGORIA_LABEL[cat]} <span className="text-slate-400">({lista.length})</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((a) => (
                <AgenteCard
                  key={a.nombre}
                  agente={a}
                  onConfig={() => setSeleccionado(a)}
                  onChange={refresh}
                />
              ))}
            </div>
          </section>
        );
      })}

      {seleccionado && (
        <AgenteConfigModal
          agente={seleccionado}
          onClose={() => setSeleccionado(null)}
          onSaved={async () => {
            await refresh();
            setSeleccionado(null);
          }}
        />
      )}

      <p className="mt-10 text-xs text-slate-500">
        Estados: {Object.values(ESTADO_LABEL).join(' · ')}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'emerald' | 'violet';
}) {
  const ring =
    tone === 'emerald'
      ? 'ring-emerald-200'
      : tone === 'violet'
        ? 'ring-violet-200'
        : 'ring-slate-200';
  const text =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'violet'
        ? 'text-violet-700'
        : 'text-slate-800';
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ${ring}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${text}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
