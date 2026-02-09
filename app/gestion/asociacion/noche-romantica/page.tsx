'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import R2ImageUploader from '@/app/components/R2ImageUploader';

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
      };
      const res = await fetch('/api/admin/noche-romantica/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Error guardando configuración');
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
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">Cargando...</p>
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
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">❤️</span>
        <div>
          <h1 className="text-2xl font-semibold">La Noche Romántica</h1>
          <p className="text-sm text-muted-foreground">
            Configuración del evento y pueblos participantes
          </p>
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
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab('config')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'config'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Configuración del evento
        </button>
        <button
          onClick={() => setTab('pueblos')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'pueblos'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pueblos participantes ({pueblos.length})
        </button>
      </div>

      {/* ==================== TAB: CONFIG ==================== */}
      {tab === 'config' && config && (
        <div className="space-y-6">
          {/* Básico */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-lg font-semibold">Datos generales</h2>
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

          {/* Estado */}
          <section className="rounded-lg border p-5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.activo}
                onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Evento activo</span>
            </label>
          </section>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
              onClick={() => {
                setShowAddPueblo(true);
                loadAllPueblos();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + Añadir pueblo
            </button>
          </div>

          {/* Modal añadir */}
          {showAddPueblo && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
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
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-primary/10 disabled:opacity-50"
                  >
                    <span>
                      <strong>{p.nombre}</strong>{' '}
                      <span className="text-muted-foreground">({p.provincia})</span>
                    </span>
                    <span className="text-primary">+ Añadir</span>
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
                  className="flex items-center justify-between rounded-lg border p-4 transition hover:border-primary/20"
                >
                  <div className="flex-1">
                    <Link
                      href={`/gestion/pueblos/${np.pueblo.slug}/noche-romantica`}
                      className="font-medium text-primary hover:underline"
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
                      className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
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

      <div className="mt-10 text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          href="/gestion/asociacion"
        >
          ← Volver a Gestión Asociación
        </Link>
      </div>
    </main>
  );
}
