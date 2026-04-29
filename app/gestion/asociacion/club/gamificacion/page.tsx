'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronLeft,
  Info,
} from 'lucide-react';

type Regla = {
  id: number;
  key: string;
  nombre: string;
  descripcion: string | null;
  puntos: number;
  activo: boolean;
  orden: number;
};

const KEYS_PROTEGIDAS = new Set(['RECURSO_VISITADO']);

export default function GamificacionAdminPage() {
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Crear nueva regla
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newPuntos, setNewPuntos] = useState('5');
  const [newActivo, setNewActivo] = useState(true);

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
      setReglas(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setReglaField<K extends keyof Regla>(id: number, field: K, value: Regla[K]) {
    setReglas((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function guardar(r: Regla) {
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

  async function eliminar(r: Regla) {
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al Club
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-md">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Gamificación del Club
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define cuántos puntos ganan los socios por cada acción. Los pueblos no
            pueden modificar nada: <strong>todos los recursos turísticos</strong>{' '}
            (museos, castillos, jardines…) suman lo mismo. La regla{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">RECURSO_VISITADO</code>{' '}
            es la que controla los puntos por validar una visita a cualquier RRTT.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-4 text-sm text-fuchsia-900">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Sistema abierto y extensible.</p>
            <p className="mt-1 text-fuchsia-800/90">
              Puedes añadir nuevas reglas (por ejemplo{' '}
              <code className="rounded bg-white px-1 py-0.5 text-xs">NEGOCIO_VISITADO</code>,{' '}
              <code className="rounded bg-white px-1 py-0.5 text-xs">SORTEO_PARTICIPADO</code>,{' '}
              <code className="rounded bg-white px-1 py-0.5 text-xs">COMBO_COMPLETADO</code>…)
              sin tocar código. La web y la app las leen automáticamente.
            </p>
          </div>
        </div>
      </div>

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

      {loading ? (
        <div className="rounded-lg bg-muted/40 p-6 text-sm text-muted-foreground">
          Cargando reglas…
        </div>
      ) : (
        <div className="space-y-3">
          {reglas.map((r) => {
            const protegida = KEYS_PROTEGIDAS.has(r.key);
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-fuchsia-100 px-2 py-0.5 text-xs font-mono font-semibold text-fuchsia-800">
                      {r.key}
                    </code>
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
                      onChange={(e) => setReglaField(r.id, 'nombre', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
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
                      onChange={(e) =>
                        setReglaField(r.id, 'puntos', Number(e.target.value) || 0)
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono"
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
                    onChange={(e) => setReglaField(r.id, 'descripcion', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    placeholder="Para qué se usa esta regla, condiciones, etc."
                  />
                </div>

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
              </div>
            );
          })}

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
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-fuchsia-900">
                    Puntos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPuntos}
                    onChange={(e) => setNewPuntos(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="inline-flex items-center gap-2 pt-6 text-sm">
                    <input
                      type="checkbox"
                      checked={newActivo}
                      onChange={(e) => setNewActivo(e.target.checked)}
                    />
                    Activa
                  </label>
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
    </main>
  );
}
