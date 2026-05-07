'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { GripVertical, Plus, ArrowUpRight } from 'lucide-react';

type EventoListItem = {
  id: number;
  slug: string;
  nombre: string;
  publicado: boolean;
  orden: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  logoUrl: string | null;
  updatedAt: string;
  _count: { dias: number; pueblos: number; avisos: number; fotos: number };
};

export default function GrandesEventosListado() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/grandes-eventos', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando eventos');
      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/grandes-eventos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), slug: slug.trim() || slugify(nombre) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error creando evento');
      }
      const created = (await res.json()) as { id: number };
      router.push(`/gestion/asociacion/grandes-eventos/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCreating(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = eventos.findIndex((ev) => String(ev.id) === active.id);
    const newIndex = eventos.findIndex((ev) => String(ev.id) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(eventos, oldIndex, newIndex);
    // Asignamos orden DESC: el primero de la lista tiene el orden más alto.
    const total = next.length;
    const withOrden = next.map((ev, i) => ({ ...ev, orden: total - i }));
    setEventos(withOrden);
    setSavingOrder(true);
    try {
      await fetch('/api/admin/grandes-eventos/reorder', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: withOrden.map((ev) => ({ id: ev.id, orden: ev.orden })) }),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error guardando orden');
      await load();
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Crear nuevo */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
          <Plus className="h-5 w-5 text-amber-700" /> Crear nuevo evento
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Indica un nombre interno (ej. <em>Asamblea General 2026 Alcudia</em>) y, opcionalmente, un slug para la URL pública{' '}
          <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">/encuentros/[slug]</code>. Si lo dejas vacío, se generará automáticamente.
          El nuevo evento aparecerá el primero de la lista; podrás reordenarlo por arrastre.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre del evento"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            required
          />
          <input
            type="text"
            placeholder="slug-de-la-url (opcional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || !nombre.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creando…' : 'Crear evento'}
            </button>
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>
      </section>

      {/* Listado ordenable */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Eventos existentes</h2>
            <p className="text-xs text-stone-500">
              Arrastra los eventos por el icono de la izquierda para reordenarlos. El primero es el más visible en gestión.
              {savingOrder ? <span className="ml-2 font-semibold text-amber-700">Guardando orden…</span> : null}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Cargando…</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay eventos. Crea el primero arriba.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={eventos.map((ev) => String(ev.id))} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {eventos.map((ev) => (
                  <EventoRow key={ev.id} ev={ev} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}

function EventoRow({ ev }: { ev: EventoListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(ev.id) });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-stretch gap-2 rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md">
        <button
          type="button"
          className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-l-2xl border-r border-stone-100 px-3 text-stone-400 hover:bg-stone-50 active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <Link
          href={`/gestion/asociacion/grandes-eventos/${ev.id}`}
          className="flex-1 px-4 py-4 sm:py-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-stone-900 sm:text-lg">{ev.nombre}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    ev.publicado ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {ev.publicado ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-stone-500">/encuentros/{ev.slug}</p>
              {(ev.fechaInicio || ev.fechaFin) && (
                <p className="mt-1 text-xs text-stone-600">
                  {fmtDate(ev.fechaInicio)} – {fmtDate(ev.fechaFin)}
                </p>
              )}
            </div>
            <div className="grid shrink-0 grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider text-stone-500">
              <Stat label="días" value={ev._count.dias} />
              <Stat label="pueblos" value={ev._count.pueblos} />
              <Stat label="avisos" value={ev._count.avisos} />
              <Stat label="fotos" value={ev._count.fotos} />
            </div>
            <ArrowUpRight className="hidden h-4 w-4 text-stone-400 sm:block" />
          </div>
        </Link>
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-stone-50 px-2 py-1.5 min-w-[60px]">
      <div className="text-base font-bold text-stone-900">{value}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
