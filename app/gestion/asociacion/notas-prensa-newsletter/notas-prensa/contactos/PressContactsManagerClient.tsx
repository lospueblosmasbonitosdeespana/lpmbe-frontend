'use client';

import { useEffect, useMemo, useState } from 'react';

type PressContact = {
  id: number;
  email: string;
  name?: string | null;
  mediaOutlet?: string | null;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
};

type Editable = {
  id: number;
  email: string;
  name: string;
  mediaOutlet: string;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
};

const PAGE_SIZE = 100;

export default function PressContactsManagerClient() {
  const [items, setItems] = useState<PressContact[]>([]);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editable | null>(null);

  const page = useMemo(() => Math.floor(offset / PAGE_SIZE) + 1, [offset]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function loadData(nextOffset = offset) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(nextOffset));
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/newsletter/press-contacts?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudieron cargar contactos');
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
      setOffset(nextOffset);
    } catch (e: any) {
      setError(e?.message || 'Error cargando contactos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(c: PressContact) {
    setEditing({
      id: c.id,
      email: c.email || '',
      name: c.name || '',
      mediaOutlet: c.mediaOutlet || '',
      scope: c.scope || 'NACIONAL',
      ccaa: c.ccaa || '',
      provincia: c.provincia || '',
      puebloSlug: c.puebloSlug || '',
    });
    setMessage(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/press-contacts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
      setMessage('Contacto actualizado correctamente.');
      setEditing(null);
      await loadData(offset);
    } catch (e: any) {
      setError(e?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: number) {
    const ok = window.confirm('¿Seguro que quieres eliminar este contacto de prensa?');
    if (!ok) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/press-contacts/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
      setMessage('Contacto eliminado correctamente.');
      await loadData(offset);
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="text-sm md:flex-1">
            Buscar por email, medio o nombre
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="ej. elpais, @medio.es..."
            />
          </label>
          <button
            onClick={() => loadData(0)}
            disabled={loading || saving}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </section>

      {editing ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Editar contacto</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Medio
              <input
                value={editing.mediaOutlet}
                onChange={(e) => setEditing((s) => (s ? { ...s, mediaOutlet: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing((s) => (s ? { ...s, email: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Nombre
              <input
                value={editing.name}
                onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Ámbito
              <select
                value={editing.scope}
                onChange={(e) => setEditing((s) => (s ? { ...s, scope: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="NACIONAL">Nacional</option>
                <option value="CCAA">CCAA</option>
                <option value="PROVINCIA">Provincia</option>
                <option value="LOCAL">Local</option>
              </select>
            </label>
            <label className="text-sm">
              CCAA
              <input
                value={editing.ccaa}
                onChange={(e) => setEditing((s) => (s ? { ...s, ccaa: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Provincia
              <input
                value={editing.provincia}
                onChange={(e) => setEditing((s) => (s ? { ...s, provincia: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              onClick={() => setEditing(null)}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Listado de contactos</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left">Email</th>
                <th className="px-2 py-2 text-left">Medio</th>
                <th className="px-2 py-2 text-left">Ámbito</th>
                <th className="px-2 py-2 text-left">CCAA</th>
                <th className="px-2 py-2 text-left">Provincia</th>
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={6}>
                    {loading ? 'Cargando contactos...' : 'Sin contactos para este filtro.'}
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-2 py-2">{c.email}</td>
                    <td className="px-2 py-2">{c.mediaOutlet || '—'}</td>
                    <td className="px-2 py-2">{c.scope}</td>
                    <td className="px-2 py-2">{c.ccaa || '—'}</td>
                    <td className="px-2 py-2">{c.provincia || '—'}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          disabled={saving}
                          className="rounded border border-border px-2 py-1 text-xs font-medium disabled:opacity-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => removeContact(c.id)}
                          disabled={saving}
                          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} contactos
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadData(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset <= 0 || loading || saving}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => loadData(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || loading || saving}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
