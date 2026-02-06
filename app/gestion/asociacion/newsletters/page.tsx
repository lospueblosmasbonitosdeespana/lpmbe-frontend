'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, Trash2, Edit2 } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

type NewsletterEdition = {
  id: number;
  titulo: string;
  mes: number;
  anio: number;
  url: string;
  orden: number;
  activo: boolean;
};

export default function NewslettersGestionPage() {
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    titulo: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    url: '',
    orden: 0,
    activo: true,
  });

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/newsletter/editions', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error('Error cargando newsletters');
      const data = await res.json();
      setEditions(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(file: File) {
    if (!file) return;
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMensaje('Formato no válido. Usa PDF, PNG o JPG (Canva exporta en estos formatos).');
      return;
    }
    setUploading(true);
    setMensaje(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/newsletter/editions/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error subiendo');
      setForm((f) => ({ ...f, url: data.url }));
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : 'Error subiendo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) {
      setMensaje('Título y archivo son obligatorios');
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      if (editId) {
        const res = await fetch(`/api/admin/newsletter/editions/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.message ?? 'Error actualizando');
        }
        setMensaje('Newsletter actualizada');
      } else {
        const res = await fetch('/api/admin/newsletter/editions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.message ?? 'Error creando');
        }
        setMensaje('Newsletter creada');
      }
      setForm({ titulo: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), url: '', orden: 0, activo: true });
      setEditId(null);
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta newsletter?')) return;
    try {
      const res = await fetch(`/api/admin/newsletter/editions/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error('Error al eliminar');
      load();
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : 'Error');
    }
  }

  function editEdition(ed: NewsletterEdition) {
    setForm({
      titulo: ed.titulo,
      mes: ed.mes,
      anio: ed.anio,
      url: ed.url,
      orden: ed.orden,
      activo: ed.activo,
    });
    setEditId(ed.id);
    setShowForm(true);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link href="/gestion/asociacion" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Gestión
        </Link>
        <h1 className="text-3xl font-bold">Gestión de newsletters</h1>
        <p className="mt-2 text-muted-foreground">
          Crea y sube ediciones (PDF, Canva). Se almacenan en R2.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/gestion/asociacion/datos/newsletter"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver suscriptores
        </Link>
        <button
          onClick={() => {
            setForm({ titulo: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), url: '', orden: 0, activo: true });
            setEditId(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nueva newsletter
        </button>
      </div>

      {mensaje && (
        <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-sm">
          {mensaje}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">
            {editId ? 'Editar newsletter' : 'Nueva newsletter'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-4 py-2"
                placeholder="Ej: Newsletter Febrero 2026"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Mes *</label>
                <select
                  value={form.mes}
                  onChange={(e) => setForm((f) => ({ ...f, mes: parseInt(e.target.value) }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2"
                >
                  {MESES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Año *</label>
                <input
                  type="number"
                  min={2020}
                  max={2030}
                  value={form.anio}
                  onChange={(e) => setForm((f) => ({ ...f, anio: parseInt(e.target.value) || 2026 }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Archivo (PDF, PNG, JPG - Canva) *</label>
              {form.url && (
                <div className="mb-3 flex items-center gap-3">
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" /> Ver archivo
                  </a>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, url: '' }))}
                    className="text-sm text-destructive hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80">
                <Upload className="h-4 w-4" />
                {uploading ? 'Subiendo...' : form.url ? 'Cambiar archivo' : 'Subir archivo'}
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                  disabled={uploading}
                />
              </label>
            </div>
            {editId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="activo" className="text-sm font-medium">Visible en la web</label>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!form.titulo.trim() || !form.url.trim() || guardando}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                className="rounded-lg border border-input px-6 py-2 font-medium hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : editions.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center text-muted-foreground">
          No hay newsletters. Crea la primera para que aparezca en la página pública.
        </div>
      ) : (
        <div className="space-y-3">
          {editions.map((ed) => (
            <div
              key={ed.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{ed.titulo}</h3>
                  {!ed.activo && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      Oculto
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {MESES[ed.mes - 1]} {ed.anio}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={ed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <FileText className="h-4 w-4" /> Ver
                </a>
                <button
                  onClick={() => editEdition(ed)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Edit2 className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(ed.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
