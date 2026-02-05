'use client';
// CMS El Sello - Editor con modo HTML para contenido complejo

import { useState } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import type { SelloPageKey } from '@/lib/cms/sello';

type EditorTab = 'edit' | 'html' | 'preview';

export interface SelloEditorFormProps {
  selectedKey: SelloPageKey;
  formData: { titulo: string; subtitle: string; heroUrl: string; contenido: string };
  setFormData: React.Dispatch<React.SetStateAction<{ titulo: string; subtitle: string; heroUrl: string; contenido: string }>>;
  tab: 'edit' | 'preview';
  setTab: (t: 'edit' | 'preview') => void;
  uploading: boolean;
  saving: boolean;
  onUploadHero: (file: File) => void;
  onSave: () => void;
  onLoadDefaultContent?: () => void;
}

export function SelloEditorForm({
  selectedKey,
  formData,
  setFormData,
  tab,
  setTab,
  uploading,
  saving,
  onUploadHero,
  onSave,
  onLoadDefaultContent,
}: SelloEditorFormProps) {
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  // Por defecto modo HTML para evitar que TipTap corrompa enlaces externos
  const [editorMode, setEditorMode] = useState<EditorTab>('html');

  const handleUploadEditorImage = async (file: File): Promise<string> => {
    setUploadingEditorImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sello-cms');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error subiendo imagen');
      const data = await res.json();
      return data.url || data.publicUrl || '';
    } finally {
      setUploadingEditorImage(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Título *</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtítulo (opcional)</label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Imagen hero (opcional)</label>
        {formData.heroUrl?.trim() && (
          <div className="mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.heroUrl.trim()} alt="Hero" className="h-32 w-auto rounded border object-cover" />
            <button type="button" onClick={() => setFormData((p) => ({ ...p, heroUrl: '' }))} className="mt-2 text-sm text-red-600 hover:underline">
              Quitar imagen
            </button>
          </div>
        )}
        <label className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50">
          {uploading ? 'Subiendo...' : formData.heroUrl ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadHero(e.target.files[0])} disabled={uploading} />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="block text-sm font-medium">Contenido</label>
          {onLoadDefaultContent && ['SELLO_HOME', 'SELLO_PROCESO', 'SELLO_CRITERIOS', 'SELLO_COMO_SE_OBTIENE', 'SELLO_INTERNACIONAL', 'SELLO_SOCIOS', 'SELLO_QUIENES_SOMOS', 'SELLO_UNETE'].includes(selectedKey) && (
            <button type="button" onClick={onLoadDefaultContent} className="text-xs text-blue-600 hover:underline">
              Cargar contenido por defecto
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setEditorMode('edit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('html')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Vista previa
          </button>
        </div>

        {editorMode === 'edit' && (
          <TipTapEditor
            content={formData.contenido}
            onChange={(html) => setFormData((p) => ({ ...p, contenido: html }))}
            onUploadImage={handleUploadEditorImage}
            placeholder="Escribe el contenido de la página..."
            minHeight="400px"
          />
        )}

        {editorMode === 'html' && (
          <div className="space-y-2">
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
              Modo HTML: pega aquí código HTML directamente. Útil para contenido complejo con grids o divs.
            </p>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData((p) => ({ ...p, contenido: e.target.value }))}
              rows={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
              placeholder="<h2>Título</h2>\n<p>Párrafo...</p>"
            />
          </div>
        )}

        {editorMode === 'preview' && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[500px]">
            {formData.contenido ? (
              <SafeHtml html={formData.contenido} />
            ) : (
              <p className="text-gray-400 text-center py-12">Escribe contenido para ver la vista previa</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving || !formData.titulo.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
