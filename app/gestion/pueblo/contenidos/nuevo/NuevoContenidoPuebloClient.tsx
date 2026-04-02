'use client';

import Link from 'next/link';
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
  const [soloFechaEvento, setSoloFechaEvento] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<Array<File | null>>([null, null, null]);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sistema de 4 modos: Constructor visual, Editor TipTap, HTML directo, Vista previa
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [builderResetKey, setBuilderResetKey] = useState(0);

  // Limpiar formulario cuando cambia la categoría (ya no se carga página existente)
  // Ahora se permiten hasta 8 páginas por categoría
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

  function getBuilderDraftKey() {
    return `lpmbe-contenido-pueblo-${puebloId}-${tipo}-draft`;
  }

  function handleClearAll() {
    if (!confirm('¿Limpiar todo el formulario? Se perderá el contenido actual.')) return;
    setTitulo('');
    setResumen('');
    setContenido('');
    setCoverFile(null);
    setCoverUrl(null);
    setGalleryFiles([null, null, null]);
    setGalleryUrls([]);
    setPublishedAt('');
    setFechaInicioLocal('');
    setFechaFinLocal('');
    setSoloFechaEvento(false);
    setEstado('PUBLICADA');
    setEditorMode('builder');
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getBuilderDraftKey());
    }
    setBuilderResetKey((k) => k + 1);
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a contenidos del pueblo
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Nuevo contenido</h1>
              <p className="mt-0.5 text-sm text-white/80">
                <span className="font-semibold text-white/95">{puebloNombre}</span>
                {' · '}Noticias, eventos, artículos y páginas temáticas
              </p>
            </div>
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
            <div className="sm:col-span-1">
              <label className={lbl}>Tipo</label>
              <select
                className={field}
                value={tipo}
                onChange={(e) => {
                  const newTipo = e.target.value;
                  setTipo(newTipo);
                  if (newTipo !== 'PAGINA') {
                    setCategoria('');
                  }
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
            <div className="sm:col-span-1">
              <label className={lbl}>Estado</label>
              <select className={field} value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="PUBLICADA">Publicada</option>
                <option value="BORRADOR">Borrador</option>
                {tipo !== 'PAGINA' && <option value="PROGRAMADA">Programada</option>}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Título</label>
              <input className={field} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>
          </div>

          {tipo === 'PAGINA' && (
            <div className="mt-5 space-y-3 rounded-xl border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white p-4 ring-1 ring-violet-100">
              <label className="text-sm font-semibold text-violet-900">Categoría temática</label>
              <select
                className={field}
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
              <p className="text-xs text-violet-700/90">Se permiten 8 páginas temáticas por categoría.</p>
            </div>
          )}

          {estado === 'PROGRAMADA' && tipo !== 'PAGINA' && (
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
              <div className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 ring-1 ring-sky-100">
                <input
                  type="checkbox"
                  id="soloFechaEvento"
                  checked={soloFechaEvento}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSoloFechaEvento(checked);
                    if (checked) {
                      if (fechaInicioLocal.includes('T')) setFechaInicioLocal(fechaInicioLocal.split('T')[0]);
                      if (fechaFinLocal.includes('T')) setFechaFinLocal(fechaFinLocal.split('T')[0]);
                    }
                  }}
                  className="h-4 w-4 rounded border-sky-300 text-sky-600"
                />
                <label htmlFor="soloFechaEvento" className="text-sm font-medium text-sky-900">
                  Evento de todo el día (sin hora específica)
                </label>
              </div>
              <div>
                <label className={lbl}>{soloFechaEvento ? 'Fecha del evento' : 'Inicio del evento'}</label>
                <input
                  type={soloFechaEvento ? 'date' : 'datetime-local'}
                  className={field}
                  value={fechaInicioLocal}
                  onChange={(e) => setFechaInicioLocal(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={lbl}>
                  {soloFechaEvento ? 'Fecha fin (opcional)' : 'Fin del evento (opcional)'}
                </label>
                <input
                  type={soloFechaEvento ? 'date' : 'datetime-local'}
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
            Foto de portada y galería
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Máximo 3 imágenes en galería. La portada destaca en listados.</p>
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
            <div className="mt-5 rounded-xl border border-amber-100 bg-gradient-to-b from-amber-50/40 to-transparent p-4 ring-1 ring-amber-100/80">
              <p className="mb-3 text-sm font-medium text-amber-950/90">
                Galería — hasta 3 fotos en carrusel (web y app)
              </p>
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
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm">
          <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>
              Contenido
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Constructor visual, editor enriquecido, HTML o vista previa.</p>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={() => setEditorMode('builder')} className={modeTab(editorMode === 'builder', 'primary')}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
                key={`pueblo-nuevo-builder-${puebloId}-${tipo}-${builderResetKey}`}
                draftKey={`lpmbe-contenido-pueblo-${puebloId}-${tipo}-draft`}
                initialHtml={contenido}
                onChange={(html) => setContenido(html)}
                onClearAll={handleClearAll}
                showBrandLogos={false}
                puebloId={puebloId}
                puebloNombre={puebloNombre}
                webMode={true}
              />
            </div>

            {editorMode === 'edit' && (
              <div className="overflow-hidden rounded-xl border border-border bg-background ring-1 ring-border/60">
                <TipTapEditor
                  content={contenido}
                  onChange={(html) => setContenido(html)}
                  onUploadImage={handleUploadEditorImage}
                  placeholder="Escribe el contenido..."
                  minHeight="400px"
                />
              </div>
            )}

            {editorMode === 'html' && (
              <div className="space-y-3">
                <p className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  Modo HTML: pega aquí código HTML directamente.
                </p>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  rows={20}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                  placeholder={'<h2>Título</h2>\n<p>Párrafo...</p>'}
                />
              </div>
            )}

            {editorMode === 'preview' && (
              <div className="min-h-[400px] rounded-xl border border-border bg-gradient-to-b from-muted/30 to-background p-6 ring-1 ring-border/50">
                {contenido ? (
                  <SafeHtml html={contenido} />
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
            disabled={saving || (tipo === 'PAGINA' && !categoria)}
            className="order-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:from-primary/90 hover:to-primary/80 disabled:pointer-events-none disabled:opacity-50 sm:order-none"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Guardando…
              </>
            ) : tipo === 'PAGINA' ? (
              'Guardar página'
            ) : (
              'Crear contenido'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="order-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:order-none"
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
