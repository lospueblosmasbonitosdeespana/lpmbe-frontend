'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CoverPicker from '@/app/_components/media/CoverPicker';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import ContentBlockBuilder from '@/app/_components/content-builder/ContentBlockBuilder';
import { toDatetimeLocal, datetimeLocalToIsoUtc } from '@/app/_lib/dates';

type EditorMode = 'builder' | 'edit' | 'html' | 'preview';

type EditarContenidoClientProps = {
  id: string;
};

export default function EditarContenidoClient({ id }: EditarContenidoClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('NOTICIA');
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
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [builderResetKey, setBuilderResetKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/gestion/asociacion/contenidos/${id}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('No se pudo cargar el contenido');
          return;
        }

        const data = await res.json();
        setTipo(data.tipo ?? 'NOTICIA');
        setTitulo(data.titulo ?? '');
        setResumen(data.resumen ?? '');
        setContenidoMd(data.contenidoMd ?? '');
        setEstado(data.estado ?? 'BORRADOR');
        setCoverUrl(data.coverUrl ?? null);
        setGalleryUrls(Array.isArray(data.galleryUrls) ? data.galleryUrls.slice(0, 3) : []);

        if (data.publishedAt) {
          setPublishedAt(toDatetimeLocal(data.publishedAt));
        }
        
        if (data.fechaInicio) {
          setFechaInicioLocal(toDatetimeLocal(data.fechaInicio));
        }
        if (data.fechaFin) {
          setFechaFinLocal(toDatetimeLocal(data.fechaFin));
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  function handleClearAll() {
    if (!confirm('¿Limpiar todo el formulario? Se perderán los cambios no guardados.')) return;
    setTitulo('');
    setResumen('');
    setContenidoMd('');
    setCoverUrl(null);
    setCoverFile(null);
    setGalleryUrls([]);
    setGalleryFiles([null, null, null]);
    setPublishedAt('');
    setFechaInicioLocal('');
    setFechaFinLocal('');
    setEstado('BORRADOR');
    setEditorMode('builder');
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`lpmbe-editar-asoc-contenido-${id}-draft`);
    }
    setBuilderResetKey((k) => k + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError('Título requerido');

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
      let newCoverUrl = coverUrl;
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
      const payload: any = {
        tipo,
        titulo: titulo.trim(),
        resumen: resumen.trim() || null,
        contenidoMd,
        estado,
      };
      payload.galleryUrls = normalizedGalleryUrls;
      payload.coverUrl = newCoverUrl ?? null;
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

      const res = await fetch(`/api/gestion/asociacion/contenidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo actualizar');
        return;
      }

      router.replace('/gestion/asociacion/contenidos');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const field =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25';
  const lbl = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground';
  const modeTab = (active: boolean, accent: 'primary' | 'sky' | 'amber' | 'emerald') => {
    const activeRing =
      accent === 'primary'
        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
        : accent === 'sky'
          ? 'border-sky-500 bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md shadow-sky-200'
          : accent === 'amber'
            ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-200'
            : 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200';
    return `flex min-h-[3rem] items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-all sm:px-4 ${
      active
        ? activeRing
        : 'border-border/80 bg-card text-foreground hover:border-primary/35 hover:bg-muted/50'
    }`;
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cargando contenido…</p>
        </div>
      </main>
    );
  }

  if (error && !titulo) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center">
          <p className="font-semibold text-red-800">{error}</p>
          <Link
            href="/gestion/asociacion/contenidos"
            className="mt-4 inline-flex text-sm font-medium text-red-700 underline hover:text-red-900"
          >
            Volver a contenidos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/gestion/asociacion/contenidos"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a contenidos de la asociación
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Editar contenido</h1>
            <p className="mt-0.5 text-sm text-white/80">Asociación LPMBE · {titulo || 'Sin título'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="rounded-2xl border border-border/90 bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
            Datos principales
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={lbl}>Tipo</label>
              <select
                className={field}
                value={tipo}
                onChange={(e) => {
                  const newTipo = e.target.value;
                  setTipo(newTipo);
                  if (newTipo !== 'EVENTO') {
                    setFechaInicioLocal('');
                    setFechaFinLocal('');
                  }
                }}
              >
                <option value="NOTICIA">Noticia</option>
                <option value="EVENTO">Evento</option>
                <option value="ARTICULO">Artículo</option>
                <option value="PAGINA">Página</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Estado</label>
              <select className={field} value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="BORRADOR">Borrador</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="PUBLICADA">Publicada</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Título</label>
              <input className={field} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>
          </div>

          {estado === 'PROGRAMADA' && (
            <div className="mt-5 space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
              <label className="text-sm font-semibold text-sky-900">Fecha y hora de publicación</label>
              <input
                type="datetime-local"
                className={field}
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required
              />
              <p className="text-xs text-sky-800/80">
                Se publicará automáticamente a esa hora. Puedes cambiarlo cuando quieras.
              </p>
            </div>
          )}

          {tipo === 'EVENTO' && (
            <div className="mt-5 space-y-4 rounded-xl border border-sky-200 bg-gradient-to-b from-sky-50/90 to-white p-5 ring-1 ring-sky-100">
              <div>
                <p className="text-sm font-bold text-sky-950">Fechas del evento</p>
                <p className="mt-0.5 text-xs text-sky-800/85">Estas fechas son del evento (no de la publicación).</p>
              </div>
              <div>
                <label className={lbl}>Inicio del evento</label>
                <input
                  type="datetime-local"
                  className={field}
                  value={fechaInicioLocal}
                  onChange={(e) => setFechaInicioLocal(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={lbl}>Fin del evento (opcional)</label>
                <input
                  type="datetime-local"
                  className={field}
                  value={fechaFinLocal}
                  onChange={(e) => setFechaFinLocal(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/90 bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            Portada y galería
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Máximo 3 imágenes en galería.</p>
          <CoverPicker
            currentCoverUrl={coverUrl}
            buttonLabel="📷 Añadir portada"
            buttonLabelWithFile="🖼️ Cambiar portada"
            onFileSelected={(file) => {
              setCoverFile(file);
              if (file === null) setCoverUrl(null);
            }}
          />
          {coverUrl && coverUrl.trim() && (
            <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl.trim()} alt="Portada" className="max-w-[220px] rounded-lg object-cover ring-1 ring-border shadow-sm" />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Quitar portada
              </button>
            </div>
          )}
          <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-b from-amber-50/40 to-transparent p-4 ring-1 ring-amber-100/80">
            <p className="mb-3 text-sm font-medium text-amber-950/90">Galería — hasta 3 fotos en carrusel (web y app)</p>
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={`gallery-slot-${idx}`}
                  className="rounded-xl border border-white bg-white/90 p-4 shadow-sm ring-1 ring-amber-100/60"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-900/70">Foto {idx + 1}</p>
                  <CoverPicker
                    currentCoverUrl={galleryUrls[idx] ?? null}
                    buttonLabel={`📷 Añadir foto ${idx + 1}`}
                    buttonLabelWithFile={`🖼️ Cambiar foto ${idx + 1}`}
                    clearLabel={`Quitar foto ${idx + 1}`}
                    currentLabel={`Foto ${idx + 1} actual:`}
                    onFileSelected={(file) => {
                      setGalleryFiles((prev) => {
                        const n = [...prev];
                        n[idx] = file;
                        return n;
                      });
                      if (file === null)
                        setGalleryUrls((prev) => {
                          const n = [...prev];
                          n[idx] = '';
                          return n;
                        });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm">
          <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </span>
                  Contenido
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Constructor, TipTap, HTML o vista previa.</p>
              </div>
              {uploading && (
                <span className="text-xs font-medium text-muted-foreground">Subiendo imagen…</span>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setEditorMode('builder')}
                className={`${modeTab(editorMode === 'builder', 'primary')} items-start`}
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span className="min-w-0">
                  <span className="block leading-tight">Constructor</span>
                  <span
                    className={`block text-[11px] font-normal leading-tight ${
                      editorMode === 'builder' ? 'opacity-90' : 'text-muted-foreground'
                    }`}
                  >
                    Bloques
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => setEditorMode('edit')} className={modeTab(editorMode === 'edit', 'sky')}>
                <span className="min-w-0">
                  <span className="block leading-tight">TipTap</span>
                  <span
                    className={`block text-[11px] font-normal leading-tight ${
                      editorMode === 'edit' ? 'opacity-90' : 'text-muted-foreground'
                    }`}
                  >
                    Editor rico
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => setEditorMode('html')} className={modeTab(editorMode === 'html', 'amber')}>
                <span className="min-w-0">
                  <span className="block leading-tight">HTML</span>
                  <span
                    className={`block text-[11px] font-normal leading-tight ${
                      editorMode === 'html' ? 'opacity-90' : 'text-muted-foreground'
                    }`}
                  >
                    Código
                  </span>
                </span>
              </button>
              <button type="button" onClick={() => setEditorMode('preview')} className={modeTab(editorMode === 'preview', 'emerald')}>
                <span className="min-w-0">
                  <span className="block leading-tight">Vista previa</span>
                  <span
                    className={`block text-[11px] font-normal leading-tight ${
                      editorMode === 'preview' ? 'opacity-90' : 'text-muted-foreground'
                    }`}
                  >
                    Resultado
                  </span>
                </span>
              </button>
            </div>

            <div className="flex gap-3 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 to-white px-4 py-3 text-xs text-sky-900 ring-1 ring-sky-100">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="leading-relaxed">
                Al guardar, el contenido se traduce automáticamente a 7 idiomas (ES, EN, FR, DE, PT, IT, CA) con DeepL para SEO
                multilingüe.
              </p>
            </div>

            <div style={{ display: editorMode === 'builder' ? undefined : 'none' }}>
              <ContentBlockBuilder
                key={`asoc-editar-builder-${id}-${builderResetKey}`}
                draftKey={`lpmbe-editar-asoc-contenido-${id}-draft`}
                initialHtml={contenidoMd}
                onChange={(html) => setContenidoMd(html)}
                onClearAll={handleClearAll}
                webMode={true}
                clearDraftOnMount={true}
              />
            </div>

            {editorMode === 'edit' && (
              <div className="overflow-hidden rounded-xl border border-border bg-background ring-1 ring-border/60">
                <TipTapEditor
                  content={contenidoMd}
                  onChange={(html) => setContenidoMd(html)}
                  onUploadImage={handleUploadEditorImage}
                  placeholder="Escribe el contenido..."
                  minHeight="400px"
                />
              </div>
            )}

            {editorMode === 'html' && (
              <div className="space-y-3">
                <p className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  Modo HTML: edita o pega código HTML directamente.
                </p>
                <textarea
                  value={contenidoMd}
                  onChange={(e) => setContenidoMd(e.target.value)}
                  rows={20}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                  placeholder={'<h2>Título</h2>\n<p>Párrafo...</p>'}
                />
              </div>
            )}

            {editorMode === 'preview' && (
              <div className="min-h-[400px] rounded-xl border border-border bg-gradient-to-b from-muted/30 to-background p-6 ring-1 ring-border/50">
                {contenidoMd ? (
                  <SafeHtml html={contenidoMd} />
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">Escribe contenido para ver la vista previa</p>
                )}
              </div>
            )}
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="order-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:from-primary/90 hover:to-primary/80 disabled:pointer-events-none disabled:opacity-50 sm:order-none"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Guardando…
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="order-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted sm:order-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="order-3 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 sm:ml-auto sm:order-none"
          >
            Limpiar todo
          </button>
        </div>
      </form>
    </main>
  );
}
