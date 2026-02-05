'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageIcon, Users, FileText } from 'lucide-react';
import { SelloEditorForm } from './SelloEditorForm';
import type { SelloPage, SelloPageKey } from '@/lib/cms/sello';
import { SELLO_PAGE_LABELS } from '@/lib/cms/sello';
import { CONTENIDO_PROCESO, CONTENIDO_CRITERIOS, CONTENIDO_COMO_SE_OBTIENE, CONTENIDO_INTERNACIONAL, CONTENIDO_SOCIOS, CONTENIDO_QUIENES_SOMOS, CONTENIDO_UNETE, CONTENIDO_SELLO_HOME } from '@/lib/cms/sello-content';

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
    case 'SELLO_HOME':
      return CONTENIDO_SELLO_HOME;
    case 'SELLO_PROCESO':
      return CONTENIDO_PROCESO;
    case 'SELLO_CRITERIOS':
      return CONTENIDO_CRITERIOS;
    case 'SELLO_COMO_SE_OBTIENE':
      return CONTENIDO_COMO_SE_OBTIENE;
    case 'SELLO_INTERNACIONAL':
      return CONTENIDO_INTERNACIONAL;
    case 'SELLO_SOCIOS':
      return CONTENIDO_SOCIOS;
    case 'SELLO_QUIENES_SOMOS':
      return CONTENIDO_QUIENES_SOMOS;
    case 'SELLO_UNETE':
      return CONTENIDO_UNETE;
    default:
      return '';
  }
}

export default function ElSelloCmsPage() {
  const router = useRouter();
  const [pages, setPages] = useState<SelloPage[]>([]);
  const [selectedKey, setSelectedKey] = useState<SelloPageKey | null>(null);
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

  useEffect(() => {
    loadPages();
  }, []);

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

  const [currentPage, setCurrentPage] = useState<SelloPage | null>(null);

  async function loadPage(key: SelloPageKey) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/sello/${key}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando página');
      const page: SelloPage = await res.json();
      setCurrentPage(page);
      setFormData({
        titulo: page.titulo || '',
        subtitle: page.subtitle || '',
        heroUrl: page.heroUrl || '',
        contenido: page.contenido || '',
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
    if (def) setFormData((p) => ({ ...p, contenido: def }));
  }

  async function handleUploadHero(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-cms');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo imagen');
      const data = await res.json();
      const url = data.url || data.publicUrl;
      setFormData((p) => ({ ...p, heroUrl: url }));
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

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-semibold">El Sello (CMS)</h1>
        <div className="flex gap-2">
          <Link href="/gestion/asociacion/el-sello/imagenes" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ImageIcon className="h-4 w-4" />
            Imágenes del Sello
          </Link>
          <Link href="/gestion/asociacion/el-sello/socios" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Users className="h-4 w-4" />
            Socios y colaboradores
          </Link>
          <Link href="/gestion/asociacion/el-sello/documentos" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="h-4 w-4" />
            Gestionar Documentos (PDFs)
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Páginas</h2>
          {PAGES.map((key) => (
            <button
              key={key}
              onClick={() => loadPage(key)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedKey === key ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
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
          {selectedKey && loading && <div className="text-gray-600">Cargando...</div>}
          {selectedKey && !loading && (
            <SelloEditorForm
              selectedKey={selectedKey}
              formData={formData}
              setFormData={setFormData}
              tab={tab}
              setTab={setTab}
              uploading={uploading}
              saving={saving}
              onUploadHero={handleUploadHero}
              onSave={handleSave}
              onLoadDefaultContent={loadDefaultContent}
            />
          )}
        </div>
      </div>
    </main>
  );
}
