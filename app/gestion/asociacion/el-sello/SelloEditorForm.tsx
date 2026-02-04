'use client';

import Link from 'next/link';
import { EnrichedMarkdown } from '@/lib/cms/enrichedMarkdown';
import type { SelloPageKey, CmsDocumento } from '@/lib/cms/sello';
import {
  CONTENIDO_PROCESO,
  CONTENIDO_CRITERIOS,
  CONTENIDO_COMO_SE_OBTIENE,
} from '@/lib/cms/sello-content';

const PLANTILLA_INTERNACIONAL = `La red internacional "The Most Beautiful Villages" coordina las asociaciones nacionales y promueve el intercambio de experiencias.

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

export interface SelloEditorFormProps {
  selectedKey: SelloPageKey;
  formData: {
    titulo: string;
    subtitle: string;
    heroUrl: string;
    contenido: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    titulo: string;
    subtitle: string;
    heroUrl: string;
    contenido: string;
  }>>;
  tab: 'edit' | 'preview';
  setTab: (t: 'edit' | 'preview') => void;
  uploading: boolean;
  uploadingPdf: boolean;
  saving: boolean;
  cartaCalidadDocs: CmsDocumento[];
  onUploadHero: (file: File) => void;
  onUploadPdf: (file: File) => void;
  onSave: () => void;
  onLoadDefaultContent: () => void;
}

export function SelloEditorForm({
  selectedKey,
  formData,
  setFormData,
  tab,
  setTab,
  uploading,
  uploadingPdf,
  saving,
  cartaCalidadDocs,
  onUploadHero,
  onUploadPdf,
  onSave,
  onLoadDefaultContent,
}: SelloEditorFormProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Título *</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtítulo (opcional)</label>
        <input
          type="text"
          value={formData.subtitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
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
              onClick={() => setFormData((prev) => ({ ...prev, heroUrl: '' }))}
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
              if (file) onUploadHero(file);
            }}
            disabled={uploading}
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="block text-sm font-medium">Contenido (Markdown)</label>
          <div className="flex gap-2">
            {['SELLO_PROCESO', 'SELLO_CRITERIOS', 'SELLO_COMO_SE_OBTIENE'].includes(selectedKey) && (
              <button
                type="button"
                onClick={onLoadDefaultContent}
                className="text-xs text-blue-600 hover:underline"
              >
                📄 Cargar contenido por defecto
              </button>
            )}
            {selectedKey === 'SELLO_INTERNACIONAL' && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, contenido: PLANTILLA_INTERNACIONAL }))}
                className="text-xs text-blue-600 hover:underline"
              >
                📄 Insertar plantilla (Internacional)
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vista previa
          </button>
        </div>

        {tab === 'edit' ? (
          <>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData((prev) => ({ ...prev, contenido: e.target.value }))}
              rows={20}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
              placeholder="Escribe contenido en Markdown. Usa :::callout, :::grid-2, :::grid-3 para bloques especiales."
            />
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
                Escribe contenido en la pestaña &quot;Editar&quot; para ver la vista previa
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
                if (f) onUploadPdf(f);
              }}
              disabled={uploadingPdf}
            />
          </label>
        </div>
      )}

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
