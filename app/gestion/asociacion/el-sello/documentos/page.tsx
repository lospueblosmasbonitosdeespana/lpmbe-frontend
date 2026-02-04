'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CmsDocumento, CmsDocType } from '@/lib/cms/sello';
import { DOC_TYPE_LABELS } from '@/lib/cms/sello';

const TIPOS: CmsDocType[] = ['ESTATUTOS', 'CARTA_CALIDAD', 'REGLAMENTO', 'MEMORIA', 'OTROS'];

export default function DocumentosCmsPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<CmsDocType>('ESTATUTOS');
  const [documentos, setDocumentos] = useState<CmsDocumento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    id: null as number | null,
    titulo: '',
    type: 'ESTATUTOS' as CmsDocType,
    url: '',
    orden: 1,
    publicado: true,
  });

  useEffect(() => {
    loadDocumentos();
  }, [tipo]);

  async function loadDocumentos() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/documentos?type=${tipo}`, { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/entrar');
        return;
      }
      if (!res.ok) throw new Error('Error cargando documentos');
      const data = await res.json();
      setDocumentos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadPdf(file: File) {
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'documentos-sello');

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error('Error subiendo PDF');

      const data = await res.json();
      const url = data.url || data.publicUrl;

      setFormData({ ...formData, url });
    } catch (e: any) {
      alert(e?.message ?? 'Error subiendo PDF');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formData.titulo.trim() || !formData.url.trim()) {
      alert('Título y URL son obligatorios');
      return;
    }

    try {
      const payload = {
        titulo: formData.titulo.trim(),
        type: formData.type,
        url: formData.url.trim(),
        orden: formData.orden,
        publicado: formData.publicado,
      };

      if (formData.id) {
        // Editar
        const res = await fetch(`/api/admin/cms/documentos/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error actualizando');
      } else {
        // Crear
        const res = await fetch('/api/admin/cms/documentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error creando');
      }

      alert('Guardado correctamente');
      setShowForm(false);
      resetForm();
      await loadDocumentos();
    } catch (e: any) {
      alert(e?.message ?? 'Error guardando');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar este documento?')) return;

    try {
      const res = await fetch(`/api/admin/cms/documentos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error borrando');

      alert('Documento borrado');
      await loadDocumentos();
    } catch (e: any) {
      alert(e?.message ?? 'Error borrando');
    }
  }

  function resetForm() {
    setFormData({
      id: null,
      titulo: '',
      type: tipo,
      url: '',
      orden: documentos.length + 1,
      publicado: true,
    });
  }

  function editDoc(doc: CmsDocumento) {
    setFormData({
      id: doc.id,
      titulo: doc.titulo,
      type: doc.type,
      url: doc.url,
      orden: doc.orden,
      publicado: doc.publicado,
    });
    setShowForm(true);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">Documentos (PDFs)</h1>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <label className="text-sm font-medium mr-3">Filtrar por tipo:</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CmsDocType)}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo documento
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            {formData.id ? 'Editar documento' : 'Nuevo documento'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CmsDocType })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Orden</label>
              <input
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.publicado}
                onChange={(e) => setFormData({ ...formData, publicado: e.target.checked })}
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Publicado</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PDF *</label>
            {formData.url && (
              <div className="mb-3 flex items-center gap-3">
                <a
                  href={formData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  📄 Ver PDF actual
                </a>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, url: '' })}
                  className="text-sm text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            )}

            <label className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 cursor-pointer">
              {uploading ? 'Subiendo...' : formData.url ? 'Cambiar PDF' : 'Subir PDF'}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadPdf(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!formData.titulo.trim() || !formData.url.trim()}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg bg-gray-200 px-6 py-2 font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Cargando...</div>
      ) : documentos.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No hay documentos de tipo "{DOC_TYPE_LABELS[tipo]}"
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{doc.titulo}</h3>
                  {!doc.publicado && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
                      Borrador
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Orden: {doc.orden} • {DOC_TYPE_LABELS[doc.type]}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Ver PDF
                </a>
                <button
                  onClick={() => editDoc(doc)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
