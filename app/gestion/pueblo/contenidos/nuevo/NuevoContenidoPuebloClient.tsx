'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import ContentBlockBuilder from '@/app/_components/content-builder/ContentBlockBuilder';
import { datetimeLocalToIsoUtc } from '@/app/_lib/dates';

type EditorMode = 'builder' | 'edit' | 'html' | 'preview';

type NuevoContenidoPuebloClientProps = {
  puebloId: number;
  puebloNombre: string;
  tipoInicial?: string;
};


const CATEGORIAS_TEMATICAS = [
  { value: 'GASTRONOMIA', label: 'Gastronomía' },
  { value: 'NATURALEZA', label: 'Naturaleza' },
  { value: 'CULTURA', label: 'Cultura' },
  { value: 'EN_FAMILIA', label: 'En familia' },
  { value: 'PETFRIENDLY', label: 'Petfriendly' },
  { value: 'PATRIMONIO', label: 'Patrimonio' },
];

export default function NuevoContenidoPuebloClient({ puebloId, puebloNombre, tipoInicial }: NuevoContenidoPuebloClientProps) {
  const router = useRouter();

  const [tipo, setTipo] = useState(tipoInicial ?? 'NOTICIA');
  const [categoria, setCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenido, setContenido] = useState('');
  const [estado, setEstado] = useState('PUBLICADA'); // PUBLICADA por defecto
  const [publishedAt, setPublishedAt] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState('');
  const [fechaFinLocal, setFechaFinLocal] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<Array<File | null>>([null, null, null]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sistema de 4 modos: Constructor visual, Editor TipTap, HTML directo, Vista previa
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  // Limpiar formulario cuando cambia la categoría (ya no se carga página existente)
  // Ahora se permiten hasta 4 páginas por categoría
  useEffect(() => {
    if (tipo !== 'PAGINA') return;
    // Solo limpiar al cambiar categoría, pero no si ya hay contenido creado
    // (evitar perder trabajo por cambio accidental de categoría)
    setTitulo('');
    setResumen('');
    // No limpiamos contenido automáticamente para evitar pérdida de datos
    // setCoverUrl(null);  // tampoco limpiamos la portada
    setGalleryUrls([]);
    setGalleryFiles([null, null, null]);
    setEstado('PUBLICADA');
  }, [tipo, categoria]);

  // Función para subir imágenes en TipTap (con compresión automática)
  async function handleUploadEditorImage(file: File): Promise<string> {
    setUploading(true);
    try {
      const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
      const { url } = await uploadImageToR2(file, 'contenidos', '/api/media/upload');
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    // Si es PÁGINA, validar categoría
    if (tipo === 'PAGINA' && !categoria) {
      return setError('Selecciona una categoría temática');
    }

    if (estado === 'PROGRAMADA' && !publishedAt) {
      return setError('Selecciona fecha y hora de publicación');
    }

    // Validar fecha futura para PROGRAMADA
    if (estado === 'PROGRAMADA' && publishedAt) {
      const selectedDate = new Date(publishedAt);
      if (selectedDate < new Date()) {
        return setError('La fecha y hora de publicación debe ser futura');
      }
    }

    // Validar fechas del evento
    if (tipo === 'EVENTO') {
      if (!fechaInicioLocal) {
        return setError('Selecciona inicio del evento');
      }
      if (fechaFinLocal) {
        const inicio = new Date(fechaInicioLocal);
        const fin = new Date(fechaFinLocal);
        if (fin < inicio) {
          return setError('El fin debe ser posterior al inicio');
        }
      }
    }

    setSaving(true);
    try {
      // 1. Subir cover si existe
      let uploadedCoverUrl: string | null = null;
      const nextGalleryUrls = [...galleryUrls];

      if (coverFile) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url } = await uploadImageToR2(coverFile, 'contenidos', '/api/media/upload');
          uploadedCoverUrl = url;
        } catch (e: any) {
          setError(`Error subiendo portada: ${e?.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }
      }

      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        if (!file) continue;
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url } = await uploadImageToR2(file, 'contenidos', '/api/media/upload');
          nextGalleryUrls[i] = url;
        } catch (e: any) {
          setError(`Error subiendo imagen ${i + 1}: ${e?.message || 'Error desconocido'}`);
          setSaving(false);
          return;
        }
      }

      const normalizedGalleryUrls = nextGalleryUrls
        .map((u) => (u || '').trim())
        .filter(Boolean)
        .slice(0, 3);
      const effectiveCoverUrl = uploadedCoverUrl || coverUrl || normalizedGalleryUrls[0] || null;

      // 2. Si es PÁGINA, usar endpoint /admin/pages
      if (tipo === 'PAGINA') {
        const payload: any = {
          puebloId,
          category: categoria,
          titulo: titulo.trim(),
          resumen: resumen.trim() || null,
          contenido: contenido,
          published: estado === 'PUBLICADA',
        };
        if (effectiveCoverUrl) payload.coverUrl = effectiveCoverUrl;
        if (normalizedGalleryUrls.length > 0) payload.galleryUrls = normalizedGalleryUrls;

        const res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'No se pudo guardar la página');
          return;
        }

        alert('Página temática guardada correctamente');
        router.replace(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`);
        router.refresh();
        return;
      }

      // 3. Para otros tipos (NOTICIA, EVENTO, ARTICULO), usar endpoint contenidos normal
      const payload: any = {
        tipo,
        titulo: titulo.trim(),
        resumen: resumen.trim() || null,
        contenidoMd: contenido,
        estado,
        puebloId,
      };
      if (effectiveCoverUrl) payload.coverUrl = effectiveCoverUrl;
      if (normalizedGalleryUrls.length > 0) payload.galleryUrls = normalizedGalleryUrls;
      if (estado === 'PROGRAMADA' && publishedAt) {
        payload.publishedAt = datetimeLocalToIsoUtc(publishedAt);
      }
      // Añadir fechas del evento
      if (tipo === 'EVENTO' && fechaInicioLocal) {
        payload.fechaInicio = datetimeLocalToIsoUtc(fechaInicioLocal);
        if (fechaFinLocal) {
          payload.fechaFin = datetimeLocalToIsoUtc(fechaFinLocal);
        }
      }

      const res = await fetch('/api/gestion/pueblo/contenidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.replace(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Nuevo contenido · {puebloNombre}</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tipo</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={tipo}
            onChange={(e) => {
              const newTipo = e.target.value;
              setTipo(newTipo);
              // Reset categoría si deja de ser PÁGINA
              if (newTipo !== 'PAGINA') {
                setCategoria('');
              }
              // Reset fechas del evento si deja de ser EVENTO
              if (newTipo !== 'EVENTO') {
                setFechaInicioLocal('');
                setFechaFinLocal('');
              }
            }}
          >
            <option value="NOTICIA">Noticia</option>
            <option value="EVENTO">Evento</option>
            <option value="ARTICULO">Artículo</option>
            <option value="PAGINA">Página temática</option>
          </select>
        </div>

        {tipo === 'PAGINA' && (
          <div className="space-y-2 rounded-md border border-purple-200 bg-purple-50 p-4">
            <label className="block text-sm font-medium text-purple-900">
              Categoría temática
            </label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS_TEMATICAS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-purple-700">
              Se permiten 4 páginas temáticas por categoría.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Estado</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="PUBLICADA">Publicada</option>
            <option value="BORRADOR">Borrador</option>
            {tipo !== 'PAGINA' && <option value="PROGRAMADA">Programada</option>}
          </select>
        </div>

        {estado === 'PROGRAMADA' && tipo !== 'PAGINA' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Fecha y hora de publicación
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              required
            />
            <p className="text-xs text-gray-600">
              Se publicará automáticamente a esa hora. Puedes cambiarlo cuando quieras.
            </p>
          </div>
        )}

        {tipo === 'EVENTO' && (
          <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Fechas del evento
            </p>
            <p className="text-xs text-blue-700">
              Estas fechas son del evento (no de la publicación).
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Inicio del evento
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border px-3 py-2"
                value={fechaInicioLocal}
                onChange={(e) => setFechaInicioLocal(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Fin del evento (opcional)
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border px-3 py-2"
                value={fechaFinLocal}
                onChange={(e) => setFechaFinLocal(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium">Foto de portada y galería (máx. 3)</label>
          <CoverPicker 
            currentCoverUrl={coverUrl}
            buttonLabel="📷 Añadir portada"
            buttonLabelWithFile="🖼️ Cambiar portada"
            onFileSelected={(file) => {
              setCoverFile(file);
              if (file === null) {
                setCoverUrl(null);
              }
            }} 
          />
          {(tipo === 'NOTICIA' || tipo === 'EVENTO' || tipo === 'ARTICULO' || tipo === 'PAGINA') && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs text-gray-700">
                Galería: añade hasta 3 fotos. Se verán en carrusel en web y app.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((idx) => (
                  <div key={`gallery-slot-${idx}`} className="rounded-md border bg-white p-3">
                    <p className="mb-2 text-xs font-medium text-gray-700">Foto {idx + 1}</p>
                    <CoverPicker
                      currentCoverUrl={galleryUrls[idx] ?? null}
                      buttonLabel={`📷 Añadir foto ${idx + 1}`}
                      buttonLabelWithFile={`🖼️ Cambiar foto ${idx + 1}`}
                      clearLabel={`Quitar foto ${idx + 1}`}
                    currentLabel={`Foto ${idx + 1} actual:`}
                      onFileSelected={(file) => {
                        setGalleryFiles((prev) => {
                          const next = [...prev];
                          next[idx] = file;
                          return next;
                        });
                        if (file === null) {
                          setGalleryUrls((prev) => {
                            const next = [...prev];
                            next[idx] = '';
                            return next;
                          });
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SISTEMA DE 4 MODOS: Constructor, Editor, HTML, Vista previa */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido</label>
          
          {/* Botones de modo */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button type="button" onClick={() => setEditorMode('builder')}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-left transition-all ${editorMode === 'builder' ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
              <span>
                <span className="block text-sm font-bold leading-tight">Constructor visual</span>
                <span className={`block text-xs leading-tight ${editorMode === 'builder' ? 'opacity-80' : 'text-muted-foreground'}`}>Bloques arrastrables</span>
              </span>
            </button>
            <button type="button" onClick={() => setEditorMode('edit')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Editor TipTap
            </button>
            <button type="button" onClick={() => setEditorMode('html')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              HTML
            </button>
            <button type="button" onClick={() => setEditorMode('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Vista previa
            </button>
          </div>

          <p className="text-xs text-blue-700 bg-blue-50 rounded-md px-3 py-1.5">
            Al guardar, el contenido se traduce automáticamente a 7 idiomas (ES, EN, FR, DE, PT, IT, CA) con DeepL para SEO multilingüe.
          </p>

          <div style={{ display: editorMode === 'builder' ? undefined : 'none' }}>
            <ContentBlockBuilder
              draftKey={`lpmbe-contenido-pueblo-${puebloId}-${tipo}-draft`}
              initialHtml={contenido}
              onChange={(html) => setContenido(html)}
              showBrandLogos={false}
              puebloId={puebloId}
              puebloNombre={puebloNombre}
              webMode={true}
            />
          </div>

          {/* Modo Editor - TipTap */}
          {editorMode === 'edit' && (
            <TipTapEditor
              content={contenido}
              onChange={(html) => setContenido(html)}
              onUploadImage={handleUploadEditorImage}
              placeholder="Escribe el contenido..."
              minHeight="400px"
            />
          )}

          {/* Modo HTML - textarea directo */}
          {editorMode === 'html' && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Modo HTML: pega aquí código HTML directamente.
              </p>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                placeholder="<h2>Título</h2>\n<p>Párrafo...</p>"
              />
            </div>
          )}

          {/* Modo Vista previa */}
          {editorMode === 'preview' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[400px]">
              {contenido ? (
                <SafeHtml html={contenido} />
              ) : (
                <p className="text-gray-400 text-center py-12">Escribe contenido para ver la vista previa</p>
              )}
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || (tipo === 'PAGINA' && !categoria)}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : tipo === 'PAGINA' ? 'Guardar página' : 'Crear contenido'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
