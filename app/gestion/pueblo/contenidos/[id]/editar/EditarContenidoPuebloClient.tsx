'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import ContentBlockBuilder from '@/app/_components/content-builder/ContentBlockBuilder';
import { toDatetimeLocal, datetimeLocalToIsoUtc } from '@/app/_lib/dates';

type EditorMode = 'builder' | 'edit' | 'html' | 'preview';

type EditarContenidoPuebloClientProps = {
  id: string;
};

export default function EditarContenidoPuebloClient({ id }: EditarContenidoPuebloClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const puebloId = searchParams.get('puebloId');
  const puebloNombre = searchParams.get('puebloNombre');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('NOTICIA');
  const [categoria, setCategoria] = useState('');
  const [titulo, setTitulo] = useState('');
  const [resumen, setResumen] = useState('');
  const [contenidoMd, setContenidoMd] = useState('');
  const [estado, setEstado] = useState('BORRADOR');
  const [publishedAt, setPublishedAt] = useState('');
  const [fechaInicioLocal, setFechaInicioLocal] = useState('');
  const [fechaFinLocal, setFechaFinLocal] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<Array<File | null>>([null, null, null]);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [ocultoEnPlanifica, setOcultoEnPlanifica] = useState(false);
  const [rol, setRol] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // FIX: Llamar al proxy correcto de PUEBLO
        const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar el contenido');
          return;
        }

        const data = await res.json();
        setTipo(data.tipo ?? 'NOTICIA');
        setCategoria(data.categoria ?? '');
        setTitulo(data.titulo ?? '');
        setResumen(data.resumen ?? '');
        setContenidoMd(data.contenidoMd ?? '');
        setEstado(data.estado ?? 'BORRADOR');
        setCoverUrl(data.coverUrl ?? null);
        setGalleryUrls(Array.isArray(data.galleryUrls) ? data.galleryUrls.slice(0, 3) : []);

        // Para páginas temáticas con contenido existente, mantener modo builder
        // (el ContentBlockBuilder ya recibe initialHtml correctamente via key-based remount)
        if (data.publishedAt) {
          setPublishedAt(toDatetimeLocal(data.publishedAt));
        }
        
        if (data.fechaInicio) {
          setFechaInicioLocal(toDatetimeLocal(data.fechaInicio));
        }
        if (data.fechaFin) {
          setFechaFinLocal(toDatetimeLocal(data.fechaFin));
        }
        if (data.ocultoEnPlanificaFinDeSemana !== undefined) {
          setOcultoEnPlanifica(!!data.ocultoEnPlanificaFinDeSemana);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => me?.rol && setRol(me.rol))
      .catch(() => {});
  }, []);

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

  async function handleDelete() {
    if (!confirm('¿Borrar esta página temática?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'Error al borrar');
        return;
      }

      alert('Página borrada correctamente');
      router.push(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${puebloNombre}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error');
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

    setSaving(true);
    try {
      // 1. Subir cover si existe
      let newCoverUrl: string | null = coverUrl;
      const nextGalleryUrls = [...galleryUrls];

      if (coverFile) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url } = await uploadImageToR2(coverFile, 'contenidos', '/api/media/upload');
          newCoverUrl = url;
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
      if (!newCoverUrl && normalizedGalleryUrls.length > 0) {
        newCoverUrl = normalizedGalleryUrls[0];
      }

      // 2. Actualizar contenido
      const esPaginaTematica = String(id ?? '').startsWith('page-');
      const payload: any = {
        titulo: titulo.trim(),
        resumen: resumen.trim() || null,
        contenidoMd,
        estado,
      };
      // No enviar 'tipo' para páginas temáticas: el DTO solo acepta NOTICIA/EVENTO/ARTICULO/PAGINA
      if (!esPaginaTematica) {
        payload.tipo = tipo;
      }
      if (newCoverUrl) payload.coverUrl = newCoverUrl;
      payload.galleryUrls = normalizedGalleryUrls;
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
      if (tipo === 'EVENTO' && rol === 'ADMIN') {
        payload.ocultoEnPlanificaFinDeSemana = ocultoEnPlanifica;
      }

      const res = await fetch(`/api/gestion/pueblo/contenidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      alert('Contenido actualizado correctamente');
      router.push(`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${puebloNombre}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-600">Cargando...</p>
      </main>
    );
  }

  if (error && !tipo) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          ← Volver
        </button>
      </main>
    );
  }

  const isPaginaTematica = String(id ?? '').startsWith('page-');
  const fotosCombinadas = Array.from(
    new Set(
      [coverUrl, ...(Array.isArray(galleryUrls) ? galleryUrls : [])]
        .map((u) => (u || '').trim())
        .filter(Boolean)
        .slice(0, 3),
    ),
  );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">
        Editar contenido · {puebloNombre || 'Pueblo'}
      </h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {!isPaginaTematica && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tipo</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 bg-gray-50"
              value={tipo}
              disabled
            />
          </div>
        )}

        {isPaginaTematica && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-900">
              Página temática: {categoria}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              Esta es una página temática del pueblo.
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
            <option value="BORRADOR">Borrador</option>
            {!isPaginaTematica && <option value="PROGRAMADA">Programada</option>}
            <option value="PUBLICADA">Publicada</option>
          </select>
        </div>

        {estado === 'PROGRAMADA' && !isPaginaTematica && (
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
          </div>
        )}

        {tipo === 'EVENTO' && !isPaginaTematica && (
          <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Fechas del evento
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

            {rol === 'ADMIN' && (
              <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <input
                  type="checkbox"
                  id="ocultoPlanifica"
                  checked={ocultoEnPlanifica}
                  onChange={(e) => setOcultoEnPlanifica(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="ocultoPlanifica" className="text-sm">
                  Ocultar en la página &quot;Planifica tu fin de semana&quot; (solo esa página; sigue en actualidad y notificaciones)
                </label>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium">Foto de portada y galería (máx. 3)</label>
          <CoverPicker
            buttonLabel="📷 Añadir portada"
            buttonLabelWithFile="🖼️ Cambiar portada"
            onFileSelected={(file) => setCoverFile(file)}
          />
          
          {/* Preview de portada existente */}
          {coverUrl && coverUrl.trim() && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl.trim()}
                alt="Portada actual"
                className="max-w-[240px] rounded border"
              />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Quitar portada
              </button>
            </div>
          )}
          {!isPaginaTematica && (tipo === 'NOTICIA' || tipo === 'EVENTO') && (
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
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700">
                  Fotos cargadas: {fotosCombinadas.length}/3
                </p>
                {fotosCombinadas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fotosCombinadas.map((url, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`foto-combinada-${idx}`}
                        src={url}
                        alt={`Foto cargada ${idx + 1}`}
                        className="h-16 w-16 rounded border bg-gray-100 object-contain p-1"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SISTEMA DE 4 MODOS: Constructor, Editor TipTap, HTML directo, Vista previa */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Contenido</label>

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
            {uploading && <span className="text-sm text-gray-500 self-center">Subiendo imagen…</span>}
          </div>

          <p className="text-xs text-blue-700 bg-blue-50 rounded-md px-3 py-1.5">
            Al guardar, el contenido se traduce automáticamente a 7 idiomas (ES, EN, FR, DE, PT, IT, CA) con DeepL para SEO multilingüe.
          </p>

          <div style={{ display: editorMode === 'builder' ? undefined : 'none' }}>
            <ContentBlockBuilder
              draftKey={`lpmbe-editar-pueblo-contenido-${id}-draft`}
              initialHtml={contenidoMd}
              onChange={(html) => setContenidoMd(html)}
              showBrandLogos={false}
              puebloId={puebloId ? Number(puebloId) : undefined}
              webMode={true}
              puebloNombre={puebloNombre ?? undefined}
              clearDraftOnMount={true}
            />
          </div>

          {editorMode === 'edit' && (
            <TipTapEditor
              content={contenidoMd}
              onChange={(html) => setContenidoMd(html)}
              onUploadImage={handleUploadEditorImage}
              placeholder="Escribe el contenido..."
              minHeight="400px"
            />
          )}

          {editorMode === 'html' && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                Modo HTML: edita o pega código HTML directamente.
              </p>
              <textarea
                value={contenidoMd}
                onChange={(e) => setContenidoMd(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
                placeholder="<h2>Título</h2>\n<p>Párrafo...</p>"
              />
            </div>
          )}

          {editorMode === 'preview' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[400px]">
              {contenidoMd ? (
                <SafeHtml html={contenidoMd} />
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
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>

          {/* Botón BORRAR para páginas temáticas */}
          {isPaginaTematica && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="ml-auto rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Borrando…' : 'Borrar página temática'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
