'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
  Lock,
} from 'lucide-react';

export type ReglaGamificacion = {
  id: number;
  key: string;
  nombre: string;
  descripcion: string | null;
  puntos: number;
  activo: boolean;
  orden: number;
  categoria: string;
  /** Días entre validaciones puntuables del mismo recurso/usuario. */
  cooldownDias: number;
  /** Tope móvil (null = sin tope). */
  maxValidacionesPeriodo: number | null;
  /** Periodo del tope móvil en días (null = sin tope). */
  periodoDias: number | null;
};

const KEYS_PROTEGIDAS = new Set([
  'RECURSO_VISITADO',
  'RECURSO_NATURAL_VISITADO',
  'NEGOCIO_VISITADO_FREE',
  'NEGOCIO_VISITADO_RECOMENDADO',
  'NEGOCIO_VISITADO_PREMIUM',
]);

const CATEGORIAS: Array<{ id: string; label: string; descripcion: string; color: string }> = [
  {
    id: 'CLUB',
    label: 'Club de amigos',
    descripcion:
      'Acciones del Club: visitas a RRTT (museos, castillos…), recursos rurales/naturales, sorteos, combos…',
    color: 'fuchsia',
  },
  {
    id: 'PUEBLOS',
    label: 'Pueblos (gamificación general)',
    descripcion:
      'Visitas a pueblos por GPS o manual, ya existentes en /mi-cuenta. No relacionadas con el Club.',
    color: 'emerald',
  },
  {
    id: 'NEGOCIOS',
    label: 'Negocios',
    descripcion:
      'Visita validada (QR/código corto) a un negocio del Club. Hay una regla por plan (FREE / Recomendado / Premium). Para Selection se ajusta individualmente desde "Puntos por recurso".',
    color: 'teal',
  },
  {
    id: 'GENERAL',
    label: 'General',
    descripcion: 'Otros logros, tienda, referidos, perfil completado, etc.',
    color: 'slate',
  },
];

const CAT_BADGE: Record<string, string> = {
  CLUB: 'bg-fuchsia-100 text-fuchsia-800',
  PUEBLOS: 'bg-emerald-100 text-emerald-800',
  NEGOCIOS: 'bg-teal-100 text-teal-800',
  GENERAL: 'bg-slate-100 text-slate-800',
};

export function GamificacionAdminEditor({
  categoriaFiltro,
  readOnly = false,
}: {
  /**
   * Si se pasa, solo se ven/crean reglas en esa(s) categoría(s).
   * Acepta un único valor o un array (para incluir varias en una misma vista).
   */
  categoriaFiltro?: string | string[];
  /** Para alcaldes: solo lectura. */
  readOnly?: boolean;
}) {
  const filtroSet = useMemo(() => {
    if (!categoriaFiltro) return null;
    return new Set(
      Array.isArray(categoriaFiltro) ? categoriaFiltro : [categoriaFiltro],
    );
  }, [categoriaFiltro]);
  const categoriaPorDefecto = useMemo(() => {
    if (Array.isArray(categoriaFiltro) && categoriaFiltro.length > 0) {
      return categoriaFiltro[0];
    }
    if (typeof categoriaFiltro === 'string') return categoriaFiltro;
    return 'CLUB';
  }, [categoriaFiltro]);
  const [reglas, setReglas] = useState<ReglaGamificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newPuntos, setNewPuntos] = useState('5');
  const [newActivo, setNewActivo] = useState(true);
  const [newCategoria, setNewCategoria] = useState(categoriaPorDefecto);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/admin/gamificacion', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error cargando reglas');
        return;
      }
      const data = await res.json();
      const arr: ReglaGamificacion[] = Array.isArray(data)
        ? data.map((r: any) => ({
            ...r,
            categoria: r.categoria ?? 'CLUB',
            cooldownDias: r.cooldownDias ?? 1,
            maxValidacionesPeriodo: r.maxValidacionesPeriodo ?? null,
            periodoDias: r.periodoDias ?? null,
          }))
        : [];
      setReglas(arr);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setReglaField<K extends keyof ReglaGamificacion>(
    id: number,
    field: K,
    value: ReglaGamificacion[K],
  ) {
    setReglas((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function guardar(r: ReglaGamificacion) {
    if (readOnly) return;
    setSaving(r.id);
    setError(null);
    setAviso(null);
    try {
      const res = await fetch(`/api/club/admin/gamificacion/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: r.nombre,
          descripcion: r.descripcion ?? null,
          puntos: r.puntos,
          activo: r.activo,
          orden: r.orden,
          categoria: r.categoria,
          cooldownDias: r.cooldownDias,
          maxValidacionesPeriodo: r.maxValidacionesPeriodo,
          periodoDias: r.periodoDias,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error guardando');
        return;
      }
      setAviso(`"${r.nombre}" actualizada.`);
      await load();
    } finally {
      setSaving(null);
    }
  }

  async function eliminar(r: ReglaGamificacion) {
    if (readOnly) return;
    if (KEYS_PROTEGIDAS.has(r.key)) {
      setError(`La regla "${r.key}" no se puede eliminar (es del sistema).`);
      return;
    }
    if (!confirm(`¿Eliminar la regla "${r.nombre}" (${r.key})?`)) return;
    setDeleting(r.id);
    setError(null);
    try {
      const res = await fetch(`/api/club/admin/gamificacion/${r.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error eliminando');
        return;
      }
      setAviso(`Regla "${r.nombre}" eliminada.`);
      await load();
    } finally {
      setDeleting(null);
    }
  }

  async function crear() {
    if (readOnly) return;
    if (!newKey.trim() || !newNombre.trim()) {
      setError('Clave y nombre son obligatorios');
      return;
    }
    const puntos = Number(newPuntos);
    if (!Number.isFinite(puntos) || puntos < 0) {
      setError('Los puntos deben ser un número >= 0');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/club/admin/gamificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.trim().toUpperCase(),
          nombre: newNombre.trim(),
          descripcion: newDescripcion.trim() || null,
          puntos,
          activo: newActivo,
          orden: reglas.length,
          categoria: newCategoria,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error creando regla');
        return;
      }
      setAviso(`Regla "${newNombre}" creada.`);
      setShowNew(false);
      setNewKey('');
      setNewNombre('');
      setNewDescripcion('');
      setNewPuntos('5');
      setNewActivo(true);
      await load();
    } finally {
      setCreating(false);
    }
  }

  const reglasFiltradas = useMemo(() => {
    if (!filtroSet) return reglas;
    return reglas.filter((r) => filtroSet.has(r.categoria));
  }, [reglas, filtroSet]);

  const reglasPorCategoria = useMemo(() => {
    const map = new Map<string, ReglaGamificacion[]>();
    for (const r of reglasFiltradas) {
      const c = r.categoria ?? 'CLUB';
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(r);
    }
    return map;
  }, [reglasFiltradas]);

  if (loading) {
    return (
      <div className="rounded-lg bg-muted/40 p-6 text-sm text-muted-foreground">
        Cargando reglas…
      </div>
    );
  }

  return (
    <div>
      {readOnly && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Solo lectura.</p>
            <p className="text-amber-900/80">
              Los puntos los gestiona el equipo de la asociación. Como alcalde,
              puedes consultar la regla pero no modificarla.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {aviso && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {aviso}
        </div>
      )}

      <div className="space-y-8">
        {[...reglasPorCategoria.entries()].map(([cat, lista]) => {
          const def = CATEGORIAS.find((c) => c.id === cat);
          return (
            <section key={cat}>
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {def?.label ?? cat}
                </h2>
                <span className="text-xs text-muted-foreground">{lista.length} reglas</span>
              </div>
              {def?.descripcion && (
                <p className="mb-3 text-xs text-muted-foreground">{def.descripcion}</p>
              )}
              <div className="space-y-3">
                {lista.map((r) => {
                  const protegida = KEYS_PROTEGIDAS.has(r.key);
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="rounded bg-fuchsia-100 px-2 py-0.5 text-xs font-mono font-semibold text-fuchsia-800">
                            {r.key}
                          </code>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              CAT_BADGE[r.categoria] ?? 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {r.categoria}
                          </span>
                          {protegida && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                              regla del sistema
                            </span>
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={r.activo}
                            disabled={readOnly}
                            onChange={(e) => setReglaField(r.id, 'activo', e.target.checked)}
                          />
                          Activa
                        </label>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-muted-foreground">
                            Nombre visible
                          </label>
                          <input
                            type="text"
                            value={r.nombre}
                            disabled={readOnly}
                            onChange={(e) => setReglaField(r.id, 'nombre', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground">
                            Puntos
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={r.puntos}
                            disabled={readOnly}
                            onChange={(e) =>
                              setReglaField(r.id, 'puntos', Number(e.target.value) || 0)
                            }
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono disabled:bg-muted/40 disabled:text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Descripción interna
                        </label>
                        <textarea
                          rows={2}
                          value={r.descripcion ?? ''}
                          disabled={readOnly}
                          onChange={(e) => setReglaField(r.id, 'descripcion', e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
                          placeholder="Para qué se usa esta regla, condiciones, etc."
                        />
                      </div>

                      {!readOnly && !categoriaFiltro && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-muted-foreground">
                            Categoría
                          </label>
                          <select
                            value={r.categoria}
                            onChange={(e) => setReglaField(r.id, 'categoria', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                          >
                            {CATEGORIAS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Límites antifraude
                        </p>
                        <p className="mb-3 text-xs text-muted-foreground">
                          Evita que el mismo socio acumule puntos del mismo recurso a diario.
                          Se puede afinar por recurso individual desde{' '}
                          <span className="italic">Datos · Puntos por recurso</span>.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Cooldown (días)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={r.cooldownDias}
                              disabled={readOnly}
                              onChange={(e) =>
                                setReglaField(
                                  r.id,
                                  'cooldownDias',
                                  Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono disabled:bg-muted/40 disabled:text-muted-foreground"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Mín. días entre visitas puntuadas (1 = 1/día, 30 = 1/mes)
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Máx. en periodo
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={r.maxValidacionesPeriodo ?? ''}
                              placeholder="∞"
                              disabled={readOnly}
                              onChange={(e) =>
                                setReglaField(
                                  r.id,
                                  'maxValidacionesPeriodo',
                                  e.target.value === ''
                                    ? null
                                    : Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono disabled:bg-muted/40 disabled:text-muted-foreground"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Tope móvil (vacío = sin tope)
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground">
                              Periodo (días)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={r.periodoDias ?? ''}
                              placeholder="—"
                              disabled={readOnly}
                              onChange={(e) =>
                                setReglaField(
                                  r.id,
                                  'periodoDias',
                                  e.target.value === ''
                                    ? null
                                    : Math.max(0, Number(e.target.value) || 0),
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono disabled:bg-muted/40 disabled:text-muted-foreground"
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Ventana del tope (típico: 30 días)
                            </p>
                          </div>
                        </div>
                      </div>

                      {!readOnly && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground">
                            Orden:{' '}
                            <input
                              type="number"
                              value={r.orden}
                              onChange={(e) =>
                                setReglaField(r.id, 'orden', Number(e.target.value) || 0)
                              }
                              className="ml-1 w-16 rounded border border-border bg-white px-1 py-0.5 text-xs font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {!protegida && (
                              <button
                                type="button"
                                onClick={() => eliminar(r)}
                                disabled={deleting === r.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deleting === r.id ? 'Eliminando…' : 'Eliminar'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => guardar(r)}
                              disabled={saving === r.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-fuchsia-700 disabled:opacity-50"
                            >
                              {saving === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-6">
          {!showNew ? (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-fuchsia-300 bg-white px-4 py-3 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50"
            >
              <Plus className="h-4 w-4" />
              Añadir nueva regla
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-fuchsia-300 bg-fuchsia-50/40 p-4">
              <h3 className="mb-3 text-sm font-semibold text-fuchsia-900">
                Nueva regla de gamificación
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900">
                    Clave (mayúsculas, sin espacios)
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="NEGOCIO_VISITADO"
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900">Puntos</label>
                  <input
                    type="number"
                    min={0}
                    value={newPuntos}
                    onChange={(e) => setNewPuntos(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900">Categoría</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-fuchsia-900">
                    Nombre visible
                  </label>
                  <input
                    type="text"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej. Visita validada en un negocio del Club"
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-fuchsia-900">
                    Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    placeholder="Cuándo se otorgan estos puntos al socio."
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm sm:col-span-3">
                  <input
                    type="checkbox"
                    checked={newActivo}
                    onChange={(e) => setNewActivo(e.target.checked)}
                  />
                  Activa
                </label>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/30"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crear}
                  disabled={creating}
                  className="inline-flex items-center gap-1 rounded-lg bg-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-fuchsia-700 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Crear regla
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="mt-8 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-4 text-sm text-fuchsia-900">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Sistema abierto y extensible.</p>
              <p className="mt-1 text-fuchsia-800/90">
                Puedes añadir nuevas mecánicas sin tocar código (
                <code className="rounded bg-white px-1 py-0.5 text-xs">NEGOCIO_VISITADO</code>,{' '}
                <code className="rounded bg-white px-1 py-0.5 text-xs">SORTEO_PARTICIPADO</code>,{' '}
                <code className="rounded bg-white px-1 py-0.5 text-xs">RESEÑA_DEJADA</code>…).
                La web y la app las leen automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
