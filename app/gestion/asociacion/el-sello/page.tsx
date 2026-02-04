'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnrichedMarkdown } from '@/lib/cms/enrichedMarkdown';
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
    } catch (e: any) {
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
    } catch (e: any) {
      alert(e?.message ?? 'Error cargando página');
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

      setFormData({ ...formData, heroUrl: url });
    } catch (e: any) {
      alert(e?.message ?? 'Error subiendo imagen');
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
    } catch (e: any) {
      alert(e?.message ?? 'Error guardando');
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
    } catch (e: any) {
      alert(e?.message ?? 'Error subiendo PDF');
    } finally {
      setUploadingPdf(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">El Sello (CMS)</h1>

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        {/* Sidebar */}
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

        {/* Editor */}
        <div>
          {!selectedKey ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center text-gray-600">
              Selecciona una página para editar
            </div>
          ) : loading ? (
            <div className="text-gray-600">Cargando...</div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtítulo (opcional)</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Imagen hero (opcional)</label>
                
                {formData.heroUrl && formData.heroUrl.trim() && (
                  <div className="mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.heroUrl.trim()}
                      alt="Hero preview"
                      className="h-32 w-auto rounded border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, heroUrl: '' })}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}

                <label className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                  {uploading ? 'Subiendo...' : formData.heroUrl ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadHero(file);
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="block text-sm font-medium">Contenido (Markdown)</label>
                  <div className="flex gap-2">
                    {['SELLO_PROCESO', 'SELLO_CRITERIOS', 'SELLO_COMO_SE_OBTIENE'].includes(selectedKey!) && (
                      <button
                        type="button"
                        onClick={loadDefaultContent}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        📄 Cargar contenido por defecto
                      </button>
                    )}
                    {selectedKey === 'SELLO_INTERNACIONAL' && (
                    <button
                      type="button"
                      onClick={() => {
                        const template = `La red internacional "The Most Beautiful Villages" coordina las asociaciones nacionales y promueve el intercambio de experiencias.

:::grid-3
imagen: 🇫🇷
titulo: Francia
texto: Les Plus Beaux Villages de France - Desde 1982
link: https://www.les-plus-beaux-villages-de-france.org

---

imagen: 🇮🇹
titulo: Italia
texto: I Borghi più belli d'Italia - Desde 2001
link: https://www.borghipiubelliditalia.it

---

imagen: 🇧🇪
titulo: Bélgica
texto: Les Plus Beaux Villages de Wallonie - Desde 1994
link: https://www.beauxvillages.be

---

imagen: 🇯🇵
titulo: Japón
texto: The Most Beautiful Villages in Japan - Desde 2005
link: https://utsukushii-mura.jp

---

imagen: 🇨🇦
titulo: Canadá
texto: Les Plus Beaux Villages du Québec - Desde 1998
link: https://beauxvillages.qc.ca

---

imagen: 🇷🇴
titulo: Rumanía
texto: Cele mai frumoase sate din România - Desde 2013
link: #
:::

:::callout
**Nota**: Puedes usar emojis de banderas (🇫🇷) o URLs de imágenes reales en el campo "imagen:".
:::`;
                        setFormData({ ...formData, contenido: template });
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      📄 Insertar plantilla (Internacional)
                    </button>
                  )}
                </div>

                {/* Tabs Editar / Vista previa */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTab('edit')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === 'edit'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('preview')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === 'preview'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Vista previa
                  </button>
                </div>

                {/* Editor o Preview */}
                {tab === 'edit' ? (
                  <>
                    <textarea
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      rows={20}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                      placeholder="Puedes usar markdown normal o bloques especiales:&#10;&#10;:::callout&#10;Texto destacado&#10;:::&#10;&#10;:::grid-3&#10;imagen: url&#10;titulo: Título&#10;texto: Descripción&#10;link: https://...&#10;---&#10;(siguiente item)&#10;:::"
                    />
                    
                    {/* Ayuda de sintaxis */}
                    <div className="text-xs text-gray-600 mt-3 bg-gray-50 rounded p-3">
                      <p className="font-medium mb-2">Puedes usar Markdown:</p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li><code>**negrita**</code> y <code>*cursiva*</code></li>
                        <li><code>## Títulos</code> (##, ###, ####)</li>
                        <li><code>- Listas</code> con guiones</li>
                        <li><code>[enlaces](url)</code></li>
                      </ul>
                      <p className="font-medium mb-2">Bloques especiales:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>:::callout</code> → caja destacada</li>
                        <li><code>:::grid-2</code> y <code>:::grid-3</code> → grids de cards</li>
                        <li><code>:::buttons</code> → botones</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[500px]">
                    {formData.contenido ? (
                      <div className="max-w-none">
                        <EnrichedMarkdown content={formData.contenido} />
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-12">
                        Escribe contenido en la pestaña "Editar" para ver la vista previa
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedKey === 'SELLO_CRITERIOS' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <h3 className="text-lg font-semibold mb-3">Carta de Calidad (PDF)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Los PDFs subidos aquí se muestran en la página pública de Criterios. También puedes gestionarlos en{' '}
                    <Link href="/gestion/asociacion/el-sello/documentos" className="text-blue-600 hover:underline">
                      Documentos
                    </Link>
                    .
                  </p>
                  {cartaCalidadDocs.filter((d) => d?.url).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded border bg-white p-3 mb-2">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        📄 {doc.titulo}
                      </a>
                      <span className="text-xs text-gray-500">Publicado</span>
                    </div>
                  ))}
                  <label className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                    {uploadingPdf ? 'Subiendo...' : '+ Subir PDF Carta de Calidad'}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadPdf(f);
                      }}
                      disabled={uploadingPdf}
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.titulo.trim()}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
