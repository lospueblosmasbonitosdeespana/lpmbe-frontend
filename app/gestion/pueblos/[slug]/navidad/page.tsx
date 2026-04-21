'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import R2ImageUploader from '@/app/components/R2ImageUploader';
import { CAMPANA_NAVIDAD } from '../../../_components/gestion-campana-themes';
import { GestionPuebloSubpageShell } from '../../_components/GestionPuebloSubpageShell';
import CampanaLandingEditor from '../../_components/CampanaLandingEditor';
import { HeroIconTree } from '../../_components/gestion-pueblo-hero-icons';

const TIPO_LABELS: Record<string, string> = {
  ENCENDIDO_LUCES: 'Encendido de luces',
  MERCADILLO: 'Mercadillo navideño',
  BELEN: 'Belén',
  BELEN_VIVIENTE: 'Belén viviente',
  CONCIERTO: 'Concierto / Villancicos',
  TALLER_INFANTIL: 'Taller infantil',
  ESPECTACULO: 'Espectáculo',
  ZAMBOMBA: 'Zambomba',
  NOCHEVIEJA: 'Nochevieja / Fin de año',
  CABALGATA_REYES: 'Cabalgata de Reyes',
  CABALGATA_PAPA_NOEL: 'Cabalgata de Papá Noel',
  GASTRONOMIA: 'Gastronomía',
  RUTA_TURISTICA: 'Ruta turística',
  OTRO: 'Otro',
};

const PUBLICO_LABELS: Record<string, string> = {
  TODOS: 'Todos los públicos',
  NINOS: 'Niños',
  ADULTOS: 'Adultos',
  FAMILIAS: 'Familias',
};

const TIPO_ICONS: Record<string, string> = {
  ENCENDIDO_LUCES: '💡',
  MERCADILLO: '🎄',
  BELEN: '⭐',
  BELEN_VIVIENTE: '🌟',
  CONCIERTO: '🎵',
  TALLER_INFANTIL: '🧒',
  ESPECTACULO: '🎪',
  ZAMBOMBA: '🥁',
  NOCHEVIEJA: '🎆',
  CABALGATA_REYES: '👑',
  CABALGATA_PAPA_NOEL: '🎅',
  GASTRONOMIA: '🍽️',
  RUTA_TURISTICA: '🗺️',
  OTRO: '📌',
};

type Evento = {
  id: number;
  tipo: string;
  publicoObjetivo: string;
  titulo: string;
  descripcion: string | null;
  avisosImportantes?: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  horarioApertura?: string | null;
  horarioCierre?: string | null;
  diasSemanaAbierto?: number[] | null;
  fotoUrl: string | null;
  youtubeUrl?: string | null;
  streamUrl?: string | null;
  inicioLat?: number | null;
  inicioLng?: number | null;
  finLat?: number | null;
  finLng?: number | null;
  paradas?: Array<{ lat: number; lng: number; label?: string }> | null;
  googleMapsUrl?: string | null;
  esFiestaInteresTuristico?: boolean;
  orden: number;
};

type Participante = {
  id: number;
  puebloId: number;
  titulo: string | null;
  descripcion: string | null;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  activo: boolean;
  pueblo: { id: number; nombre: string; slug: string };
  eventos: Evento[];
};

const EMPTY_EVENTO = {
  tipo: 'OTRO',
  publicoObjetivo: 'TODOS',
  titulo: '',
  descripcion: '',
  avisosImportantes: '',
  ubicacion: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  fechaFinStr: '',
  horarioApertura: '',
  horarioCierre: '',
  fotoUrl: '',
  youtubeUrl: '',
  streamUrl: '',
  googleMapsUrl: '',
  esFiestaInteresTuristico: false,
};

export default function GestionPuebloNavidadPage() {
  const { slug } = useParams<{ slug: string }>();
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [campaignActive, setCampaignActive] = useState(true);
  const [data, setData] = useState<Participante | null>(null);
  const [notInscribed, setNotInscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inscribing, setInscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewEvento, setShowNewEvento] = useState(false);
  const [editingEventoId, setEditingEventoId] = useState<number | null>(null);
  const [newEvento, setNewEvento] = useState({ ...EMPTY_EVENTO });
  const [editEvento, setEditEvento] = useState({ ...EMPTY_EVENTO });
  const newEventoFormRef = useRef<HTMLDivElement>(null);
  const editEventoFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/pueblos/${slug}`);
      if (!res.ok) return;
      const p = await res.json();
      setPuebloId(p.id);
    })();
  }, [slug]);

  const loadData = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    setNotInscribed(false);
    try {
      const res = await fetch(`/api/admin/navidad/pueblos/by-pueblo/${puebloId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (res.status === 404) {
        setNotInscribed(true);
        try {
          const cfgRes = await fetch(`/api/admin/navidad/config`, { credentials: 'include', cache: 'no-store' });
          if (cfgRes.ok) {
            const cfg = await cfgRes.json();
            setCampaignActive(cfg?.activo ?? true);
          } else {
            const pubRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/navidad/config`);
            if (pubRes.ok) { const cfg = await pubRes.json(); setCampaignActive(cfg?.activo ?? true); }
          }
        } catch { /* ignore */ }
        return;
      }
      if (!res.ok) throw new Error('Error cargando datos');
      const json = await res.json();
      setData(json.participante);
      setCampaignActive(json.config?.activo ?? false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => { if (puebloId) loadData(); }, [puebloId, loadData]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const toIsoUtc = (fecha: string, hora: string): string => {
    if (!fecha || !hora) return '';
    const try1 = new Date(`${fecha}T${hora}:00+01:00`);
    const try2 = new Date(`${fecha}T${hora}:00+02:00`);
    const check = (d: Date) =>
      d.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 5);
    if (check(try2) === hora) return try2.toISOString();
    if (check(try1) === hora) return try1.toISOString();
    return try2.toISOString();
  };

  const inscribirse = async () => {
    if (!puebloId) return;
    setInscribing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/navidad/pueblos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'No se pudo completar la inscripción'));
      setNotInscribed(false);
      await loadData();
      flash('Pueblo inscrito en Navidad');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setInscribing(false);
    }
  };

  const saveInfo = async () => {
    if (!puebloId || !data) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/navidad/pueblos/by-pueblo/${puebloId}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: data.titulo || null,
        descripcion: data.descripcion || null,
        cartelUrl: data.cartelUrl || null,
        streamUrl: data.streamUrl || null,
        videoUrl: data.videoUrl || null,
        interesTuristico: data.interesTuristico,
        activo: data.activo,
      }),
    });
    setSaving(false);
    if (!res.ok) { setError('No se pudo guardar la información'); return; }
    await loadData();
    flash('Información guardada');
  };

  const createEvento = async () => {
    if (!puebloId || !newEvento.titulo || !newEvento.fecha || !newEvento.horaInicio) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      tipo: newEvento.tipo,
      publicoObjetivo: newEvento.publicoObjetivo,
      titulo: newEvento.titulo,
      descripcion: newEvento.descripcion || undefined,
      avisosImportantes: newEvento.avisosImportantes || undefined,
      ubicacion: newEvento.ubicacion || undefined,
      fecha: newEvento.fecha,
      horaInicio: newEvento.horaInicio,
      horaFin: newEvento.horaFin || undefined,
      fechaInicio: toIsoUtc(newEvento.fecha, newEvento.horaInicio),
      fechaFin: newEvento.fechaFinStr ? toIsoUtc(newEvento.fechaFinStr, newEvento.horaFin || '23:59') : newEvento.horaFin ? toIsoUtc(newEvento.fecha, newEvento.horaFin) : undefined,
      fotoUrl: newEvento.fotoUrl || undefined,
      youtubeUrl: newEvento.youtubeUrl || undefined,
      streamUrl: newEvento.streamUrl || undefined,
      googleMapsUrl: newEvento.googleMapsUrl || undefined,
      esFiestaInteresTuristico: newEvento.esFiestaInteresTuristico,
    };
    if (newEvento.tipo === 'MERCADILLO' || newEvento.tipo === 'BELEN' || newEvento.tipo === 'BELEN_VIVIENTE') {
      body.horarioApertura = newEvento.horarioApertura || undefined;
      body.horarioCierre = newEvento.horarioCierre || undefined;
    }

    const res = await fetch(`/api/admin/navidad/pueblos/by-pueblo/${puebloId}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setError('No se pudo crear el evento'); return; }
    setShowNewEvento(false);
    setNewEvento({ ...EMPTY_EVENTO });
    await loadData();
    flash('Evento navideño añadido');
  };

  const deleteEvento = async (id: number) => {
    if (!confirm('¿Eliminar este evento navideño?')) return;
    const res = await fetch(`/api/admin/navidad/eventos/${id}`, { method: 'DELETE' });
    if (!res.ok) { setError('No se pudo eliminar'); return; }
    await loadData();
    flash('Evento eliminado');
  };

  const toMadridTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 5);
  const toMadridDate = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

  const startEditEvento = (e: Evento) => {
    setShowNewEvento(false);
    setEditingEventoId(e.id);
    setEditEvento({
      tipo: e.tipo,
      publicoObjetivo: e.publicoObjetivo,
      titulo: e.titulo || '',
      descripcion: e.descripcion || '',
      avisosImportantes: e.avisosImportantes || '',
      ubicacion: e.ubicacion || '',
      fecha: toMadridDate(e.fechaInicio),
      horaInicio: toMadridTime(e.fechaInicio),
      horaFin: e.fechaFin ? toMadridTime(e.fechaFin) : '',
      fechaFinStr: e.fechaFin ? toMadridDate(e.fechaFin) : '',
      horarioApertura: e.horarioApertura || '',
      horarioCierre: e.horarioCierre || '',
      fotoUrl: e.fotoUrl || '',
      youtubeUrl: e.youtubeUrl || '',
      streamUrl: e.streamUrl || '',
      googleMapsUrl: e.googleMapsUrl || '',
      esFiestaInteresTuristico: e.esFiestaInteresTuristico ?? false,
    });
    setTimeout(() => editEventoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const saveEditEvento = async () => {
    if (!editingEventoId || !editEvento.titulo || !editEvento.fecha || !editEvento.horaInicio) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      tipo: editEvento.tipo,
      publicoObjetivo: editEvento.publicoObjetivo,
      titulo: editEvento.titulo,
      descripcion: editEvento.descripcion || undefined,
      avisosImportantes: editEvento.avisosImportantes || undefined,
      ubicacion: editEvento.ubicacion || undefined,
      fecha: editEvento.fecha,
      horaInicio: editEvento.horaInicio,
      horaFin: editEvento.horaFin || undefined,
      fechaInicio: toIsoUtc(editEvento.fecha, editEvento.horaInicio),
      fechaFin: editEvento.fechaFinStr ? toIsoUtc(editEvento.fechaFinStr, editEvento.horaFin || '23:59') : editEvento.horaFin ? toIsoUtc(editEvento.fecha, editEvento.horaFin) : undefined,
      fotoUrl: editEvento.fotoUrl || undefined,
      youtubeUrl: editEvento.youtubeUrl || undefined,
      streamUrl: editEvento.streamUrl || undefined,
      googleMapsUrl: editEvento.googleMapsUrl || undefined,
      esFiestaInteresTuristico: editEvento.esFiestaInteresTuristico,
    };
    if (editEvento.tipo === 'MERCADILLO' || editEvento.tipo === 'BELEN' || editEvento.tipo === 'BELEN_VIVIENTE') {
      body.horarioApertura = editEvento.horarioApertura || undefined;
      body.horarioCierre = editEvento.horarioCierre || undefined;
    }

    const res = await fetch(`/api/admin/navidad/eventos/${editingEventoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setError('No se pudo actualizar el evento'); return; }
    setEditingEventoId(null);
    await loadData();
    flash('Evento actualizado');
  };

  const eventosByTipo = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, Evento[]>();
    for (const e of data.eventos) {
      if (!grouped.has(e.tipo)) grouped.set(e.tipo, []);
      grouped.get(e.tipo)!.push(e);
    }
    return Array.from(grouped.entries())
      .map(([tipo, items]) => ({ tipo, items: items.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()) }))
      .sort((a, b) => {
        const order = Object.keys(TIPO_LABELS);
        return order.indexOf(a.tipo) - order.indexOf(b.tipo);
      });
  }, [data]);

  const isMercadilloType = (tipo: string) => ['MERCADILLO', 'BELEN', 'BELEN_VIVIENTE'].includes(tipo);
  const isCabalgataType = (tipo: string) => ['CABALGATA_REYES', 'CABALGATA_PAPA_NOEL', 'RUTA_TURISTICA'].includes(tipo);

  function EventoForm({ state, setState, onSave, onCancel, saveLabel }: {
    state: typeof EMPTY_EVENTO;
    setState: (s: typeof EMPTY_EVENTO) => void;
    onSave: () => void;
    onCancel: () => void;
    saveLabel: string;
  }) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de evento</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={state.tipo} onChange={(e) => setState({ ...state, tipo: e.target.value })}>
              {Object.entries(TIPO_LABELS).map(([k, v]) => (<option key={k} value={k}>{TIPO_ICONS[k]} {v}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Público objetivo</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={state.publicoObjetivo} onChange={(e) => setState({ ...state, publicoObjetivo: e.target.value })}>
              {Object.entries(PUBLICO_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
        </div>
        <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Título del evento" value={state.titulo} onChange={(e) => setState({ ...state, titulo: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Fecha inicio</label>
            <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={state.fecha} onChange={(e) => setState({ ...state, fecha: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Hora inicio</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="18:00" value={state.horaInicio} onChange={(e) => setState({ ...state, horaInicio: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Hora fin</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="22:00" value={state.horaFin} onChange={(e) => setState({ ...state, horaFin: e.target.value })} />
          </div>
        </div>
        {isMercadilloType(state.tipo) && (
          <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-3">
            <p className="mb-2 text-sm font-medium text-emerald-900">Horarios recurrentes (mercadillos / belenes)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Fecha fin (último día)</label>
                <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={state.fechaFinStr} onChange={(e) => setState({ ...state, fechaFinStr: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Hora apertura diaria</label>
                <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="10:00" value={state.horarioApertura} onChange={(e) => setState({ ...state, horarioApertura: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Hora cierre diario</label>
                <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="21:00" value={state.horarioCierre} onChange={(e) => setState({ ...state, horarioCierre: e.target.value })} />
              </div>
            </div>
          </div>
        )}
        <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Ubicación / calle / plaza" value={state.ubicacion} onChange={(e) => setState({ ...state, ubicacion: e.target.value })} />
        <textarea rows={2} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Descripción del evento" value={state.descripcion} onChange={(e) => setState({ ...state, descripcion: e.target.value })} />
        <textarea rows={2} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Avisos importantes (aparcamiento, recomendaciones...)" value={state.avisosImportantes} onChange={(e) => setState({ ...state, avisosImportantes: e.target.value })} />
        <R2ImageUploader label="Foto del evento (opcional)" value={state.fotoUrl || null} onChange={(url) => setState({ ...state, fotoUrl: url ?? '' })} folder="navidad/eventos" previewHeight="h-32" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="url" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Enlace YouTube (opcional)" value={state.youtubeUrl} onChange={(e) => setState({ ...state, youtubeUrl: e.target.value })} />
          <input type="url" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="URL streaming en directo (opcional)" value={state.streamUrl} onChange={(e) => setState({ ...state, streamUrl: e.target.value })} />
        </div>
        {isCabalgataType(state.tipo) && (
          <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3">
            <p className="mb-2 text-sm font-medium text-blue-900">Recorrido (Google Maps)</p>
            <input type="url" placeholder="https://www.google.com/maps/d/..." className="w-full rounded-md border px-3 py-2 text-sm" value={state.googleMapsUrl} onChange={(e) => setState({ ...state, googleMapsUrl: e.target.value })} />
            <p className="mt-1 text-xs text-muted-foreground">Pegad el enlace de Google Maps con el recorrido de la cabalgata/ruta.</p>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(state.esFiestaInteresTuristico)} onChange={(e) => setState({ ...state, esFiestaInteresTuristico: e.target.checked })} />
          Fiesta de Interés Turístico (este evento)
        </label>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving || !state.titulo || !state.fecha || !state.horaInicio} className={CAMPANA_NAVIDAD.primaryButtonSm}>
            {saving ? 'Guardando...' : saveLabel}
          </button>
          <button onClick={onCancel} className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground">Cancelar</button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <GestionPuebloSubpageShell
        slug={slug}
        title="Navidad"
        subtitle="Cargando datos del pueblo…"
        heroIcon={<HeroIconTree />}
        maxWidthClass="max-w-5xl"
        theme="navidad"
      >
        <p className="text-muted-foreground">Cargando…</p>
      </GestionPuebloSubpageShell>
    );
  }

  if (notInscribed) {
    return (
      <GestionPuebloSubpageShell
        slug={slug}
        title="Navidad"
        subtitle={
          <>
            Mercadillos, belenes y eventos · <span className="font-semibold text-white/95">{slug}</span>
          </>
        }
        heroIcon={<HeroIconTree />}
        maxWidthClass="max-w-5xl"
        theme="navidad"
      >
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <CampanaLandingEditor campana="navidad" puebloId={puebloId} puebloSlug={slug} />
        {!campaignActive ? (
          <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-amber-50/70 to-red-50/80 px-6 py-8 text-center shadow-sm">
            <p className="text-2xl">🎄</p>
            <h2 className="mt-3 text-lg font-semibold text-emerald-900">
              La campaña de Navidad ha finalizado
            </h2>
            <p className="mt-2 text-sm text-emerald-800/90">
              Las páginas del evento anterior siguen visibles en internet, pero la
              inscripción y edición no estarán disponibles hasta la próxima edición.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-amber-50/70 to-red-50/80 p-6 text-center shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-amber-950/25 dark:to-red-950/30">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">Este pueblo no está inscrito en Navidad este año.</p>
              <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/85">Inscribe el pueblo para publicar mercadillos, belenes y cabalgatas.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={inscribirse}
                disabled={inscribing || !puebloId}
                className={CAMPANA_NAVIDAD.primaryButton}
              >
                {inscribing ? 'Inscribiendo...' : 'Inscribirse en Navidad'}
              </button>
            </div>
          </>
        )}
      </GestionPuebloSubpageShell>
    );
  }

  if (!data) return null;

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="Navidad"
      subtitle={
        <>
          Eventos navideños de tu pueblo ·{' '}
          <span className="font-semibold text-white/95">{data.pueblo.nombre}</span>
        </>
      }
      heroIcon={<HeroIconTree />}
      maxWidthClass="max-w-5xl"
      theme="navidad"
    >
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <CampanaLandingEditor campana="navidad" puebloId={puebloId} puebloSlug={slug} />

      {!campaignActive && (
        <div className="mb-6 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-amber-50/70 to-red-50/80 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎄</span>
            <div>
              <h3 className="font-semibold text-emerald-900">La campaña de Navidad ha finalizado</h3>
              <p className="mt-1 text-sm text-emerald-800/90">
                Las páginas del evento siguen visibles en internet pero la edición
                no está disponible hasta la próxima edición. Puedes consultar los datos del año pasado a continuación.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={!campaignActive ? 'pointer-events-none select-none opacity-60' : ''}>
      <section className={`mb-8 rounded-xl border p-5 shadow-sm ${CAMPANA_NAVIDAD.sectionAccent}`}>
        <h2 className="mb-4 text-lg font-semibold">Información general</h2>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm">Título</label>
            <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Navidad en tu pueblo" value={data.titulo ?? ''} onChange={(e) => setData({ ...data, titulo: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Descripción</label>
            <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={data.descripcion ?? ''} onChange={(e) => setData({ ...data, descripcion: e.target.value })} />
          </div>
          <R2ImageUploader label="Cartel navideño" value={data.cartelUrl} onChange={(url) => setData({ ...data, cartelUrl: url })} folder="navidad/pueblos" previewHeight="h-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Emisión en directo (URL de canal o vídeo en vivo)</label>
              <input type="url" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="https://www.youtube.com/@canal o URL de vídeo en directo" value={data.streamUrl ?? ''} onChange={(e) => setData({ ...data, streamUrl: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">Se mostrará con indicador de &quot;En directo&quot; (punto rojo).</p>
            </div>
            <div>
              <label className="mb-1 block text-sm">Vídeo de Navidad</label>
              <input type="url" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="URL de YouTube o vídeo directo (.mp4)" value={data.videoUrl ?? ''} onChange={(e) => setData({ ...data, videoUrl: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">YouTube, .mp4 u otra URL de vídeo. No se marcará como directo.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Distintivo turístico</label>
              <select className="w-full rounded-md border px-3 py-2 text-sm" value={data.interesTuristico} onChange={(e) => setData({ ...data, interesTuristico: e.target.value as Participante['interesTuristico'] })}>
                <option value="NINGUNO">Sin distintivo</option>
                <option value="REGIONAL">Interés Turístico Regional</option>
                <option value="NACIONAL">Interés Turístico Nacional</option>
                <option value="INTERNACIONAL">Interés Turístico Internacional</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData({ ...data, activo: e.target.checked })} />
            Pueblo activo en la lista pública de Navidad
          </label>
          <button onClick={saveInfo} disabled={saving} className={`w-fit ${CAMPANA_NAVIDAD.primaryButton}`}>
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-red-100 bg-gradient-to-br from-green-50/20 to-red-50/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eventos navideños</h2>
          <button onClick={() => { setShowNewEvento(true); setEditingEventoId(null); setTimeout(() => newEventoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} className={CAMPANA_NAVIDAD.primaryButtonSm}>
            + Añadir evento
          </button>
        </div>

        {showNewEvento && (
          <div ref={newEventoFormRef} className="mb-4 rounded-lg border border-red-200 bg-red-50/30 p-4">
            <p className="mb-3 text-sm font-medium">Nuevo evento navideño</p>
            <EventoForm state={newEvento} setState={setNewEvento} onSave={createEvento} onCancel={() => setShowNewEvento(false)} saveLabel="Crear evento" />
          </div>
        )}

        {data.eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos todavía. ¡Añade mercadillos, belenes, cabalgatas y todo lo que tu pueblo ofrezca esta Navidad!</p>
        ) : (
          <div className="space-y-5">
            {eventosByTipo.map(({ tipo, items }) => (
              <div key={tipo} className="rounded-lg border p-3">
                <p className="mb-3 text-sm font-semibold">
                  {TIPO_ICONS[tipo]} {TIPO_LABELS[tipo] || tipo} <span className="font-normal text-muted-foreground">({items.length})</span>
                </p>
                <div className="space-y-2">
                  {items.map((e) => (
                    <div key={e.id} className="rounded-md border bg-card p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-medium">{e.titulo}</p>
                        <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{PUBLICO_LABELS[e.publicoObjetivo]}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(e.fechaInicio).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {' · '}
                        {toMadridTime(e.fechaInicio)}
                        {e.fechaFin ? ` – ${toMadridTime(e.fechaFin)}` : ''}
                      </p>
                      {e.horarioApertura && <p className="text-xs text-emerald-700">Horario diario: {e.horarioApertura} – {e.horarioCierre}</p>}
                      {e.ubicacion && <p className="text-sm text-muted-foreground">{e.ubicacion}</p>}
                      {e.esFiestaInteresTuristico && (
                        <span className="inline-flex rounded-full border border-red-700/30 bg-red-700/10 px-2 py-0.5 text-[11px] font-medium text-red-800">Fiesta de Interés Turístico</span>
                      )}
                      {e.streamUrl && <p className="text-xs text-blue-600">En directo configurado</p>}
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => startEditEvento(e)} className="rounded-md border px-3 py-1 text-xs hover:bg-muted">Editar</button>
                        <button onClick={() => deleteEvento(e.id)} className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {editingEventoId && (
          <div ref={editEventoFormRef} className="mt-4 rounded-lg border border-red-200 bg-red-50/30 p-4">
            <p className="mb-3 text-sm font-medium">Editar evento</p>
            <EventoForm state={editEvento} setState={setEditEvento} onSave={saveEditEvento} onCancel={() => setEditingEventoId(null)} saveLabel="Guardar cambios" />
          </div>
        )}
      </section>
      </div>
    </GestionPuebloSubpageShell>
  );
}
