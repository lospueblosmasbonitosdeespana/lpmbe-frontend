'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Logo = {
  id: number;
  nombre: string;
  url: string;
  etiqueta: string | null;
  orden: number;
  _count?: { rutas: number };
};

export default function LogosAdminClient() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', url: '', etiqueta: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch('/api/admin/logos', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error('Error cargando logos');
      const data = await res.json();
      setLogos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(-1);
    setForm({ nombre: '', url: '', etiqueta: '' });
  }

  function startEdit(logo: Logo) {
    setEditingId(logo.id);
    setForm({
      nombre: logo.nombre,
      url: logo.url,
      etiqueta: logo.etiqueta ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'logos');
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Error subiendo');
    const data = await res.json();
    const url = data.url || data.publicUrl;
    setForm((p) => ({ ...p, url }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        url: form.url.trim(),
        etiqueta: form.etiqueta.trim() || null,
      };
      if (!body.nombre || !body.url) {
        alert('Nombre y URL son obligatorios');
        return;
      }

      if (editingId === -1) {
        const res = await fetch('/api/admin/logos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Error creando logo');
      } else {
        const res = await fetch(`/api/admin/logos/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Error actualizando logo');
      }
      await load();
      cancelEdit();
    } catch (e) {
      alert((e as Error)?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este logo?')) return;
    try {
      const res = await fetch(`/api/admin/logos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      await load();
      if (editingId === id) cancelEdit();
    } catch (e) {
      alert((e as Error)?.message ?? 'Error');
    }
  }

  if (loading) {
    return <div className="py-8 text-muted-foreground">Cargando logos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Logos</h2>
        {editingId === null ? (
          <button
            type="button"
            onClick={startNew}
            className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Nuevo logo
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </button>
        )}
      </div>

      {(editingId === -1 || editingId !== null) && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-medium">
            {editingId === -1 ? 'Nuevo logo' : 'Editar logo'}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Nombre
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="mt-1 w-full max-w-md rounded-md border border-input px-3 py-2"
                placeholder="Ej: Logo Pirineos (transparente)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                URL
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  className="flex-1 rounded-md border border-input px-3 py-2"
                  placeholder="/logos/logo-pirineos.png o URL completa"
                />
                <label className="cursor-pointer rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">
                  Subir
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Etiqueta (opcional)
              </label>
              <input
                type="text"
                value={form.etiqueta}
                onChange={(e) => setForm((p) => ({ ...p, etiqueta: e.target.value }))}
                className="mt-1 w-full max-w-md rounded-md border border-input px-3 py-2"
                placeholder="transparente, color, pirineos..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              {editingId !== -1 && (
                <button
                  type="button"
                  onClick={() => editingId > 0 && handleDelete(editingId)}
                  className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-medium">Logos disponibles</h3>
        {logos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay logos. Crea uno para asignarlo a rutas u otras páginas.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="flex h-24 items-center justify-center bg-muted p-4">
                  {logo.url ? (
                    <img
                      src={logo.url.startsWith('/') ? logo.url : logo.url}
                      alt={logo.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin imagen</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <p className="font-medium">{logo.nombre}</p>
                    {logo.etiqueta && (
                      <p className="text-xs text-muted-foreground">{logo.etiqueta}</p>
                    )}
                    {logo._count && logo._count.rutas > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Usado en {logo._count.rutas} ruta(s)
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(logo)}
                      className="text-sm text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(logo.id)}
                      className="text-sm text-destructive hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Los logos se pueden asignar a rutas desde la edición de cada ruta. El logo
        aparecerá en la tarjeta del grid y encima del Hero en la página de la ruta.
      </p>
    </div>
  );
}
