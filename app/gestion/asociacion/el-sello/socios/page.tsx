'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';

type SelloSocioFoto = {
  id: number;
  url: string;
  alt: string | null;
  orden: number;
};

type SelloSocio = {
  id: number;
  nombre: string;
  slug: string | null;
  logoUrl: string | null;
  descripcion: string | null;
  contenido: string | null;
  websiteUrl: string | null;
  tipo: 'INSTITUCIONAL' | 'COLABORADOR' | 'PATROCINADOR';
  orden: number;
  activo: boolean;
  fotos?: SelloSocioFoto[];
};

const TIPOS = [
  { value: 'INSTITUCIONAL', label: 'Institucional' },
  { value: 'COLABORADOR', label: 'Colaborador' },
  { value: 'PATROCINADOR', label: 'Patrocinador' },
] as const;

type EditorMode = 'edit' | 'html' | 'preview';

export default function SociosAdminPage() {
  const router = useRouter();
  const [socios, setSocios] = useState<SelloSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [contenidoMode, setContenidoMode] = useState<EditorMode>('html');

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    contenido: '',
    websiteUrl: '',
    tipo: 'COLABORADOR' as string,
    orden: 0,
    activo: true,
    logoUrl: '',
  });

  const [editingFotos, setEditingFotos] = useState<SelloSocioFoto[]>([]);

  useEffect(() => {
    loadSocios();
  }, []);

  async function loadSocios() {
    try {
      const res = await fetch('/api/admin/sello/socios', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/entrar');
        return;
      }
      if (!res.ok) throw new Error('Error cargando socios');
      const data = await res.json();
      setSocios(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadLogo(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-socios');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo imagen');
      const data = await res.json();
      const url = data.url || data.publicUrl;
      setFormData((p) => ({ ...p, logoUrl: url }));
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error subiendo');
    } finally {
      setUploading(false);
    }
  }

  async function handleUploadFoto(file: File) {
    if (!editingId) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-socios');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo imagen');
      const data = await res.json();
      const url = data.url || data.publicUrl;

      const addRes = await fetch(`/api/admin/sello/socios/${editingId}/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!addRes.ok) throw new Error('Error añadiendo foto');
      const newFoto = await addRes.json();
      setEditingFotos((prev) => [...prev, newFoto]);
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error subiendo');
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleRemoveFoto(fotoId: number) {
    if (!editingId) return;
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      const res = await fetch(`/api/admin/sello/socios/${editingId}/fotos/${fotoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error eliminando');
      setEditingFotos((prev) => prev.filter((f) => f.id !== fotoId));
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error eliminando');
    }
  }

  function resetForm() {
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      contenido: '',
      websiteUrl: '',
      tipo: 'COLABORADOR',
      orden: socios.length,
      activo: true,
      logoUrl: '',
    });
    setEditingId(null);
    setEditingFotos([]);
  }

  function editSocio(s: SelloSocio) {
    setFormData({
      nombre: s.nombre,
      slug: s.slug ?? '',
      descripcion: s.descripcion ?? '',
      contenido: s.contenido ?? '',
      websiteUrl: s.websiteUrl ?? '',
      tipo: s.tipo,
      orden: s.orden,
      activo: s.activo,
      logoUrl: s.logoUrl ?? '',
    });
    setEditingId(s.id);
    setEditingFotos(s.fotos ?? []);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        slug: formData.slug.trim() || undefined,
        descripcion: formData.descripcion.trim() || undefined,
        contenido: formData.contenido.trim() || undefined,
        websiteUrl: formData.websiteUrl.trim() || undefined,
        tipo: formData.tipo,
        orden: formData.orden,
        activo: formData.activo,
        logoUrl: formData.logoUrl.trim() || undefined,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/sello/socios/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Error actualizando');
        }
      } else {
        const res = await fetch('/api/admin/sello/socios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Error creando');
        }
      }

      alert('Guardado correctamente');
      setShowForm(false);
      resetForm();
      await loadSocios();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este socio/colaborador?')) return;
    try {
      const res = await fetch(`/api/admin/sello/socios/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error eliminando');
      await loadSocios();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error eliminando');
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-gray-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/el-sello"
          className="mb-2 block text-sm text-gray-600 hover:underline"
        >
          ← Volver a El Sello (CMS)
        </Link>
        <h1 className="text-2xl font-semibold">Socios y colaboradores</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gestiona las instituciones y colaboradores. Añade logos, descripciones y páginas dedicadas con contenido, fotos y editor HTML/TipTap.
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setFormData((p) => ({ ...p, orden: socios.length }));
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Añadir socio/colaborador
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Editar' : 'Nuevo'} socio/colaborador
          </h2>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Telefónica"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                  placeholder="telefonica (se genera del nombre si vacío)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Si tiene slug, el logo enlazará a /el-sello/socios/[slug]
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Orden</label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Descripción breve</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="Apoyo institucional..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">URL web (opcional)</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="https://..."
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="activo" className="text-sm font-medium">Visible en la web</label>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Logo</label>
                {formData.logoUrl && (
                  <div className="mb-2 flex items-center gap-3">
                    <Image src={formData.logoUrl} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain rounded border" />
                    <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-sm text-red-600 hover:underline">Quitar logo</button>
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
                  {uploading ? 'Subiendo...' : formData.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadLogo(e.target.files[0])} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Contenido página dedicada */}
            <div className="border-t pt-6">
              <h3 className="mb-3 text-sm font-semibold">Contenido de la página dedicada</h3>
              <p className="mb-3 text-xs text-gray-500">
                Si el colaborador tiene slug, este contenido se muestra en su página. Usa HTML para pegar contenido de IA o el editor tradicional.
              </p>
              <div className="flex gap-2 mb-3">
                {(['edit', 'html', 'preview'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setContenidoMode(m)}
                    className={`rounded px-3 py-1.5 text-sm ${contenidoMode === m ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {m === 'edit' ? 'Editor' : m === 'html' ? 'HTML' : 'Vista previa'}
                  </button>
                ))}
              </div>
              {contenidoMode === 'edit' && (
                <TipTapEditor
                  content={formData.contenido}
                  onChange={(html) => setFormData((p) => ({ ...p, contenido: html }))}
                  onUploadImage={async (file) => {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('folder', 'sello-socios');
                    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
                    if (!res.ok) throw new Error('Error subiendo');
                    const d = await res.json();
                    return d.url || d.publicUrl || '';
                  }}
                  placeholder="Escribe el contenido de la página del colaborador..."
                  minHeight="300px"
                />
              )}
              {contenidoMode === 'html' && (
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData((p) => ({ ...p, contenido: e.target.value }))}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                  placeholder="<p>Pega aquí HTML generado por IA o escribe el contenido...</p>"
                />
              )}
              {contenidoMode === 'preview' && (
                <div className="min-h-[200px] rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {formData.contenido ? (
                    <SafeHtml html={formData.contenido} />
                  ) : (
                    <p className="text-gray-400 text-center py-8">Sin contenido para previsualizar</p>
                  )}
                </div>
              )}
            </div>

            {/* Fotos (solo al editar) */}
            {editingId && (
              <div className="border-t pt-6">
                <h3 className="mb-3 text-sm font-semibold">Fotos de la página</h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  {editingFotos.map((f) => (
                    <div key={f.id} className="relative group">
                      <Image src={f.url} alt={f.alt || ''} width={80} height={60} className="rounded border object-cover h-16 w-20" unoptimized />
                      <button
                        type="button"
                        onClick={() => handleRemoveFoto(f.id)}
                        className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
                  {uploadingFoto ? 'Subiendo...' : '+ Añadir foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadFoto(e.target.files[0])} disabled={uploadingFoto} />
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} disabled={saving || !formData.nombre.trim()} className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {socios.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No hay socios ni colaboradores. Añade el primero con el botón de arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {socios.map((s) => (
            <div key={s.id} className={`flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 ${!s.activo ? 'opacity-60' : ''}`}>
              <div className="flex flex-1 items-center gap-4">
                {s.logoUrl ? (
                  <Image src={s.logoUrl} alt={s.nombre} width={48} height={48} className="h-12 w-12 object-contain rounded" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-400">?</div>
                )}
                <div>
                  <h3 className="font-semibold">{s.nombre}</h3>
                  <p className="text-sm text-gray-600">
                    {TIPOS.find((t) => t.value === s.tipo)?.label ?? s.tipo}
                    {s.slug && ` • /el-sello/socios/${s.slug}`}
                    {!s.activo && ' • Oculto'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editSocio(s)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
