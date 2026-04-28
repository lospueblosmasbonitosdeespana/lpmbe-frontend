'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import R2ImageUploader from '@/app/components/R2ImageUploader';
import { CAMPANA_NOCHE_ROMANTICA } from '../../_components/gestion-campana-themes';

// ==================== TYPES ====================

interface NRConfig {
  edicion: number;
  anio: number;
  fechaEvento: string | null;
  titulo: string;
  subtitulo: string | null;
  descripcion1Titulo: string | null;
  descripcion1Texto: string | null;
  descripcion2Titulo: string | null;
  descripcion2Texto: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  videoUrl: string | null;
  videoTipo: 'YOUTUBE' | 'R2';
  activo: boolean;
  activaEnApp: boolean;
  gestionActiva: boolean;
}

interface NRPueblo {
  id: number;
  puebloId: number;
  anio: number;
  titulo: string | null;
  cartelUrl: string | null;
  activo: boolean;
  orden: number;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
  };
  _count?: { actividades: number; negocios: number };
}

interface PuebloOption {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
}

// ==================== COMPONENT ====================

export default function GestionNocheRomanticaPage() {
  const [tab, setTab] = useState<'config' | 'pueblos'>('config');
  const [config, setConfig] = useState<NRConfig | null>(null);
  const [pueblos, setPueblos] = useState<NRPueblo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selector de pueblos
  const [allPueblos, setAllPueblos] = useState<PuebloOption[]>([]);
  const [showAddPueblo, setShowAddPueblo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingPueblo, setAddingPueblo] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, pueblosRes] = await Promise.all([
        fetch('/api/admin/noche-romantica/config'),
        fetch('/api/admin/noche-romantica/pueblos'),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (pueblosRes.ok) setPueblos(await pueblosRes.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadAllPueblos = async () => {
    if (allPueblos.length > 0) return;
    try {
      const res = await fetch('/api/pueblos');
      if (res.ok) {
        const data = await res.json();
        setAllPueblos(Array.isArray(data) ? data : []);
      }
    } catch {
      // silenciar
    }
  };

  // ==================== CONFIG HANDLERS ====================

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Solo enviar los campos que acepta el DTO (evitar 400 por forbidNonWhitelisted)
      const payload = {
        edicion: config.edicion,
        anio: config.anio,
        fechaEvento: config.fechaEvento || undefined,
        titulo: config.titulo,
        subtitulo: config.subtitulo || undefined,
        descripcion1Titulo: config.descripcion1Titulo || undefined,
        descripcion1Texto: config.descripcion1Texto || undefined,
        descripcion2Titulo: config.descripcion2Titulo || undefined,
        descripcion2Texto: config.descripcion2Texto || undefined,
        logoUrl: config.logoUrl || undefined,
        heroImageUrl: config.heroImageUrl || undefined,
        videoUrl: config.videoUrl || undefined,
        videoTipo: config.videoTipo,
        activo: config.activo,
        activaEnApp: config.activaEnApp,
        gestionActiva: config.gestionActiva,
      };
      const res = await fetch('/api/admin/noche-romantica/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let msg = err.message || err.error || 'Error guardando configuración';
        if (typeof msg === 'string' && msg.startsWith('{')) {
          try {
            const parsed = JSON.parse(msg);
            msg = Array.isArray(parsed.message) ? parsed.message.join('. ') : (parsed.message || msg);
          } catch { /* keep msg */ }
        } else if (Array.isArray(err.message)) {
          msg = err.message.join('. ');
        }
        throw new Error(msg);
      }
      const updated = await res.json();
      setConfig(updated);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  // ==================== PUEBLOS HANDLERS ====================

  const handleAddPueblo = async (puebloId: number) => {
    setAddingPueblo(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/noche-romantica/pueblos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Error añadiendo pueblo');
      }
      setShowAddPueblo(false);
      setSearchTerm('');
      await loadData();
      setSuccess('Pueblo añadido correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? 'Error añadiendo pueblo');
    } finally {
      setAddingPueblo(false);
    }
  };

  const handleRemovePueblo = async (nrPuebloId: number, puebloNombre: string) => {
    if (!confirm(`¿Eliminar "${puebloNombre}" de La Noche Romántica?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/pueblos/${nrPuebloId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error eliminando pueblo');
      await loadData();
      setSuccess('Pueblo eliminado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message ?? 'Error eliminando pueblo');
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/gestion/asociacion"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-pink-300/45 hover:bg-pink-50/40 hover:text-foreground"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Gestión Asociación
        </Link>
        <div
          className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg"
          style={{ background: CAMPANA_NOCHE_ROMANTICA.heroGradient }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-300/25 blur-3xl" aria-hidden />
          <h1 className="text-2xl font-bold">La Noche Romántica</h1>
          <p className="mt-1 text-sm text-white/90">Cargando configuración…</p>
        </div>
        <p className="text-muted-foreground">Un momento…</p>
      </main>
    );
  }

  const inscribedIds = new Set(pueblos.map((p) => p.puebloId));
  const filteredPueblos = allPueblos.filter(
    (p) =>
      !inscribedIds.has(p.id) &&
      (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.provincia.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/gestion/asociacion"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-pink-300/45 hover:bg-pink-50/40 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Gestión Asociación
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
        style={{ background: CAMPANA_NOCHE_ROMANTICA.heroGradient }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-fuchsia-300/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-rose-200/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner ring-1 ring-white/30">
            ❤️
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl">La Noche Romántica</h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-white/90">
              Calendario nacional, copy y participación de pueblos — con el tono del evento, no el genérico de gestión.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* TABS */}
      <div className={`mb-6 flex gap-1 p-1 ${CAMPANA_NOCHE_ROMANTICA.tabBar}`}>
        <button
          type="button"
          onClick={() => setTab('config')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'config' ? CAMPANA_NOCHE_ROMANTICA.tabActive : CAMPANA_NOCHE_ROMANTICA.tabInactive
          }`}
        >
          Configuración del evento
        </button>
        <button
          type="button"
          onClick={() => setTab('pueblos')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'pueblos' ? CAMPANA_NOCHE_ROMANTICA.tabActive : CAMPANA_NOCHE_ROMANTICA.tabInactive
          }`}
        >
          Pueblos participantes ({pueblos.length})
        </button>
      </div>

      {/* ==================== TAB: CONFIG ==================== */}
      {tab === 'config' && config && (
        <div className="space-y-6">
          {/* Básico */}
          <section className={`rounded-xl border p-5 shadow-sm ${CAMPANA_NOCHE_ROMANTICA.sectionAccent}`}>
            <h2 className="mb-4 text-lg font-semibold text-pink-950 dark:text-pink-50">Datos generales</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Edición</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.edicion}
                  onChange={(e) =>
                    setConfig({ ...config, edicion: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Año</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.anio}
                  onChange={(e) =>
                    setConfig({ ...config, anio: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha del evento</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.fechaEvento ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, fechaEvento: e.target.value || null })
                  }
                />
                {config.fechaEvento && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(config.fechaEvento + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm font-medium">Título</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.titulo}
                  onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm font-medium">Subtítulo</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.subtitulo ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, subtitulo: e.target.value || null })
                  }
                />
              </div>
            </div>
          </section>

          {/* Imágenes */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-lg font-semibold">Imágenes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <R2ImageUploader
                label="Logo del evento"
                value={config.logoUrl}
                onChange={(url) => setConfig({ ...config, logoUrl: url })}
                folder="noche-romantica"
                previewHeight="h-24"
              />
              <R2ImageUploader
                label="Hero / Cartel principal"
                value={config.heroImageUrl}
                onChange={(url) => setConfig({ ...config, heroImageUrl: url })}
                folder="noche-romantica"
                previewHeight="h-48"
              />
            </div>
          </section>

          {/* Descripciones */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-lg font-semibold">Descripciones</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descripción 1 - Título
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.descripcion1Titulo ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, descripcion1Titulo: e.target.value || null })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descripción 1 - Texto
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.descripcion1Texto ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, descripcion1Texto: e.target.value || null })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descripción 2 - Título
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.descripcion2Titulo ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, descripcion2Titulo: e.target.value || null })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descripción 2 - Texto
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.descripcion2Texto ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, descripcion2Texto: e.target.value || null })
                  }
                />
              </div>
            </div>
          </section>

          {/* Video */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-lg font-semibold">Video</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo de video</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.videoTipo}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      videoTipo: e.target.value as 'YOUTUBE' | 'R2',
                    })
                  }
                >
                  <option value="YOUTUBE">YouTube</option>
                  <option value="R2">Video propio (R2)</option>
                </select>
              </div>
              {config.videoTipo === 'YOUTUBE' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">URL de YouTube</label>
                  <input
                    type="url"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={config.videoUrl ?? ''}
                    onChange={(e) =>
                      setConfig({ ...config, videoUrl: e.target.value || null })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <R2ImageUploader
                  label="Video (subir a R2)"
                  value={config.videoUrl}
                  onChange={(url) => setConfig({ ...config, videoUrl: url })}
                  folder="noche-romantica/videos"
                  accept="video/*"
                  previewHeight="h-32"
                />
              )}
            </div>
          </section>

          {/* Estado — Controles de visibilidad */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-1 text-lg font-semibold">Estado de la campaña</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Estos dos interruptores son <strong>independientes</strong>. Puedes abrir la zona
              de gestión a los alcaldes para que vayan rellenando información sin que la página
              pública esté todavía visible.
            </p>
            <div className="space-y-4">
              {/* 1. Web pública: Header + página /noche-romantica */}
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activo}
                  onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold">Visible en la web pública</span>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Muestra «La Noche Romántica» en el menú de navegación de la web pública y
                    habilita la página <code className="rounded bg-muted px-1">/noche-romantica</code>{' '}
                    con los pueblos participantes. Los visitantes pueden ver la campaña.
                  </p>
                  {config.activo && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Visible en la web pública
                    </div>
                  )}
                </div>
              </label>

              {/* 2. Gestión activa para alcaldes */}
              <label className="flex items-start gap-3 rounded-lg border border-violet-200 p-3 hover:bg-violet-50/40 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.gestionActiva}
                  onChange={(e) => setConfig({ ...config, gestionActiva: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-violet-600"
                />
                <div>
                  <span className="text-sm font-semibold">Abrir la zona de gestión a los alcaldes</span>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Permite que los alcaldes entren en{' '}
                    <code className="rounded bg-muted px-1">/gestion/pueblos/&lt;pueblo&gt;/noche-romantica</code>{' '}
                    y editen la edición vigente <strong>aunque la web pública aún no esté
                    publicada</strong>. Útil para que vayan preparando descripciones, fotos,
                    actividades y negocios participantes con tiempo. Si <em>«Visible en la web
                    pública»</em> ya está activo, no hace falta tocar este interruptor: la
                    gestión se abre automáticamente.
                  </p>
                  {config.gestionActiva && !config.activo && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                      Los alcaldes pueden editar — la web pública aún no se ve
                    </div>
                  )}
                  {config.activo && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      La gestión también está abierta porque la web pública está activa
                    </div>
                  )}
                </div>
              </label>

              {/* 3. Aviso sobre la app móvil */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                <p className="font-semibold">📱 ¿Y el botón de la app móvil?</p>
                <p className="mt-1 leading-relaxed">
                  El botón del evento estacional que aparece en la <strong>home de la app</strong>{' '}
                  (Semana Santa / Noche Romántica / Navidad) <strong>no se controla aquí</strong>.
                  Se elige en una pantalla aparte:
                </p>
                <p className="mt-2">
                  <a
                    href="/gestion/asociacion/app/evento-activo"
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
                  >
                    Ir a «Evento estacional de la app» →
                  </a>
                </p>
                <p className="mt-2 leading-relaxed text-amber-800">
                  Cuando llegue el momento de Noche Romántica, entra en esa pantalla y selecciona{' '}
                  <em>«Noche Romántica»</em> para que aparezca el botón en la app.
                </p>
              </div>

              {/* Resumen visual */}
              <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground/80">Resumen:</p>
                <p>
                  Web pública (header + página): <strong className={config.activo ? 'text-emerald-700' : 'text-red-600'}>{config.activo ? 'VISIBLE' : 'OCULTA'}</strong>
                </p>
                <p>
                  Gestión de alcaldes:{' '}
                  <strong className={config.activo || config.gestionActiva ? 'text-emerald-700' : 'text-red-600'}>
                    {config.activo || config.gestionActiva ? 'ABIERTA' : 'CERRADA'}
                  </strong>
                  {!config.activo && config.gestionActiva ? ' (anticipada)' : ''}
                </p>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className={CAMPANA_NOCHE_ROMANTICA.primaryButton}
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {/* ==================== TAB: PUEBLOS ==================== */}
      {tab === 'pueblos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Pueblos participantes ({pueblos.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddPueblo(true);
                loadAllPueblos();
              }}
              className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}
            >
              + Añadir pueblo
            </button>
          </div>

          {/* Modal añadir */}
          {showAddPueblo && (
            <div className={`p-4 ${CAMPANA_NOCHE_ROMANTICA.formCallout}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Seleccionar pueblo</h3>
                <button
                  onClick={() => {
                    setShowAddPueblo(false);
                    setSearchTerm('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cerrar
                </button>
              </div>
              <input
                type="text"
                className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Buscar pueblo por nombre o provincia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filteredPueblos.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    {allPueblos.length === 0
                      ? 'Cargando pueblos...'
                      : 'No se encontraron pueblos'}
                  </p>
                )}
                {filteredPueblos.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddPueblo(p.id)}
                    disabled={addingPueblo}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-pink-100/60 disabled:opacity-50 dark:hover:bg-pink-950/30"
                  >
                    <span>
                      <strong>{p.nombre}</strong>{' '}
                      <span className="text-muted-foreground">({p.provincia})</span>
                    </span>
                    <span className="font-medium text-fuchsia-600 dark:text-fuchsia-300">+ Añadir</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de pueblos */}
          {pueblos.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                Aún no hay pueblos participantes este año.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pulsa "Añadir pueblo" para inscribir el primer pueblo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pueblos.map((np) => (
                <div
                  key={np.id}
                  className="flex items-center justify-between rounded-lg border border-pink-100/80 p-4 transition hover:border-pink-300/60 dark:border-pink-900/40"
                >
                  <div className="flex-1">
                    <Link
                      href={`/gestion/pueblos/${np.pueblo.slug}/noche-romantica`}
                      className="font-semibold text-pink-800 hover:text-fuchsia-700 hover:underline dark:text-pink-200 dark:hover:text-fuchsia-200"
                    >
                      {np.pueblo.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {np.pueblo.provincia}, {np.pueblo.comunidad}
                      {np._count && (
                        <>
                          {' '}
                          · {np._count.actividades} actividades · {np._count.negocios}{' '}
                          negocios
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/gestion/pueblos/${np.pueblo.slug}/noche-romantica`}
                      className="rounded-md border border-pink-200/80 px-3 py-1.5 text-xs font-medium text-pink-900/80 hover:border-fuchsia-400 hover:text-fuchsia-800 dark:border-pink-800 dark:text-pink-200"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() =>
                        handleRemovePueblo(np.id, np.pueblo.nombre)
                      }
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-10 border-t border-pink-100/80 pt-6 text-sm dark:border-pink-900/40">
        <Link className="font-medium text-fuchsia-700 hover:text-pink-900 hover:underline dark:text-fuchsia-300 dark:hover:text-pink-100" href="/gestion/asociacion">
          ← Volver a Gestión Asociación
        </Link>
      </div>
    </main>
  );
}
