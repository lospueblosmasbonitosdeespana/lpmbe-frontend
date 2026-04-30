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
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: number) {
    const trimmed = editValue.trim();
    let puntosCustom: number | null;
    if (trimmed === '') {
      puntosCustom = null;
    } else {
      const v = parseInt(trimmed, 10);
      if (Number.isNaN(v) || v < 0) {
        alert('Introduce un número entero ≥ 0, o deja vacío para usar el genérico.');
        return;
      }
      puntosCustom = v;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/club/admin/recursos/${id}/puntos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntosCustom }),
      });
      if (!res.ok) throw new Error('Error guardando');
      // recargar para refrescar puntosEfectivos
      await load();
      setEditingId(null);
    } catch {
      alert('Error al guardar los puntos del recurso.');
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
                Puntos efectivos
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                Genérico
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                Custom
              </th>
              <th className="w-36 px-3 py-3 text-center font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isEditing = editingId === r.id;
                const isSelectionSinPuntos =
                  r.esSelection && r.puntosCustom == null;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border last:border-0 transition-colors ${
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
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {r.puntosEfectivos > 0 ? (
                        <span className="text-foreground">
                          {r.puntosEfectivos}
                        </span>
                      ) : (
                        <span className="text-red-500">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                      {r.puntosGenericos}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          placeholder="—"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(r.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="w-20 rounded border border-blue-400 bg-white px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-card"
                        />
                      ) : r.puntosCustom != null ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {r.puntosCustom}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isEditing ? (
                        <span className="inline-flex gap-1">
                          <button
                            onClick={() => saveEdit(r.id)}
                            disabled={saving}
                            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? '…' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/30 disabled:opacity-50"
                          >
                            X
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => startEdit(r)}
                          className="rounded border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-blue-400 hover:text-blue-600"
                        >
                          {r.puntosCustom != null ? 'Editar' : 'Personalizar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
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
