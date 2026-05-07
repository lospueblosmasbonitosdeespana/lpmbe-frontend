'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Search,
  Trash2,
  Pencil,
  Plane,
  UtensilsCrossed,
  Trees,
  Landmark,
  Users,
  MapPin,
  Hotel as HotelIcon,
} from 'lucide-react';

import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';
import { getApiUrl } from '@/lib/api';
import ImageUploader from './_ImageUploader';

const RutaMap = dynamic(() => import('@/app/_components/RutaMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-stone-100 text-sm text-stone-500">
      Cargando mapa…
    </div>
  ),
});

type PuebloLite = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  foto_destacada: string | null;
};

type RowKind = 'pueblo' | 'parada';

type Row = {
  rowId: string; // e.g. 'pueblo-12' o 'parada-5'
  kind: RowKind;
  rawId: number;
  orden: number;
  titulo: string;
  subtitulo: string;
  imagen: string | null;
  lat: number;
  lng: number;
  tipoIcono?: string;
  tagline?: string | null;
  descripcion?: string | null;
};

const TIPO_OPTS: Array<{ value: string; label: string; Icon: typeof Plane }> = [
  { value: 'airport', label: 'Aeropuerto', Icon: Plane },
  { value: 'food', label: 'Restaurante / comida', Icon: UtensilsCrossed },
  { value: 'nature', label: 'Naturaleza / ruta', Icon: Trees },
  { value: 'culture', label: 'Cultura / patrimonio', Icon: Landmark },
  { value: 'lodging', label: 'Hotel / alojamiento', Icon: HotelIcon },
  { value: 'meeting', label: 'Punto de encuentro', Icon: Users },
  { value: 'point', label: 'Otro punto', Icon: MapPin },
];

function iconForTipo(tipo?: string) {
  const found = TIPO_OPTS.find((o) => o.value === tipo);
  const Icon = found?.Icon ?? MapPin;
  return <Icon className="h-3.5 w-3.5" />;
}

export default function TabRuta({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const initial: Row[] = useMemo(() => {
    const pueblos = evento.pueblos.map((p) => ({
      rowId: `pueblo-${p.id}`,
      kind: 'pueblo' as const,
      rawId: p.id,
      orden: p.orden,
      titulo: p.pueblo.nombre,
      subtitulo: p.pueblo.provincia,
      imagen: p.fotoUrl ?? p.pueblo.foto_destacada,
      lat: p.pueblo.lat,
      lng: p.pueblo.lng,
      tagline: p.tagline_es,
    }));
    const paradas = (evento.paradas ?? []).map((p) => ({
      rowId: `parada-${p.id}`,
      kind: 'parada' as const,
      rawId: p.id,
      orden: p.orden,
      titulo: p.nombre_es,
      subtitulo: p.descripcion_es ?? '',
      imagen: p.fotoUrl,
      lat: p.lat,
      lng: p.lng,
      tipoIcono: p.tipoIcono,
      descripcion: p.descripcion_es,
    }));
    return [...pueblos, ...paradas].sort((a, b) => a.orden - b.orden);
  }, [evento]);

  const [rows, setRows] = useState<Row[]>(initial);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.rowId === active.id);
    const newIndex = rows.findIndex((r) => r.rowId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({ ...r, orden: i + 1 }));
    setRows(next);
    setSavingOrder(true);
    try {
      const pueblosItems = next.filter((r) => r.kind === 'pueblo').map((r) => ({ id: r.rawId, orden: r.orden }));
      const paradasItems = next.filter((r) => r.kind === 'parada').map((r) => ({ id: r.rawId, orden: r.orden }));
      await Promise.all([
        pueblosItems.length
          ? adminFetch(`/${evento.id}/pueblos/reorder`, { method: 'POST', json: { items: pueblosItems } })
          : Promise.resolve(null),
        paradasItems.length
          ? adminFetch(`/${evento.id}/paradas/reorder`, { method: 'POST', json: { items: paradasItems } })
          : Promise.resolve(null),
      ]);
      await reload();
    } catch (e2) {
      alert(e2 instanceof Error ? e2.message : 'Error guardando orden');
    } finally {
      setSavingOrder(false);
    }
  };

  const waypoints = rows
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .map((r) => ({ lat: r.lat, lng: r.lng, titulo: r.titulo, orden: r.orden }));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-amber-50/50 px-4 py-3 text-sm text-stone-700">
        Esta es la lista combinada de la ruta del evento: pueblos de la red y paradas extra (aeropuertos, sitios de visita, restaurantes…).
        Arrastra cualquier elemento para cambiar su posición. El número de la izquierda es el orden con el que se dibujará el mapa público.
        {savingOrder ? <span className="ml-2 font-semibold text-amber-800">Guardando orden…</span> : null}
      </div>

      {/* Mini-mapa de previsualización */}
      {waypoints.length >= 2 ? (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-4 py-2.5">
            <h4 className="text-sm font-semibold text-stone-900">Vista previa del mapa</h4>
            <p className="text-xs text-stone-500">Esto es exactamente lo que verá el público.</p>
          </div>
          <RutaMap waypoints={waypoints} height={420} showRouting allowReverse={false} showNavButtons={false} />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          Añade al menos 2 puntos (pueblos o paradas) para ver el mapa.
        </div>
      )}

      {/* Lista ordenable */}
      {rows.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((r) => r.rowId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rows.map((row) => (
                <SortableRow key={row.rowId} row={row} eventoId={evento.id} reload={reload} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      {/* Acciones para añadir */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddPueblo evento={evento} reload={reload} />
        <AddParada evento={evento} reload={reload} />
      </div>
    </div>
  );
}

function SortableRow({
  row,
  eventoId,
  reload,
}: {
  row: Row;
  eventoId: number;
  reload: () => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.rowId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const [editing, setEditing] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-stretch gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-sm sm:gap-3 sm:p-3"
    >
      <button
        type="button"
        className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-lg px-2 text-stone-400 hover:bg-stone-100 active:cursor-grabbing"
        aria-label="Arrastrar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white">
        {row.orden}
      </div>

      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:h-16 sm:w-24">
        {row.imagen ? (
          <Image src={row.imagen} alt="" fill style={{ objectFit: 'cover' }} sizes="96px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            {iconForTipo(row.tipoIcono)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-stone-900 sm:text-base">{row.titulo}</p>
          {row.kind === 'parada' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
              {iconForTipo(row.tipoIcono)} Parada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
              Pueblo
            </span>
          )}
        </div>
        <p className="truncate text-xs text-stone-500">{row.subtitulo}</p>
        {row.kind === 'pueblo' && row.tagline ? (
          <p className="mt-0.5 line-clamp-1 text-xs italic text-stone-600">"{row.tagline}"</p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>
          <RemoveButton row={row} reload={reload} />
        </div>
      </div>

      {editing ? (
        row.kind === 'pueblo' ? (
          <EditPuebloModal row={row} eventoId={eventoId} onClose={() => setEditing(false)} reload={reload} />
        ) : (
          <EditParadaModal row={row} eventoId={eventoId} onClose={() => setEditing(false)} reload={reload} />
        )
      ) : null}
    </div>
  );
}

function RemoveButton({ row, reload }: { row: Row; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(`Quitar "${row.titulo}" de la ruta?`)) return;
    setBusy(true);
    try {
      const path = row.kind === 'pueblo' ? `/pueblos/${row.rawId}` : `/paradas/${row.rawId}`;
      await adminFetch(path, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={remove}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" /> Quitar
    </button>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-500 hover:bg-stone-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditPuebloModal({
  row,
  eventoId,
  onClose,
  reload,
}: {
  row: Row;
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [tagline, setTagline] = useState(row.tagline ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(row.imagen ?? null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminFetch(`/pueblos/${row.rawId}`, {
        method: 'PATCH',
        json: { tagline_es: tagline || null, fotoUrl: fotoUrl || null },
      });
      await reload();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Editar "${row.titulo}"`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Tagline (opcional)">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={modalInput} placeholder="Ej. Sede de bienvenida" />
        </Field>
        <Field label="Foto (opcional, sustituye a la oficial del pueblo)">
          <ImageUploader eventoId={eventoId} subfolder="pueblos" value={fotoUrl} onChange={setFotoUrl} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white">
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function EditParadaModal({
  row,
  eventoId,
  onClose,
  reload,
}: {
  row: Row;
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(row.titulo);
  const [descripcion, setDescripcion] = useState(row.descripcion ?? '');
  const [lat, setLat] = useState(String(row.lat));
  const [lng, setLng] = useState(String(row.lng));
  const [tipoIcono, setTipoIcono] = useState(row.tipoIcono ?? 'point');
  const [fotoUrl, setFotoUrl] = useState<string | null>(row.imagen ?? null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminFetch(`/paradas/${row.rawId}`, {
        method: 'PATCH',
        json: {
          nombre_es: nombre,
          descripcion_es: descripcion || null,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          tipoIcono,
          fotoUrl: fotoUrl || null,
        },
      });
      await reload();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Editar "${row.titulo}"`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={modalInput} />
        </Field>
        <Field label="Descripción (opcional)">
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={modalInput} />
        </Field>
        <Field label="Tipo">
          <select value={tipoIcono} onChange={(e) => setTipoIcono(e.target.value)} className={modalInput}>
            {TIPO_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitud">
            <input value={lat} onChange={(e) => setLat(e.target.value)} className={modalInput} placeholder="36.7213" />
          </Field>
          <Field label="Longitud">
            <input value={lng} onChange={(e) => setLng(e.target.value)} className={modalInput} placeholder="-4.4214" />
          </Field>
        </div>
        <Field label="Foto (opcional)">
          <ImageUploader eventoId={eventoId} subfolder="paradas" value={fotoUrl} onChange={setFotoUrl} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white">
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function AddPueblo({ evento, reload }: { evento: EventoEditDetail; reload: () => Promise<void> }) {
  const [allPueblos, setAllPueblos] = useState<PuebloLite[]>([]);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${getApiUrl()}/pueblos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PuebloLite[]) => setAllPueblos(data.filter((p) => p.id !== 200)))
      .catch(() => setAllPueblos([]));
  }, []);

  const yaCount = new Map<number, number>();
  evento.pueblos.forEach((p) => {
    yaCount.set(p.puebloId, (yaCount.get(p.puebloId) ?? 0) + 1);
  });
  const totalRows = evento.pueblos.length + (evento.paradas?.length ?? 0);

  const disponibles = allPueblos
    .filter((p) => {
      const f = filter.trim().toLowerCase();
      if (!f) return true;
      return p.nombre.toLowerCase().includes(f) || p.provincia.toLowerCase().includes(f);
    })
    .slice(0, 8);

  const addPueblo = async (puebloId: number) => {
    setBusy(true);
    try {
      await adminFetch(`/${evento.id}/pueblos`, { method: 'POST', json: { puebloId, orden: totalRows + 1 } });
      setFilter('');
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
        <Plus className="h-4 w-4" /> Añadir pueblo de la red
      </h4>
      <p className="mt-1 text-xs text-stone-500">
        Puedes añadir el mismo pueblo más de una vez (p.ej. ida y vuelta o si pasáis dos veces).
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-stone-400" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por nombre o provincia…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {filter && disponibles.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {disponibles.map((p) => {
            const count = yaCount.get(p.id) ?? 0;
            return (
              <li key={p.id}>
                <button
                  onClick={() => addPueblo(p.id)}
                  disabled={busy}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-stone-200 p-2 text-left text-sm hover:border-amber-300 hover:bg-amber-50/60"
                >
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {p.foto_destacada ? <Image src={p.foto_destacada} alt="" fill style={{ objectFit: 'cover' }} sizes="56px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-900">{p.nombre}</p>
                    <p className="truncate text-xs text-stone-500">{p.provincia}</p>
                  </div>
                  {count > 0 ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      Ya está {count}×
                    </span>
                  ) : null}
                  <Plus className="h-4 w-4 text-amber-700" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {filter && disponibles.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Ningún pueblo coincide.</p>
      ) : null}
    </section>
  );
}

function AddParada({ evento, reload }: { evento: EventoEditDetail; reload: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const totalRows = evento.pueblos.length + (evento.paradas?.length ?? 0);

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
        <Plus className="h-4 w-4" /> Añadir parada extra
      </h4>
      <p className="mt-1 text-xs text-stone-600">
        Para puntos que no son pueblos de la red: aeropuerto, restaurante, naturaleza, alojamiento, punto de encuentro…
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
      >
        <MapPin className="h-3.5 w-3.5" /> Nueva parada
      </button>
      {open ? (
        <CreateParadaModal
          eventoId={evento.id}
          ordenSiguiente={totalRows + 1}
          onClose={() => setOpen(false)}
          reload={reload}
        />
      ) : null}
    </section>
  );
}

function CreateParadaModal({
  eventoId,
  ordenSiguiente,
  onClose,
  reload,
}: {
  eventoId: number;
  ordenSiguiente: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [tipoIcono, setTipoIcono] = useState('point');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!nombre.trim() || !lat || !lng) {
      alert('Nombre, latitud y longitud son obligatorios');
      return;
    }
    setBusy(true);
    try {
      await adminFetch(`/${eventoId}/paradas`, {
        method: 'POST',
        json: {
          nombre_es: nombre,
          descripcion_es: descripcion || null,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          tipoIcono,
          fotoUrl,
          orden: ordenSiguiente,
        },
      });
      await reload();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Nueva parada extra" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={modalInput} placeholder="Ej. Aeropuerto de Málaga" />
        </Field>
        <Field label="Descripción (opcional)">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className={modalInput}
            placeholder="Punto de llegada y recogida con bus."
          />
        </Field>
        <Field label="Tipo de parada">
          <select value={tipoIcono} onChange={(e) => setTipoIcono(e.target.value)} className={modalInput}>
            {TIPO_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitud">
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={modalInput}
              placeholder="36.6749"
            />
          </Field>
          <Field label="Longitud">
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={modalInput}
              placeholder="-4.4991"
            />
          </Field>
        </div>
        <p className="text-[11px] text-stone-500">
          Tip: en Google Maps haz clic derecho sobre el sitio → copia las coordenadas (formato: lat, lng).
        </p>
        <Field label="Foto (opcional)">
          <ImageUploader eventoId={eventoId} subfolder="paradas" value={fotoUrl} onChange={setFotoUrl} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white">
            {busy ? 'Creando…' : 'Crear parada'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

const modalInput =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</span>
      {children}
    </label>
  );
}
