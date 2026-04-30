'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  Mountain,
  Search,
  Sparkles,
  Store,
} from 'lucide-react';

type ScopeFilter = 'todos' | 'PUEBLO' | 'ASOCIACION' | 'NEGOCIO';

type Recurso = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: 'PUEBLO' | 'ASOCIACION' | 'NEGOCIO';
  pueblo: { id: number; nombre: string; slug: string } | null;
  planNegocio: string | null;
  validacionTipo: string;
  puntosCustom: number | null;
  puntosGenericos: number;
  reglaGenerica: string;
  puntosEfectivos: number;
  cooldownDiasCustom: number | null;
  cooldownDiasGenerico: number;
  cooldownDiasEfectivo: number;
  maxValidacionesPeriodoCustom: number | null;
  maxValidacionesPeriodoGenerico: number | null;
  maxValidacionesPeriodoEfectivo: number | null;
  periodoDiasCustom: number | null;
  periodoDiasGenerico: number | null;
  periodoDiasEfectivo: number | null;
  esSelection: boolean;
};

type Resp = {
  total: number;
  conCustom: number;
  sinCustom: number;
  items: Recurso[];
};

const SCOPE_LABEL: Record<string, string> = {
  PUEBLO: 'RRTT pueblo',
  ASOCIACION: 'RRTT asociación',
  NEGOCIO: 'Negocio',
};

const PLAN_LABEL: Record<string, string> = {
  FREE: 'Gratuito',
  RECOMENDADO: 'Recomendado',
  PREMIUM: 'Premium',
  SELECTION: 'Selection',
};

function ScopeIcon({ r }: { r: Recurso }) {
  if (r.scope === 'NEGOCIO') {
    return r.esSelection ? (
      <Sparkles className="h-4 w-4 text-amber-600" />
    ) : (
      <Store className="h-4 w-4 text-emerald-600" />
    );
  }
  if (r.validacionTipo === 'GEO') {
    return <Mountain className="h-4 w-4 text-teal-600" />;
  }
  if (r.scope === 'ASOCIACION') {
    return <Building2 className="h-4 w-4 text-indigo-600" />;
  }
  return <Award className="h-4 w-4 text-blue-600" />;
}

export default function PuntosRecursosClient() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('todos');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCooldown, setEditCooldown] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editPeriodo, setEditPeriodo] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/club/admin/recursos-puntos', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (scopeFilter !== 'todos') {
      items = items.filter((r) => r.scope === scopeFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.pueblo?.nombre.toLowerCase().includes(q) ||
          r.tipo.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, search, scopeFilter]);

  function startEdit(r: Recurso) {
    setEditingId(r.id);
    setEditValue(r.puntosCustom != null ? String(r.puntosCustom) : '');
    setEditCooldown(
      r.cooldownDiasCustom != null ? String(r.cooldownDiasCustom) : '',
    );
    setEditMax(
      r.maxValidacionesPeriodoCustom != null
        ? String(r.maxValidacionesPeriodoCustom)
        : '',
    );
    setEditPeriodo(
      r.periodoDiasCustom != null ? String(r.periodoDiasCustom) : '',
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
    setEditCooldown('');
    setEditMax('');
    setEditPeriodo('');
  }

  async function saveEdit(id: number) {
    const parseNullableInt = (raw: string, name: string): number | null | false => {
      const t = raw.trim();
      if (t === '') return null;
      const v = parseInt(t, 10);
      if (Number.isNaN(v) || v < 0) {
        alert(`${name}: introduce un entero ≥ 0, o vacío para usar el genérico.`);
        return false;
      }
      return v;
    };

    const puntosCustom = parseNullableInt(editValue, 'Puntos');
    if (puntosCustom === false) return;
    const cooldownDiasCustom = parseNullableInt(editCooldown, 'Cooldown');
    if (cooldownDiasCustom === false) return;
    const maxValidacionesPeriodoCustom = parseNullableInt(editMax, 'Máx. en periodo');
    if (maxValidacionesPeriodoCustom === false) return;
    const periodoDiasCustom = parseNullableInt(editPeriodo, 'Periodo');
    if (periodoDiasCustom === false) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/club/admin/recursos/${id}/puntos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puntosCustom,
          cooldownDiasCustom,
          maxValidacionesPeriodoCustom,
          periodoDiasCustom,
        }),
      });
      if (!res.ok) throw new Error('Error guardando');
      await load();
      cancelEdit();
    } catch {
      alert('Error al guardar los ajustes del recurso.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-muted-foreground">Cargando recursos…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        {error ?? 'Error desconocido'}
      </div>
    );
  }

  const visibleCount = filtered.length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total recursos</p>
          <p className="mt-1 text-2xl font-bold">{data.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Con puntos personalizados</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {data.conCustom}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Usan valor genérico</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {data.sinCustom}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: 'todos', label: `Todos (${data.total})` },
              { key: 'PUEBLO', label: 'RRTT pueblos' },
              { key: 'ASOCIACION', label: 'RRTT asociación' },
              { key: 'NEGOCIO', label: 'Negocios' },
            ] as Array<{ key: ScopeFilter; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setScopeFilter(t.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                scopeFilter === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, pueblo o tipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                Recurso
              </th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                Pueblo / ámbito
              </th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                Tipo
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                Puntos
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                Tope
              </th>
              <th className="w-36 px-3 py-3 text-center font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.flatMap((r) => {
                const isEditing = editingId === r.id;
                const isSelectionSinPuntos =
                  r.esSelection && r.puntosCustom == null;
                const tieneOverride =
                  r.puntosCustom != null ||
                  r.cooldownDiasCustom != null ||
                  r.maxValidacionesPeriodoCustom != null ||
                  r.periodoDiasCustom != null;

                const formatTope = (
                  max: number | null,
                  periodo: number | null,
                  cooldown: number,
                ) => {
                  if (max != null && periodo != null) {
                    return `${max}/${periodo}d`;
                  }
                  if (cooldown >= 365) return '1/año';
                  if (cooldown >= 30) return `1/${Math.round(cooldown / 30)}m`;
                  if (cooldown > 1) return `1/${cooldown}d`;
                  return '∞';
                };

                const rows: any[] = [
                  <tr
                    key={r.id}
                    className={`border-b border-border transition-colors ${
                      isEditing
                        ? 'bg-blue-50/60 dark:bg-blue-950/30'
                        : isSelectionSinPuntos
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <ScopeIcon r={r} />
                        <div>
                          <div className="font-medium text-foreground">
                            {r.nombre}
                          </div>
                          {r.scope === 'NEGOCIO' && r.planNegocio && (
                            <div
                              className={`text-xs ${
                                r.esSelection
                                  ? 'font-semibold text-amber-700'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {PLAN_LABEL[r.planNegocio] ?? r.planNegocio}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {r.pueblo?.nombre ?? (
                        <span className="italic">Asociación</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">
                        {SCOPE_LABEL[r.scope] ?? r.scope}
                      </span>
                      <span className="ml-2 text-xs">{r.tipo}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <div className="font-semibold text-foreground">
                        {r.puntosEfectivos > 0 ? r.puntosEfectivos : (
                          <span className="text-red-500">0</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        gen: {r.puntosGenericos}
                        {r.puntosCustom != null && (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      <div className="font-medium text-foreground">
                        {formatTope(
                          r.maxValidacionesPeriodoEfectivo,
                          r.periodoDiasEfectivo,
                          r.cooldownDiasEfectivo,
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        cd: {r.cooldownDiasEfectivo}d
                        {(r.cooldownDiasCustom != null ||
                          r.maxValidacionesPeriodoCustom != null ||
                          r.periodoDiasCustom != null) && (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => (isEditing ? cancelEdit() : startEdit(r))}
                        className={`rounded border px-2.5 py-1 text-xs font-medium ${
                          isEditing
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-border bg-card text-muted-foreground hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {isEditing ? 'Cerrar' : tieneOverride ? 'Editar' : 'Personalizar'}
                      </button>
                    </td>
                  </tr>,
                ];

                if (isEditing) {
                  rows.push(
                    <tr
                      key={`${r.id}-editor`}
                      className="border-b border-border bg-blue-50/30 dark:bg-blue-950/20"
                    >
                      <td colSpan={6} className="px-3 py-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Puntos
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder={`gen: ${r.puntosGenericos}`}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="mt-1 w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm dark:bg-card"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Cooldown (días)
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder={`gen: ${r.cooldownDiasGenerico}`}
                              value={editCooldown}
                              onChange={(e) => setEditCooldown(e.target.value)}
                              className="mt-1 w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm dark:bg-card"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Máx. periodo
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder={
                                r.maxValidacionesPeriodoGenerico != null
                                  ? `gen: ${r.maxValidacionesPeriodoGenerico}`
                                  : '∞'
                              }
                              value={editMax}
                              onChange={(e) => setEditMax(e.target.value)}
                              className="mt-1 w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm dark:bg-card"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Periodo (días)
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder={
                                r.periodoDiasGenerico != null
                                  ? `gen: ${r.periodoDiasGenerico}`
                                  : '—'
                              }
                              value={editPeriodo}
                              onChange={(e) => setEditPeriodo(e.target.value)}
                              className="mt-1 w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm dark:bg-card"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground">
                            Deja vacío cualquier campo para usar el valor genérico
                            de la regla. Hoteles típicos: cooldown 1, máx 5,
                            periodo 30.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/30"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveEdit(r.id)}
                              disabled={saving}
                              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>,
                  );
                }

                return rows;
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {visibleCount} de {data.total} recursos.{' '}
        <span className="font-medium text-amber-700">Negocios SELECTION</span>{' '}
        sin puntos personalizados aparecen resaltados — recuerda fijarles un
        valor individual.
      </p>
    </div>
  );
}
