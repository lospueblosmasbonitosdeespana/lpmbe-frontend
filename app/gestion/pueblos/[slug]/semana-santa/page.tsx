'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import R2ImageUploader from '@/app/components/R2ImageUploader';
import dynamic from 'next/dynamic';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const RouteEditorMap = dynamic(() => import('./RouteEditorMap'), { ssr: false });

type DiaConfig = { fecha: string; nombreDia: string; orden: number };
type PuebloDia = {
  id?: number;
  fecha: string;
  nombreDia: string;
  titulo?: string | null;
  descripcion?: string | null;
  fotoUrl?: string | null;
  orden: number;
};
type AgendaItem = {
  id: number;
  titulo: string;
  descripcion: string | null;
  avisosImportantes?: string | null;
  ubicacion: string | null;
  inicioLat?: number | null;
  inicioLng?: number | null;
  finLat?: number | null;
  finLng?: number | null;
  paradas?: Array<{ lat: number; lng: number; label?: string }> | null;
  googleMapsUrl?: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  youtubeUrl?: string | null;
  esFiestaInteresTuristico?: boolean;
  orden: number;
};
type Participante = {
  id: number;
  puebloId: number;
  titulo: string | null;
  descripcion: string | null;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  activo: boolean;
  pueblo: { id: number; nombre: string; slug: string };
  agenda: AgendaItem[];
  dias: PuebloDia[];
};

function SortableAgendaCard({
  a,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  a: AgendaItem;
  onEdit: (a: AgendaItem) => void;
  onDelete: (id: number) => void;
  onDuplicate: (a: AgendaItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: a.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium">{a.titulo}</p>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded border px-2 py-1 text-[11px] text-muted-foreground active:cursor-grabbing"
          title="Arrastra para ordenar"
        >
          Arrastrar
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {new Date(a.fechaInicio).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' })}
        {' · '}
        {new Date(a.fechaInicio).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}
        {a.fechaFin ? ` – ${new Date(a.fechaFin).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })}` : ''}
      </p>
      {a.ubicacion && <p className="text-sm text-muted-foreground">{a.ubicacion}</p>}
      {a.avisosImportantes && (
        <p className="text-xs text-amber-700">
          Avisos importantes: {a.avisosImportantes}
        </p>
      )}
      {a.youtubeUrl && (
        <a href={a.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
          Enlace YouTube
        </a>
      )}
      {a.esFiestaInteresTuristico && (
        <span className="inline-flex rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2 py-0.5 text-[11px] font-medium text-[#8f4a26]">
          Fiesta de Interés Turístico
        </span>
      )}
      {a.googleMapsUrl && (
        <p className="text-xs text-blue-700 font-medium">📍 Recorrido en Google Maps configurado</p>
      )}
      {!a.googleMapsUrl && (a.inicioLat != null && a.inicioLng != null) && (
        <p className="text-xs text-muted-foreground">
          Recorrido: inicio definido{a.finLat != null && a.finLng != null ? ', fin definido' : ''} · {a.paradas?.length ?? 0} paradas
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onEdit(a)} className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
          Editar
        </button>
        <button onClick={() => onDuplicate(a)} className="rounded-md border px-3 py-1 text-xs hover:bg-muted">
          Duplicar
        </button>
        <button
          onClick={() => onDelete(a.id)}
          className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function GestionPuebloSemanaSantaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [configDias, setConfigDias] = useState<DiaConfig[]>([]);
  const [data, setData] = useState<Participante | null>(null);
  const [notInscribed, setNotInscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inscribing, setInscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewAgenda, setShowNewAgenda] = useState(false);
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [newAgenda, setNewAgenda] = useState({
    titulo: '',
    descripcion: '',
    avisosImportantes: '',
    ubicacion: '',
    inicioLat: undefined as number | undefined,
    inicioLng: undefined as number | undefined,
    finLat: undefined as number | undefined,
    finLng: undefined as number | undefined,
    paradas: [] as Array<{ lat: number; lng: number; label?: string }>,
    googleMapsUrl: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    fotoUrl: '',
    youtubeUrl: '',
    esFiestaInteresTuristico: false,
  });
  const [mapMode, setMapMode] = useState<'inicio' | 'fin' | 'parada'>('parada');
  const [editMapMode, setEditMapMode] = useState<'inicio' | 'fin' | 'parada'>('parada');
  const newAgendaFormRef = useRef<HTMLDivElement>(null);
  const editAgendaFormRef = useRef<HTMLDivElement>(null);
  const [editAgenda, setEditAgenda] = useState({
    titulo: '',
    descripcion: '',
    avisosImportantes: '',
    ubicacion: '',
    inicioLat: undefined as number | undefined,
    inicioLng: undefined as number | undefined,
    finLat: undefined as number | undefined,
    finLng: undefined as number | undefined,
    paradas: [] as Array<{ lat: number; lng: number; label?: string }>,
    googleMapsUrl: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    fotoUrl: '',
    youtubeUrl: '',
    esFiestaInteresTuristico: false,
  });

  const openNewAgenda = (fecha?: string) => {
    setShowNewAgenda(true);
    setEditingAgendaId(null);
    setNewAgenda((prev) => ({
      ...prev,
      fecha: fecha ?? prev.fecha,
      horaInicio: prev.horaInicio || '12:00',
    }));
    setTimeout(() => newAgendaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

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
      const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}`);
      if (res.status === 404) {
        setNotInscribed(true);
        return;
      }
      if (!res.ok) throw new Error('Error cargando datos');
      const json = await res.json();
      setData(json.participante);
      setConfigDias(json.config?.dias ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => {
    if (puebloId) loadData();
  }, [puebloId, loadData]);

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
      const res = await fetch('/api/admin/semana-santa/pueblos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'No se pudo completar la inscripción');
      }
      setNotInscribed(false);
      await loadData();
      flash('Pueblo inscrito correctamente en Semana Santa');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la inscripción');
    } finally {
      setInscribing(false);
    }
  };

  const saveInfo = async () => {
    if (!puebloId || !data) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: data.titulo || null,
        descripcion: data.descripcion || null,
        cartelVerticalUrl: data.cartelVerticalUrl || null,
        cartelHorizontalUrl: data.cartelHorizontalUrl || null,
        streamUrl: data.streamUrl || null,
        videoUrl: data.videoUrl || null,
        interesTuristico: data.interesTuristico,
        activo: data.activo,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo guardar la información');
      return;
    }
    await loadData();
    flash('Información guardada');
  };

  const saveDias = async () => {
    if (!puebloId || !data) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/dias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dias: data.dias.map((d, idx) => ({
          fecha: d.fecha,
          nombreDia: d.nombreDia,
          titulo: d.titulo || undefined,
          descripcion: d.descripcion || undefined,
          fotoUrl: d.fotoUrl || undefined,
          orden: idx,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudieron guardar los días');
      return;
    }
    await loadData();
    flash('Días de procesiones guardados');
  };

  const createAgenda = async () => {
    if (!puebloId || !newAgenda.titulo || !newAgenda.fecha || !newAgenda.horaInicio) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: newAgenda.titulo,
        descripcion: newAgenda.descripcion || undefined,
        avisosImportantes: newAgenda.avisosImportantes || undefined,
        ubicacion: newAgenda.ubicacion || undefined,
        inicioLat: newAgenda.inicioLat,
        inicioLng: newAgenda.inicioLng,
        finLat: newAgenda.finLat,
        finLng: newAgenda.finLng,
        paradas: newAgenda.paradas,
        googleMapsUrl: newAgenda.googleMapsUrl || undefined,
        fecha: newAgenda.fecha,
        horaInicio: newAgenda.horaInicio,
        horaFin: newAgenda.horaFin || undefined,
        fechaInicio: toIsoUtc(newAgenda.fecha, newAgenda.horaInicio),
        fechaFin: newAgenda.horaFin ? toIsoUtc(newAgenda.fecha, newAgenda.horaFin) : undefined,
        fotoUrl: newAgenda.fotoUrl || undefined,
        youtubeUrl: newAgenda.youtubeUrl || undefined,
        esFiestaInteresTuristico: newAgenda.esFiestaInteresTuristico,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo crear el evento de agenda');
      return;
    }
    const created = (await res.json()) as AgendaItem;
    setShowNewAgenda(false);
    setNewAgenda({
      titulo: '',
      descripcion: '',
      avisosImportantes: '',
      ubicacion: '',
      inicioLat: undefined,
      inicioLng: undefined,
      finLat: undefined,
      finLng: undefined,
      paradas: [],
      googleMapsUrl: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      fotoUrl: '',
      youtubeUrl: '',
      esFiestaInteresTuristico: false,
    });
    await loadData();
    startEditAgenda(created);
    setTimeout(() => editAgendaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    flash('Evento de agenda añadido');
  };

  const deleteAgenda = async (id: number) => {
    if (!confirm('¿Eliminar este evento de agenda?')) return;
    const res = await fetch(`/api/admin/semana-santa/agenda/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar');
      return;
    }
    await loadData();
    flash('Evento eliminado');
  };

  const toMadridTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 5);

  const toMadridDate = (isoString: string) => {
    const d = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return parts;
  };

  const startEditAgenda = (a: AgendaItem) => {
    setShowNewAgenda(false);
    setEditingAgendaId(a.id);

    setEditAgenda({
      titulo: a.titulo || '',
      descripcion: a.descripcion || '',
      avisosImportantes: a.avisosImportantes || '',
      ubicacion: a.ubicacion || '',
      inicioLat: a.inicioLat ?? undefined,
      inicioLng: a.inicioLng ?? undefined,
      finLat: a.finLat ?? undefined,
      finLng: a.finLng ?? undefined,
      paradas: a.paradas ?? [],
      googleMapsUrl: a.googleMapsUrl || '',
      fecha: toMadridDate(a.fechaInicio),
      horaInicio: toMadridTime(a.fechaInicio),
      horaFin: a.fechaFin ? toMadridTime(a.fechaFin) : '',
      fotoUrl: a.fotoUrl || '',
      youtubeUrl: a.youtubeUrl || '',
      esFiestaInteresTuristico: a.esFiestaInteresTuristico ?? false,
    });
    setTimeout(() => editAgendaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const saveEditAgenda = async () => {
    if (!editingAgendaId || !editAgenda.titulo || !editAgenda.fecha || !editAgenda.horaInicio) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/agenda/${editingAgendaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: editAgenda.titulo,
        descripcion: editAgenda.descripcion || undefined,
        avisosImportantes: editAgenda.avisosImportantes || undefined,
        ubicacion: editAgenda.ubicacion || undefined,
        inicioLat: editAgenda.inicioLat,
        inicioLng: editAgenda.inicioLng,
        finLat: editAgenda.finLat,
        finLng: editAgenda.finLng,
        paradas: editAgenda.paradas,
        googleMapsUrl: editAgenda.googleMapsUrl || undefined,
        fecha: editAgenda.fecha,
        horaInicio: editAgenda.horaInicio,
        horaFin: editAgenda.horaFin || undefined,
        fechaInicio: toIsoUtc(editAgenda.fecha, editAgenda.horaInicio),
        fechaFin: editAgenda.horaFin ? toIsoUtc(editAgenda.fecha, editAgenda.horaFin) : undefined,
        fotoUrl: editAgenda.fotoUrl || undefined,
        youtubeUrl: editAgenda.youtubeUrl || undefined,
        esFiestaInteresTuristico: editAgenda.esFiestaInteresTuristico,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo actualizar el evento');
      return;
    }
    setEditingAgendaId(null);
    await loadData();
    flash('Evento actualizado');
  };

  const duplicateAgenda = async (a: AgendaItem) => {
    if (!puebloId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: `${a.titulo} (copia)`,
        descripcion: a.descripcion || undefined,
        avisosImportantes: a.avisosImportantes || undefined,
        ubicacion: a.ubicacion || undefined,
        inicioLat: a.inicioLat ?? undefined,
        inicioLng: a.inicioLng ?? undefined,
        finLat: a.finLat ?? undefined,
        finLng: a.finLng ?? undefined,
        paradas: a.paradas ?? [],
        googleMapsUrl: a.googleMapsUrl || undefined,
        fechaInicio: a.fechaInicio,
        fechaFin: a.fechaFin || undefined,
        fotoUrl: a.fotoUrl || undefined,
        youtubeUrl: a.youtubeUrl || undefined,
        esFiestaInteresTuristico: a.esFiestaInteresTuristico ?? false,
        orden: (a.orden ?? 0) + 1,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo duplicar el evento');
      return;
    }
    await loadData();
    flash('Evento duplicado');
  };

  const orderedDias = useMemo(() => {
    if (!data) return [];
    if (data.dias.length > 0) return data.dias;
    return configDias.map((d, i) => ({
      fecha: d.fecha,
      nombreDia: d.nombreDia,
      titulo: '',
      descripcion: '',
      fotoUrl: '',
      orden: i,
    }));
  }, [configDias, data]);

  const agendaByDay = useMemo(() => {
    if (!data) return [] as Array<{ fecha: string; items: AgendaItem[] }>;
    const grouped = new Map<string, AgendaItem[]>();
    for (const a of data.agenda) {
      const key = a.fechaInicio.slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    }
    return Array.from(grouped.entries())
      .map(([fecha, items]) => ({
        fecha,
        items: [...items].sort((x, y) => x.orden - y.orden || x.fechaInicio.localeCompare(y.fechaInicio)),
      }))
      .sort((x, y) => x.fecha.localeCompare(y.fecha));
  }, [data]);

  const nombreDiaByFecha = useMemo(() => {
    const out = new Map<string, string>();
    for (const d of orderedDias) out.set(d.fecha, d.nombreDia);
    return out;
  }, [orderedDias]);

  const reorderAgendaDay = async (fecha: string, reordered: AgendaItem[]) => {
    setSaving(true);
    try {
      await Promise.all(
        reordered.map((item, idx) =>
          fetch(`/api/admin/semana-santa/agenda/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orden: idx }),
          }),
        ),
      );
      await loadData();
      flash(`Orden actualizado para ${nombreDiaByFecha.get(fecha) || fecha}`);
    } catch {
      setError('No se pudo reordenar la agenda');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return <main className="mx-auto max-w-5xl p-6 text-muted-foreground">Cargando...</main>;
  }

  if (notInscribed) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Semana Santa</h1>
        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800">
          Este pueblo no está inscrito en Semana Santa este año.
        </div>
        <div className="mt-4">
          <button
            onClick={inscribirse}
            disabled={inscribing || !puebloId}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {inscribing ? 'Inscribiendo...' : 'Inscribirse'}
          </button>
        </div>
        <div className="mt-6 text-sm">
          <Link href={`/gestion/pueblos/${slug}`} className="text-muted-foreground hover:underline">
            ← Volver al pueblo
          </Link>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">✝️</span>
        <div>
          <h1 className="text-2xl font-semibold">Semana Santa · {data.pueblo.nombre}</h1>
          <p className="text-sm text-muted-foreground">Edita cartel, agenda y días de procesiones.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <section className="mb-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Información general</h2>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm">Título</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={data.titulo ?? ''}
              onChange={(e) => setData({ ...data, titulo: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Descripción</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={data.descripcion ?? ''}
              onChange={(e) => setData({ ...data, descripcion: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <R2ImageUploader
              label="Cartel vertical"
              value={data.cartelVerticalUrl}
              onChange={(url) => setData({ ...data, cartelVerticalUrl: url })}
              folder="semana-santa/pueblos"
              previewHeight="h-56"
            />
            <R2ImageUploader
              label="Cartel horizontal"
              value={data.cartelHorizontalUrl}
              onChange={(url) => setData({ ...data, cartelHorizontalUrl: url })}
              folder="semana-santa/pueblos"
              previewHeight="h-40"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Emisión en directo (URL de canal o vídeo en vivo)</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="https://www.youtube.com/@canal o URL de vídeo en directo"
                value={data.streamUrl ?? ''}
                onChange={(e) => setData({ ...data, streamUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Se mostrará con indicador de &quot;En directo&quot; (punto rojo).</p>
            </div>
            <div>
              <label className="mb-1 block text-sm">Vídeo de Semana Santa (YouTube)</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                value={data.videoUrl ?? ''}
                onChange={(e) => setData({ ...data, videoUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Vídeo genérico embebido. No se marcará como directo.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Distintivo turístico</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={data.interesTuristico}
                onChange={(e) =>
                  setData({
                    ...data,
                    interesTuristico: e.target.value as Participante['interesTuristico'],
                  })
                }
              >
                <option value="NINGUNO">Sin distintivo</option>
                <option value="REGIONAL">Interés Turístico Regional</option>
                <option value="NACIONAL">Interés Turístico Nacional</option>
                <option value="INTERNACIONAL">Interés Turístico Internacional</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.activo}
              onChange={(e) => setData({ ...data, activo: e.target.checked })}
            />
            Pueblo activo en la lista pública de Semana Santa
          </label>
          <button
            onClick={saveInfo}
            disabled={saving}
            className="w-fit rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Días (configuración rápida)</h2>
          <button
            onClick={() =>
              setData({
                ...data,
                dias: [
                  ...data.dias,
                  { fecha: '', nombreDia: '', titulo: '', descripcion: '', fotoUrl: '', orden: data.dias.length },
                ],
              })
            }
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            + Añadir día
          </button>
        </div>
        <div className="space-y-2">
          {orderedDias.map((d, idx) => (
            <div key={`${d.fecha}-${idx}`} className="rounded-md border p-3">
              <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={d.fecha}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], fecha: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
                <input
                  type="text"
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="Nombre del día (ej. Viernes Santo)"
                  value={d.nombreDia}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], nombreDia: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
                <button
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => openNewAgenda(d.fecha)}
                >
                  Añadir evento
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={saveDias}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Guardar días
        </button>
      </section>

      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agenda de procesiones y actos</h2>
          <button
            onClick={() => openNewAgenda(orderedDias[0]?.fecha)}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            + Añadir evento
          </button>
        </div>

        {showNewAgenda && (
          <div ref={newAgendaFormRef} className="mb-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Título (ej. Procesión de..., Vía Crucis, Los Empalaos...)"
              value={newAgenda.titulo}
              onChange={(e) => setNewAgenda({ ...newAgenda, titulo: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={newAgenda.fecha}
                onChange={(e) => setNewAgenda({ ...newAgenda, fecha: e.target.value })}
              >
                <option value="">Selecciona día</option>
                {orderedDias.map((d, idx) => (
                  <option key={`${d.fecha}-${idx}`} value={d.fecha}>
                    {(d.nombreDia || 'Día')} · {d.fecha.split('-').reverse().join('/')}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Hora inicio (ej. 20:00)"
                value={newAgenda.horaInicio}
                onChange={(e) => setNewAgenda({ ...newAgenda, horaInicio: e.target.value })}
              />
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Hora fin (ej. 22:30)"
                value={newAgenda.horaFin}
                onChange={(e) => setNewAgenda({ ...newAgenda, horaFin: e.target.value })}
              />
            </div>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ubicación / calle / plaza"
              value={newAgenda.ubicacion}
              onChange={(e) => setNewAgenda({ ...newAgenda, ubicacion: e.target.value })}
            />
            <input
              type="url"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enlace YouTube opcional (años anteriores)"
              value={newAgenda.youtubeUrl}
              onChange={(e) => setNewAgenda({ ...newAgenda, youtubeUrl: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(newAgenda.esFiestaInteresTuristico)}
                onChange={(e) => setNewAgenda({ ...newAgenda, esFiestaInteresTuristico: e.target.checked })}
              />
              Fiesta de Interés Turístico (este evento)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Descripción de lo que se va a hacer"
              value={newAgenda.descripcion}
              onChange={(e) => setNewAgenda({ ...newAgenda, descripcion: e.target.value })}
            />
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Avisos importantes (aparcamiento, cierre de calles, recomendaciones...)"
              value={newAgenda.avisosImportantes}
              onChange={(e) => setNewAgenda({ ...newAgenda, avisosImportantes: e.target.value })}
            />
            <R2ImageUploader
              label="Foto del evento (opcional)"
              value={newAgenda.fotoUrl || null}
              onChange={(url) => setNewAgenda({ ...newAgenda, fotoUrl: url ?? '' })}
              folder="semana-santa/agenda"
              previewHeight="h-32"
            />
            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">Recorrido de la procesión / evento (opcional)</p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMapMode('inicio')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${mapMode === 'inicio' ? 'bg-green-600 text-white' : ''}`}
                >
                  Marcar inicio
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('fin')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${mapMode === 'fin' ? 'bg-red-600 text-white' : ''}`}
                >
                  Marcar fin
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('parada')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${mapMode === 'parada' ? 'bg-blue-600 text-white' : ''}`}
                >
                  Añadir paradas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewAgenda({
                      ...newAgenda,
                      paradas: newAgenda.paradas.length > 0 ? newAgenda.paradas.slice(0, -1) : [],
                    })
                  }
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Deshacer última parada
                </button>
                <button
                  type="button"
                  onClick={() => setNewAgenda({ ...newAgenda, paradas: [] })}
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Limpiar paradas
                </button>
              </div>
              <RouteEditorMap value={newAgenda} mode={mapMode} onChange={(next) => setNewAgenda((prev) => ({ ...prev, ...next }))} />
              <p className="mt-2 text-xs text-muted-foreground">
                Puedes buscar una calle/pueblo y marcar el punto, o hacerlo con clic en mapa. Clic en una parada azul para eliminarla.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3">
              <p className="mb-2 text-sm font-medium text-blue-900">📍 ¿Ya tenéis el recorrido en Google Maps?</p>
              <p className="mb-2 text-xs text-blue-800">
                Si ya tenéis la procesión configurada en Google Maps, pegad aquí el enlace y se mostrará directamente el mapa de Google en la web, sin necesidad de marcar puntos arriba.
              </p>
              <input
                type="url"
                placeholder="https://www.google.com/maps/d/..."
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={newAgenda.googleMapsUrl}
                onChange={(e) => setNewAgenda({ ...newAgenda, googleMapsUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Abre tu ruta en Google Maps → &quot;Compartir&quot; → copia el enlace y pégalo aquí. Si se rellena, se verá este mapa en vez del de arriba.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createAgenda}
                disabled={saving || !newAgenda.titulo || !newAgenda.fecha || !newAgenda.horaInicio}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Crear evento
              </button>
              <button
                onClick={() => setShowNewAgenda(false)}
                className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {data.agenda.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos todavía.</p>
        ) : (
          <div className="space-y-5">
            {agendaByDay.map((day) => (
              <div key={day.fecha} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {nombreDiaByFecha.get(day.fecha) || day.fecha} · {day.fecha}
                  </p>
                  <span className="text-xs text-muted-foreground">{day.items.length} evento(s)</span>
                </div>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    if (!event.over || event.active.id === event.over.id) return;
                    const oldIndex = day.items.findIndex((x) => x.id === Number(event.active.id));
                    const newIndex = day.items.findIndex((x) => x.id === Number(event.over?.id));
                    if (oldIndex < 0 || newIndex < 0) return;
                    const reordered = arrayMove(day.items, oldIndex, newIndex);
                    void reorderAgendaDay(day.fecha, reordered);
                  }}
                >
                  <SortableContext items={day.items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {day.items.map((a) => (
                        <SortableAgendaCard
                          key={a.id}
                          a={a}
                          onEdit={startEditAgenda}
                          onDelete={deleteAgenda}
                          onDuplicate={duplicateAgenda}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
          </div>
        )}

        {editingAgendaId && (
          <div ref={editAgendaFormRef} className="mt-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">Editar evento</p>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Título del evento"
              value={editAgenda.titulo}
              onChange={(e) => setEditAgenda({ ...editAgenda, titulo: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={editAgenda.fecha}
                onChange={(e) => setEditAgenda({ ...editAgenda, fecha: e.target.value })}
              >
                <option value="">Selecciona día</option>
                {orderedDias.map((d, idx) => (
                  <option key={`${d.fecha}-${idx}`} value={d.fecha}>
                    {(d.nombreDia || 'Día')} · {d.fecha.split('-').reverse().join('/')}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Hora inicio (ej. 20:00)"
                value={editAgenda.horaInicio}
                onChange={(e) => setEditAgenda({ ...editAgenda, horaInicio: e.target.value })}
              />
              <input
                type="text"
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Hora fin (ej. 22:30)"
                value={editAgenda.horaFin}
                onChange={(e) => setEditAgenda({ ...editAgenda, horaFin: e.target.value })}
              />
            </div>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ubicación / calle / plaza"
              value={editAgenda.ubicacion}
              onChange={(e) => setEditAgenda({ ...editAgenda, ubicacion: e.target.value })}
            />
            <input
              type="url"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enlace YouTube opcional"
              value={editAgenda.youtubeUrl}
              onChange={(e) => setEditAgenda({ ...editAgenda, youtubeUrl: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(editAgenda.esFiestaInteresTuristico)}
                onChange={(e) => setEditAgenda({ ...editAgenda, esFiestaInteresTuristico: e.target.checked })}
              />
              Fiesta de Interés Turístico (este evento)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Descripción del evento"
              value={editAgenda.descripcion}
              onChange={(e) => setEditAgenda({ ...editAgenda, descripcion: e.target.value })}
            />
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Avisos importantes (aparcamiento, cierre de calles, recomendaciones...)"
              value={editAgenda.avisosImportantes}
              onChange={(e) => setEditAgenda({ ...editAgenda, avisosImportantes: e.target.value })}
            />
            <R2ImageUploader
              label="Foto del evento (opcional)"
              value={editAgenda.fotoUrl || null}
              onChange={(url) => setEditAgenda({ ...editAgenda, fotoUrl: url ?? '' })}
              folder="semana-santa/agenda"
              previewHeight="h-32"
            />
            <div className="rounded-lg border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">Editar recorrido</p>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditMapMode('inicio')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${editMapMode === 'inicio' ? 'bg-green-600 text-white' : ''}`}
                >
                  Marcar inicio
                </button>
                <button
                  type="button"
                  onClick={() => setEditMapMode('fin')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${editMapMode === 'fin' ? 'bg-red-600 text-white' : ''}`}
                >
                  Marcar fin
                </button>
                <button
                  type="button"
                  onClick={() => setEditMapMode('parada')}
                  className={`rounded-md border px-3 py-1.5 text-xs ${editMapMode === 'parada' ? 'bg-blue-600 text-white' : ''}`}
                >
                  Añadir paradas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditAgenda({
                      ...editAgenda,
                      paradas: editAgenda.paradas.length > 0 ? editAgenda.paradas.slice(0, -1) : [],
                    })
                  }
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Deshacer última parada
                </button>
                <button
                  type="button"
                  onClick={() => setEditAgenda({ ...editAgenda, paradas: [] })}
                  className="rounded-md border px-3 py-1.5 text-xs"
                >
                  Limpiar paradas
                </button>
              </div>
              <RouteEditorMap value={editAgenda} mode={editMapMode} onChange={(next) => setEditAgenda((prev) => ({ ...prev, ...next }))} />
              <p className="mt-2 text-xs text-muted-foreground">
                Clic en una parada azul para eliminarla. &quot;Limpiar paradas&quot; borra todas.
              </p>
            </div>
            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3">
              <p className="mb-2 text-sm font-medium text-blue-900">📍 ¿Ya tenéis el recorrido en Google Maps?</p>
              <p className="mb-2 text-xs text-blue-800">
                Pegad aquí el enlace de Google Maps y se mostrará directamente en la web, sin necesidad de marcar puntos arriba.
              </p>
              <input
                type="url"
                placeholder="https://www.google.com/maps/d/..."
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={editAgenda.googleMapsUrl}
                onChange={(e) => setEditAgenda({ ...editAgenda, googleMapsUrl: e.target.value })}
              />
              {editAgenda.googleMapsUrl && (
                <p className="mt-1 text-xs text-green-700 font-medium">
                  ✓ Se mostrará el mapa de Google Maps en la web pública en lugar de nuestro mapa.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEditAgenda}
                disabled={saving || !editAgenda.titulo || !editAgenda.fecha || !editAgenda.horaInicio}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Guardar cambios
              </button>
              <button
                onClick={() => setEditingAgendaId(null)}
                className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 text-sm">
        <Link href={`/gestion/pueblos/${slug}`} className="text-muted-foreground hover:text-foreground hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
