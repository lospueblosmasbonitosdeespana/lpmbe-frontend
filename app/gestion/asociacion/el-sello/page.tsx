'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SelloEditorForm } from './SelloEditorForm';
import type { SelloPage, SelloPageKey, CmsDocumento } from '@/lib/cms/sello';
import { SELLO_PAGE_LABELS } from '@/lib/cms/sello';
import {
  CONTENIDO_PROCESO,
  CONTENIDO_CRITERIOS,
  CONTENIDO_COMO_SE_OBTIENE,
} from '@/lib/cms/sello-content';

const PAGES: SelloPageKey[] = [
  'SELLO_HOME',
  'SELLO_COMO_SE_OBTIENE',
  'SELLO_PROCESO',
  'SELLO_CRITERIOS',
  'SELLO_QUIENES_SOMOS',
  'SELLO_SOCIOS',
  'SELLO_INTERNACIONAL',
  'SELLO_UNETE',
];

function getDefaultContent(key: SelloPageKey): string {
  switch (key) {
    case 'SELLO_PROCESO':
      return CONTENIDO_PROCESO;
    case 'SELLO_CRITERIOS':
      return CONTENIDO_CRITERIOS;
    case 'SELLO_COMO_SE_OBTIENE':
      return CONTENIDO_COMO_SE_OBTIENE;
    default:
      return '';
  }
}

function needsFallback(contenido: string, key: SelloPageKey): boolean {
  const c = (contenido ?? '').trim();
  if (c.length < 300) return true;
  if (key === 'SELLO_PROCESO' && c.includes('Conoce las etapas del proceso de certificación')) return true;
  if (key === 'SELLO_CRITERIOS' && c.includes('Los criterios que aplicamos para evaluar')) return true;
  return false;
}

export default function ElSelloCmsPage() {
  const router = useRouter();
  const [pages, setPages] = useState<SelloPage[]>([]);
  const [selectedKey, setSelectedKey] = useState<SelloPageKey | null>(null);
  const [currentPage, setCurrentPage] = useState<SelloPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const [formData, setFormData] = useState({
    titulo: '',
    subtitle: '',
    heroUrl: '',
    contenido: '',
  });

  const [cartaCalidadDocs, setCartaCalidadDocs] = useState<CmsDocumento[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfForm, setPdfForm] = useState({ titulo: 'Carta de Calidad', url: '' });

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedKey === 'SELLO_CRITERIOS') {
      fetch('/api/admin/cms/documentos?type=CARTA_CALIDAD', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setCartaCalidadDocs(Array.isArray(d) ? d : []))
        .catch(() => setCartaCalidadDocs([]));
    } else {
      setCartaCalidadDocs([]);
    }
  }, [selectedKey]);

  async function loadPages() {
    try {
      const res = await fetch('/api/admin/cms/sello', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/entrar');
        return;
      }
      if (!res.ok) throw new Error('Error cargando páginas');
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async function loadPage(key: SelloPageKey) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/sello/${key}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando página');
      const page: SelloPage = await res.json();

      const contenidoRaw = page.contenido || '';
      const contenido = needsFallback(contenidoRaw, key)
        ? getDefaultContent(key)
        : contenidoRaw;

      setCurrentPage(page);
      setFormData({
        titulo: page.titulo || '',
        subtitle: page.subtitle || '',
        heroUrl: page.heroUrl || '',
        contenido,
      });
      setSelectedKey(key);
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error cargando página');
    } finally {
      setLoading(false);
    }
  }

  function loadDefaultContent() {
    if (!selectedKey) return;
    const def = getDefaultContent(selectedKey);
    if (def) {
      setFormData((prev) => ({ ...prev, contenido: def }));
    }
  }

  async function handleUploadHero(file: File) {
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-cms');

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error('Error subiendo imagen');

      const data = await res.json();
      const url = data.url || data.publicUrl;

      setFormData((prev) => ({ ...prev, heroUrl: url }));
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!selectedKey) return;

    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo.trim(),
        subtitle: formData.subtitle.trim() || null,
        heroUrl: formData.heroUrl.trim() || null,
        contenido: formData.contenido,
      };

      const res = await fetch(`/api/admin/cms/sello/${selectedKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error guardando');

      alert('Guardado correctamente');
      await loadPages();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadPdf(file: File) {
    if (!file || file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'documentos-sello');

      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo PDF');

      const data = await res.json();
      const url = data.url || data.publicUrl;
      setPdfForm((prev) => ({ ...prev, url }));

      const saveRes = await fetch('/api/admin/cms/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: pdfForm.titulo || 'Carta de Calidad',
          type: 'CARTA_CALIDAD',
          url,
          orden: cartaCalidadDocs.length + 1,
          publicado: true,
        }),
      });
      if (!saveRes.ok) throw new Error('Error guardando documento');

      alert('PDF subido y guardado correctamente');
      setPdfForm({ titulo: 'Carta de Calidad', url: '' });
      const list = await fetch('/api/admin/cms/documentos?type=CARTA_CALIDAD', { cache: 'no-store' });
      const docs = await list.json();
      setCartaCalidadDocs(Array.isArray(docs) ? docs : []);
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error subiendo PDF');
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleResetAll() {
    if (!confirm('¿Estás seguro de que quieres BORRAR TODO el contenido de TODAS las páginas del sello?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/cms/sello/reset-all', {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Error reseteando páginas');
      
      const data = await res.json();
      alert(data.message || 'Páginas reseteadas correctamente');
      
      setSelectedKey(null);
      setFormData({ titulo: '', subtitle: '', heroUrl: '', contenido: '' });
      await loadPages();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Error reseteando páginas');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">El Sello (CMS)</h1>
        <button
          onClick={handleResetAll}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          🗑️ Borrar todo el contenido
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Páginas</h2>
          {PAGES.map((key) => (
            <button
              key={key}
              onClick={() => loadPage(key)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedKey === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {SELLO_PAGE_LABELS[key]}
            </button>
          ))}
        </div>

        <div>
          {!selectedKey && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center text-gray-600">
              Selecciona una página para editar
            </div>
          )}
          {selectedKey && loading && (
            <div className="text-gray-600">Cargando...</div>
          )}
          {selectedKey && !loading && (
            <SelloEditorForm
              selectedKey={selectedKey}
              formData={formData}
              setFormData={setFormData}
              tab={tab}
              setTab={setTab}
              uploading={uploading}
              uploadingPdf={uploadingPdf}
              saving={saving}
              cartaCalidadDocs={cartaCalidadDocs}
              onUploadHero={handleUploadHero}
              onUploadPdf={handleUploadPdf}
              onSave={handleSave}
              onLoadDefaultContent={loadDefaultContent}
            />
          )}
        </div>
      </div>
    </main>
  );
}
