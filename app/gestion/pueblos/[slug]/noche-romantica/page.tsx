'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import R2ImageUploader from '@/app/components/R2ImageUploader';
import { CAMPANA_NOCHE_ROMANTICA } from '../../../_components/gestion-campana-themes';
import { GestionPuebloSubpageShell } from '../../_components/GestionPuebloSubpageShell';
import { HeroIconHeart } from '../../_components/gestion-pueblo-hero-icons';

// ==================== TYPES ====================

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
  orden: number;
}

interface Negocio {
  id: number;
  tipo: 'HOTEL' | 'RESTAURANTE' | 'COMERCIO' | 'OTRO';
  nombre: string;
  descripcion: string | null;
  horario: string | null;
  menuUrl: string | null;
  fotoUrl: string | null;
  orden: number;
}

interface NRPuebloData {
  id: number;
  puebloId: number;
  cartelUrl: string | null;
  titulo: string | null;
  descripcion: string | null;
  pueblo: { id: number; nombre: string; slug: string };
  actividades: Actividad[];
  negocios: Negocio[];
}

const NEGOCIO_TIPOS = [
  { value: 'HOTEL', label: 'Hotel / Alojamiento' },
  { value: 'RESTAURANTE', label: 'Restaurante' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'OTRO', label: 'Otro' },
] as const;

const NEGOCIO_LABEL: Record<string, string> = {
  HOTEL: 'Hoteles y Alojamientos',
  RESTAURANTE: 'Restaurantes',
  COMERCIO: 'Comercios',
  OTRO: 'Otros',
};

// ==================== COMPONENT ====================

export default function GestionPuebloNocheRomanticaPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<NRPuebloData | null>(null);
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [campaignActive, setCampaignActive] = useState(true);
  const [notInscribed, setNotInscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Info editable
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cartelUrl, setCartelUrl] = useState('');

  // Formularios inline
  const [showNewActividad, setShowNewActividad] = useState(false);
  const [newActividad, setNewActividad] = useState({ titulo: '', descripcion: '', horario: '', fotoUrl: '' });
  const [editingActividad, setEditingActividad] = useState<number | null>(null);
  const [editActividad, setEditActividad] = useState({ titulo: '', descripcion: '', horario: '', fotoUrl: '' });

  const [showNewNegocio, setShowNewNegocio] = useState(false);
  const [newNegocio, setNewNegocio] = useState({ tipo: 'RESTAURANTE', nombre: '', descripcion: '', horario: '', fotoUrl: '', menuUrl: '' });
  const [editingNegocio, setEditingNegocio] = useState<number | null>(null);
  const [editNegocio, setEditNegocio] = useState({ tipo: 'RESTAURANTE', nombre: '', descripcion: '', horario: '', fotoUrl: '', menuUrl: '' });

  // Resolve puebloId from slug
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pueblos/${slug}`);
        if (res.ok) {
          const p = await res.json();
          setPuebloId(p.id);
        }
      } catch { /* ignore */ }
    })();
  }, [slug]);

  const loadData = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    setNotInscribed(false);
    try {
      const res = await fetch(`/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (res.status === 404) {
        setNotInscribed(true);
        try {
          const cfgRes = await fetch(`/api/admin/noche-romantica/config`, { credentials: 'include', cache: 'no-store' });
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            setCampaignActive(cfg?.activo ?? true);
          } else {
            const pubRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noche-romantica/config`);
            if (pubRes.ok) { const cfg = await pubRes.json(); setCampaignActive(cfg?.activo ?? true); }
          }
        } catch { /* ignore */ }
        return;
      }
      if (!res.ok) throw new Error('Error cargando datos');
      const json = await res.json();
      const d = json.participante ?? json;
      setCampaignActive(json.config?.activo ?? false);
      setData(d);
      setTitulo(d.titulo ?? '');
      setDescripcion(d.descripcion ?? '');
      setCartelUrl(d.cartelUrl ?? '');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => { if (puebloId) loadData(); }, [puebloId, loadData]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ==================== INFO HANDLERS ====================

  const saveInfo = async () => {
    if (!puebloId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: titulo || null, descripcion: descripcion || null, cartelUrl: cartelUrl || null }),
      });
      if (!res.ok) throw new Error('Error guardando');
      await loadData();
      flash('Información guardada');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  // ==================== ACTIVIDADES HANDLERS ====================

  const createActividad = async () => {
    if (!puebloId || !newActividad.titulo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newActividad.titulo,
          descripcion: newActividad.descripcion || null,
          horario: newActividad.horario || null,
          fotoUrl: newActividad.fotoUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Error creando actividad');
      setNewActividad({ titulo: '', descripcion: '', horario: '', fotoUrl: '' });
      setShowNewActividad(false);
      await loadData();
      flash('Actividad creada');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const saveActividad = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/actividades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: editActividad.titulo,
          descripcion: editActividad.descripcion || null,
          horario: editActividad.horario || null,
          fotoUrl: editActividad.fotoUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Error editando actividad');
      setEditingActividad(null);
      await loadData();
      flash('Actividad actualizada');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const deleteActividad = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar la actividad "${nombre}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/actividades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando actividad');
      await loadData();
      flash('Actividad eliminada');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  // ==================== NEGOCIOS HANDLERS ====================

  const createNegocio = async () => {
    if (!puebloId || !newNegocio.nombre.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/negocios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: newNegocio.tipo,
          nombre: newNegocio.nombre,
          descripcion: newNegocio.descripcion || null,
          horario: newNegocio.horario || null,
          fotoUrl: newNegocio.fotoUrl || null,
          menuUrl: newNegocio.menuUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Error creando negocio');
      setNewNegocio({ tipo: 'RESTAURANTE', nombre: '', descripcion: '', horario: '', fotoUrl: '', menuUrl: '' });
      setShowNewNegocio(false);
      await loadData();
      flash('Negocio añadido');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const saveNegocio = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/negocios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: editNegocio.tipo,
          nombre: editNegocio.nombre,
          descripcion: editNegocio.descripcion || null,
          horario: editNegocio.horario || null,
          fotoUrl: editNegocio.fotoUrl || null,
          menuUrl: editNegocio.menuUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Error editando negocio');
      setEditingNegocio(null);
      await loadData();
      flash('Negocio actualizado');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const deleteNegocio = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar el negocio "${nombre}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/noche-romantica/negocios/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando negocio');
      await loadData();
      flash('Negocio eliminado');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  // ==================== RENDER ====================

  if (loading && !data) {
    return (
      <GestionPuebloSubpageShell
        slug={slug}
        title="La Noche Romántica"
        subtitle="Cargando datos del pueblo…"
        heroIcon={<HeroIconHeart />}
        theme="nocheRomantica"
      >
        <p className="text-muted-foreground">Cargando…</p>
      </GestionPuebloSubpageShell>
    );
  }

  if (notInscribed) {
    return (
      <GestionPuebloSubpageShell
        slug={slug}
        title="La Noche Romántica"
        subtitle={
          <>
            Participación en la red · <span className="font-semibold text-white/95">{slug}</span>
          </>
        }
        heroIcon={<HeroIconHeart />}
        theme="nocheRomantica"
      >
        {!campaignActive ? (
          <div className="rounded-xl border border-pink-200/80 bg-gradient-to-br from-pink-50 via-fuchsia-50/80 to-violet-50/60 px-6 py-8 text-center shadow-sm">
            <p className="text-2xl">❤️</p>
            <h2 className="mt-3 text-lg font-semibold text-pink-900">
              La campaña de La Noche Romántica ha finalizado
            </h2>
            <p className="mt-2 text-sm text-pink-800/90">
              Las páginas del evento anterior siguen visibles en internet, pero la
              inscripción y edición no estarán disponibles hasta la próxima edición.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-pink-200/80 bg-gradient-to-br from-pink-50 via-fuchsia-50/80 to-violet-50/60 p-6 text-center shadow-sm dark:border-pink-900/50 dark:from-pink-950/40 dark:via-fuchsia-950/30 dark:to-violet-950/30">
            <p className="font-semibold text-pink-900 dark:text-pink-100">
              Este pueblo no está inscrito en La Noche Romántica de este año.
            </p>
            <p className="mt-2 text-sm text-pink-800/90 dark:text-pink-200/90">
              Solicita al administrador que lo inscriba desde la sección de gestión de la asociación.
            </p>
          </div>
        )}
      </GestionPuebloSubpageShell>
    );
  }

  const negociosByType = (data?.negocios ?? []).reduce(
    (acc, n) => {
      if (!acc[n.tipo]) acc[n.tipo] = [];
      acc[n.tipo].push(n);
      return acc;
    },
    {} as Record<string, Negocio[]>,
  );

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="La Noche Romántica"
      subtitle={
        <>
          Actividades, negocios y cartel ·{' '}
          <span className="font-semibold text-white/95">{data?.pueblo?.nombre ?? slug}</span>
        </>
      }
      heroIcon={<HeroIconHeart />}
      theme="nocheRomantica"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {!campaignActive && (
        <div className="mb-6 rounded-xl border border-pink-200/80 bg-gradient-to-br from-pink-50 via-fuchsia-50/80 to-violet-50/60 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">❤️</span>
            <div>
              <h3 className="font-semibold text-pink-900">La campaña de La Noche Romántica ha finalizado</h3>
              <p className="mt-1 text-sm text-pink-800/90">
                Las páginas del evento siguen visibles en internet pero la edición
                no está disponible hasta la próxima edición. Puedes consultar los datos del año pasado a continuación.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={!campaignActive ? 'pointer-events-none select-none opacity-60' : ''}>
      {/* ==================== INFO GENERAL ==================== */}
      <section className={`mb-8 rounded-xl border p-5 shadow-sm ${CAMPANA_NOCHE_ROMANTICA.sectionAccent}`}>
        <h2 className="mb-4 text-lg font-semibold text-pink-950 dark:text-pink-50">Información general</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Título del evento en tu pueblo</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: La Noche Romántica en Albarracín"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción general</label>
            <textarea
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las actividades que se realizarán en tu pueblo..."
            />
          </div>
          <R2ImageUploader
            label="Cartel anunciador"
            value={cartelUrl || null}
            onChange={(url) => setCartelUrl(url ?? '')}
            folder="noche-romantica/pueblos"
            previewHeight="h-48"
          />
          <button
            onClick={saveInfo}
            disabled={saving}
            className={CAMPANA_NOCHE_ROMANTICA.primaryButton}
          >
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </section>

      {/* ==================== ACTIVIDADES ==================== */}
      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actividades / Programa</h2>
          <button
            onClick={() => setShowNewActividad(true)}
            className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}
          >
            + Añadir actividad
          </button>
        </div>

        {/* Crear actividad */}
        {showNewActividad && (
          <div className={`mb-4 p-4 space-y-3 ${CAMPANA_NOCHE_ROMANTICA.formCallout}`}>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Título de la actividad *"
              value={newActividad.titulo}
              onChange={(e) => setNewActividad({ ...newActividad, titulo: e.target.value })}
              autoFocus
            />
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Descripción"
              value={newActividad.descripcion}
              onChange={(e) => setNewActividad({ ...newActividad, descripcion: e.target.value })}
            />
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Horario (ej: 20:00 - 23:00)"
              value={newActividad.horario}
              onChange={(e) => setNewActividad({ ...newActividad, horario: e.target.value })}
            />
            <R2ImageUploader
              label="Foto de la actividad"
              value={newActividad.fotoUrl || null}
              onChange={(url) => setNewActividad({ ...newActividad, fotoUrl: url ?? '' })}
              folder="noche-romantica/actividades"
              previewHeight="h-32"
            />
            <div className="flex gap-2">
              <button onClick={createActividad} disabled={saving || !newActividad.titulo.trim()} className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}>
                Crear
              </button>
              <button onClick={() => setShowNewActividad(false)} className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista actividades */}
        {(data?.actividades ?? []).length === 0 && !showNewActividad ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay actividades. Añade la primera pulsando el botón.
          </p>
        ) : (
          <div className="space-y-2">
            {(data?.actividades ?? []).map((a) => (
              <div key={a.id} className="rounded-lg border p-4">
                {editingActividad === a.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={editActividad.titulo}
                      onChange={(e) => setEditActividad({ ...editActividad, titulo: e.target.value })}
                    />
                    <textarea
                      rows={2}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={editActividad.descripcion}
                      onChange={(e) => setEditActividad({ ...editActividad, descripcion: e.target.value })}
                    />
                    <input
                      type="text"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Horario"
                      value={editActividad.horario}
                      onChange={(e) => setEditActividad({ ...editActividad, horario: e.target.value })}
                    />
                    <R2ImageUploader
                      label="Foto de la actividad"
                      value={editActividad.fotoUrl || null}
                      onChange={(url) => setEditActividad({ ...editActividad, fotoUrl: url ?? '' })}
                      folder="noche-romantica/actividades"
                      previewHeight="h-32"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveActividad(a.id)} disabled={saving} className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}>
                        Guardar
                      </button>
                      <button onClick={() => setEditingActividad(null)} className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      {a.fotoUrl && (
                        <img src={a.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" />
                      )}
                      <div>
                        <h3 className="font-medium">{a.titulo}</h3>
                        {a.horario && <p className="text-sm text-primary">{a.horario}</p>}
                        {a.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.descripcion}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingActividad(a.id);
                          setEditActividad({
                            titulo: a.titulo,
                            descripcion: a.descripcion ?? '',
                            horario: a.horario ?? '',
                            fotoUrl: a.fotoUrl ?? '',
                          });
                        }}
                        className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteActividad(a.id, a.titulo)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==================== NEGOCIOS ==================== */}
      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Negocios participantes</h2>
          <button
            onClick={() => setShowNewNegocio(true)}
            className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}
          >
            + Añadir negocio
          </button>
        </div>

        {/* Crear negocio */}
        {showNewNegocio && (
          <div className={`mb-4 p-4 space-y-3 ${CAMPANA_NOCHE_ROMANTICA.formCallout}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo *</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={newNegocio.tipo}
                  onChange={(e) => setNewNegocio({ ...newNegocio, tipo: e.target.value })}
                >
                  {NEGOCIO_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre *</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={newNegocio.nombre}
                  onChange={(e) => setNewNegocio({ ...newNegocio, nombre: e.target.value })}
                  autoFocus
                />
              </div>
            </div>
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Descripción"
              value={newNegocio.descripcion}
              onChange={(e) => setNewNegocio({ ...newNegocio, descripcion: e.target.value })}
            />
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Horario"
              value={newNegocio.horario}
              onChange={(e) => setNewNegocio({ ...newNegocio, horario: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <R2ImageUploader
                label="Foto del negocio"
                value={newNegocio.fotoUrl || null}
                onChange={(url) => setNewNegocio({ ...newNegocio, fotoUrl: url ?? '' })}
                folder="noche-romantica/negocios"
                previewHeight="h-28"
              />
              <R2ImageUploader
                label="Carta / Menú (imagen)"
                value={newNegocio.menuUrl || null}
                onChange={(url) => setNewNegocio({ ...newNegocio, menuUrl: url ?? '' })}
                folder="noche-romantica/negocios"
                previewHeight="h-28"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createNegocio} disabled={saving || !newNegocio.nombre.trim()} className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}>
                Crear
              </button>
              <button onClick={() => setShowNewNegocio(false)} className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista negocios agrupados por tipo */}
        {Object.keys(negociosByType).length === 0 && !showNewNegocio ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay negocios. Añade el primero pulsando el botón.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(negociosByType).map(([tipo, negocios]) => (
              <div key={tipo}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {NEGOCIO_LABEL[tipo] ?? tipo}
                </h3>
                <div className="space-y-2">
                  {negocios.map((n) => (
                    <div key={n.id} className="rounded-lg border p-4">
                      {editingNegocio === n.id ? (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <select
                              className="w-full rounded-md border px-3 py-2 text-sm"
                              value={editNegocio.tipo}
                              onChange={(e) => setEditNegocio({ ...editNegocio, tipo: e.target.value })}
                            >
                              {NEGOCIO_TIPOS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              className="w-full rounded-md border px-3 py-2 text-sm"
                              value={editNegocio.nombre}
                              onChange={(e) => setEditNegocio({ ...editNegocio, nombre: e.target.value })}
                            />
                          </div>
                          <textarea
                            rows={2}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            value={editNegocio.descripcion}
                            onChange={(e) => setEditNegocio({ ...editNegocio, descripcion: e.target.value })}
                          />
                          <input
                            type="text"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Horario"
                            value={editNegocio.horario}
                            onChange={(e) => setEditNegocio({ ...editNegocio, horario: e.target.value })}
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <R2ImageUploader
                              label="Foto del negocio"
                              value={editNegocio.fotoUrl || null}
                              onChange={(url) => setEditNegocio({ ...editNegocio, fotoUrl: url ?? '' })}
                              folder="noche-romantica/negocios"
                              previewHeight="h-28"
                            />
                            <R2ImageUploader
                              label="Carta / Menú (imagen)"
                              value={editNegocio.menuUrl || null}
                              onChange={(url) => setEditNegocio({ ...editNegocio, menuUrl: url ?? '' })}
                              folder="noche-romantica/negocios"
                              previewHeight="h-28"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveNegocio(n.id)} disabled={saving} className={CAMPANA_NOCHE_ROMANTICA.primaryButtonSm}>
                              Guardar
                            </button>
                            <button onClick={() => setEditingNegocio(null)} className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            {n.fotoUrl && (
                              <img src={n.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" />
                            )}
                            <div>
                              <h4 className="font-medium">{n.nombre}</h4>
                              {n.horario && <p className="text-sm text-primary">{n.horario}</p>}
                              {n.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.descripcion}</p>}
                              {n.menuUrl && (
                                <a href={n.menuUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-xs text-primary hover:underline">
                                  Ver carta/menú
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingNegocio(n.id);
                                setEditNegocio({
                                  tipo: n.tipo,
                                  nombre: n.nombre,
                                  descripcion: n.descripcion ?? '',
                                  horario: n.horario ?? '',
                                  fotoUrl: n.fotoUrl ?? '',
                                  menuUrl: n.menuUrl ?? '',
                                });
                              }}
                              className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteNegocio(n.id, n.nombre)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </GestionPuebloSubpageShell>
  );
}
