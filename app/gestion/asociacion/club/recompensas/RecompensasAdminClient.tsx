'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Coins,
  Gift,
  XCircle,
  Loader2,
} from 'lucide-react';

type Recompensa = {
  id: number;
  nombre: string;
  descripcion: string;
  puntosCoste: number;
  tipo: string;
  categoria: string | null;
  imagen: string | null;
  stock: number | null;
  maxPorUsuario: number | null;
  validezDias: number | null;
  instrucciones: string | null;
  activa: boolean;
  orden: number;
  totalCanjes: number;
};

type Canje = {
  id: number;
  estado: string;
  codigo: string | null;
  puntosUsados: number;
  canjeadoAt: string;
  recompensa: { id: number; nombre: string; tipo: string };
  user: { id: number; nombre: string | null; email: string };
  motivoCancelacion: string | null;
};

const TIPOS = [
  { value: 'TIENDA', label: 'Tienda LPMBE' },
  { value: 'EXPERIENCIA', label: 'Experiencia' },
  { value: 'GUIA_DIGITAL', label: 'Guía digital' },
  { value: 'PRODUCTO_FISICO', label: 'Producto físico' },
  { value: 'DONACION', label: 'Donación solidaria' },
  { value: 'OTRO', label: 'Otro' },
];

export default function RecompensasAdminClient() {
  const [tab, setTab] = useState<'catalogo' | 'canjes'>('catalogo');
  const [items, setItems] = useState<Recompensa[]>([]);
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Recompensa | null>(null);
  const [creating, setCreating] = useState(false);
  const [refundingId, setRefundingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reloadCatalogo() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/club/admin/recompensas', { cache: 'no-store' });
      if (!r.ok) throw new Error('No se pudo cargar el catálogo');
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function reloadCanjes() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/club/admin/canjes?limit=100', {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error('No se pudieron cargar los canjes');
      const data = await r.json();
      setCanjes(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'catalogo') reloadCatalogo();
    else reloadCanjes();
  }, [tab]);

  async function handleDelete(r: Recompensa) {
    if (
      !window.confirm(
        r.totalCanjes > 0
          ? `Hay ${r.totalCanjes} canjes asociados. Se desactivará (no se borrará). ¿Seguir?`
          : `¿Eliminar la recompensa "${r.nombre}"?`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/club/admin/recompensas/${r.id}`, {
      method: 'DELETE',
    });
    if (res.ok) reloadCatalogo();
    else alert('No se pudo eliminar');
  }

  async function handleToggle(r: Recompensa) {
    const res = await fetch(`/api/club/admin/recompensas/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activa: !r.activa }),
    });
    if (res.ok) reloadCatalogo();
  }

  async function handleRefund(c: Canje) {
    const motivo = window.prompt(
      `Reembolsar el canje "${c.recompensa.nombre}" (${c.puntosUsados} pts) de ${c.user.email}?\n\nMotivo:`,
      'Solicitud del socio',
    );
    if (!motivo?.trim()) return;
    setRefundingId(c.id);
    try {
      const res = await fetch(`/api/club/admin/canjes/${c.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, estadoFinal: 'REEMBOLSADO' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message ?? 'No se pudo reembolsar');
      }
      reloadCanjes();
    } catch (e: any) {
      alert(e?.message ?? 'Error');
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-border bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab('catalogo')}
          className={`rounded-full px-4 py-1.5 ${
            tab === 'catalogo'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setTab('canjes')}
          className={`rounded-full px-4 py-1.5 ${
            tab === 'canjes'
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Canjes recientes
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </div>
      )}

      {tab === 'catalogo' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <Plus size={14} aria-hidden /> Nueva recompensa
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <Gift size={28} className="mx-auto mb-3 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Aún no hay recompensas en el catálogo.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Coste</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-right">Canjes</th>
                    <th className="p-3 text-center">Activa</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{r.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.descripcion.slice(0, 80)}
                          {r.descripcion.length > 80 && '…'}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        {TIPOS.find((t) => t.value === r.tipo)?.label ?? r.tipo}
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Coins size={12} aria-hidden /> {r.puntosCoste}
                        </span>
                      </td>
                      <td className="p-3 text-right text-xs">
                        {r.stock == null ? '∞' : r.stock}
                      </td>
                      <td className="p-3 text-right text-xs">{r.totalCanjes}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(r)}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                            r.activa
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                          title={r.activa ? 'Activa — clic para desactivar' : 'Inactiva — clic para activar'}
                        >
                          {r.activa ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                            title="Editar"
                          >
                            <Pencil size={12} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300"
                            title="Eliminar"
                          >
                            <Trash2 size={12} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'canjes' && (
        <div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : canjes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay canjes.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Socio</th>
                    <th className="p-3">Recompensa</th>
                    <th className="p-3">Código</th>
                    <th className="p-3 text-right">Pts</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {canjes.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3 text-xs">
                        {new Date(c.canjeadoAt).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{c.user.nombre ?? c.user.email}</div>
                        <div className="text-xs text-muted-foreground">{c.user.email}</div>
                      </td>
                      <td className="p-3">{c.recompensa.nombre}</td>
                      <td className="p-3 font-mono text-xs">{c.codigo ?? '—'}</td>
                      <td className="p-3 text-right">{c.puntosUsados}</td>
                      <td className="p-3">
                        <EstadoBadge estado={c.estado} />
                        {c.motivoCancelacion && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            {c.motivoCancelacion}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {['CANJEADO', 'USADO'].includes(c.estado) && (
                          <button
                            type="button"
                            onClick={() => handleRefund(c)}
                            disabled={refundingId === c.id}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                          >
                            {refundingId === c.id ? (
                              <Loader2 size={12} className="animate-spin" aria-hidden />
                            ) : (
                              <XCircle size={12} aria-hidden />
                            )}
                            Reembolsar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(editing || creating) && (
        <RecompensaModal
          recompensa={editing ?? undefined}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            reloadCatalogo();
          }}
        />
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    CANJEADO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    USADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    CANCELADO: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    REEMBOLSADO: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
    CADUCADO: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[estado] ?? 'bg-muted text-muted-foreground'}`}>
      {estado}
    </span>
  );
}

function RecompensaModal({
  recompensa,
  onClose,
  onSaved,
}: {
  recompensa?: Recompensa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nombre: recompensa?.nombre ?? '',
    descripcion: recompensa?.descripcion ?? '',
    puntosCoste: recompensa?.puntosCoste ?? 100,
    tipo: recompensa?.tipo ?? 'TIENDA',
    categoria: recompensa?.categoria ?? 'GENERAL',
    imagen: recompensa?.imagen ?? '',
    stock: recompensa?.stock ?? null,
    maxPorUsuario: recompensa?.maxPorUsuario ?? null,
    validezDias: recompensa?.validezDias ?? null,
    instrucciones: recompensa?.instrucciones ?? '',
    activa: recompensa?.activa ?? true,
    orden: recompensa?.orden ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      const url = recompensa
        ? `/api/club/admin/recompensas/${recompensa.id}`
        : '/api/club/admin/recompensas';
      const method = recompensa ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imagen: form.imagen || null,
          instrucciones: form.instrucciones || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? 'No se pudo guardar');
      }
      onSaved();
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold">
            {recompensa ? 'Editar recompensa' : 'Nueva recompensa'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 p-4">
          {err && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              {err}
            </div>
          )}
          <Field label="Nombre">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Coste (pts)">
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.puntosCoste}
                onChange={(e) =>
                  setForm({ ...form, puntosCoste: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Stock (vacío = ∞)">
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.stock ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Máx por usuario">
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.maxPorUsuario ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxPorUsuario:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Validez (días)">
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.validezDias ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    validezDias:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <Field label="URL imagen (opcional)">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={form.imagen ?? ''}
              onChange={(e) => setForm({ ...form, imagen: e.target.value })}
            />
          </Field>
          <Field label="Instrucciones para el socio (cómo usar el cupón)">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              rows={3}
              value={form.instrucciones ?? ''}
              onChange={(e) =>
                setForm({ ...form, instrucciones: e.target.value })
              }
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            Activa (visible para los socios)
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : recompensa ? 'Guardar cambios' : 'Crear recompensa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
