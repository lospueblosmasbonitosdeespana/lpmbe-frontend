'use client';

import { useMemo, useState } from 'react';
import {
  BedDouble,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Globe,
  MapPin,
  Users,
  Hourglass,
  UserPlus,
  Upload,
} from 'lucide-react';

import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';
import ImageUploader from './_ImageUploader';

type Alojamiento = EventoEditDetail['alojamientos'][number];
type Asignacion = Alojamiento['asignaciones'][number];

export default function TabAlojamientos({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const [creando, setCreando] = useState(false);
  const [importando, setImportando] = useState(false);

  const grupos = useMemo(() => {
    const byDate = new Map<string, Alojamiento[]>();
    for (const a of evento.alojamientos ?? []) {
      const key = a.fechaCheckIn.substring(0, 10);
      const arr = byDate.get(key) ?? [];
      arr.push(a);
      byDate.set(key, arr);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([fecha, hoteles]) => ({ fecha, hoteles }));
  }, [evento.alojamientos]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-amber-50/40 px-4 py-3 text-sm text-stone-700">
        Crea los hoteles del evento (cada uno con sus fechas, dirección y coordenadas) y asigna a las personas.
        Los asistentes verán esta información en la web pública con un botón <em>Cómo llegar</em> que abre Google Maps.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCreando(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-800"
        >
          <Plus className="h-4 w-4" /> Nuevo hotel
        </button>
        <button
          onClick={() => setImportando(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-amber-400"
        >
          <Upload className="h-4 w-4" /> Importar asignaciones (CSV)
        </button>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-stone-500">Aún no hay alojamientos. Crea el primero.</p>
      ) : null}

      {grupos.map(({ fecha, hoteles }) => (
        <NocheGroup key={fecha} fecha={fecha} hoteles={hoteles} reload={reload} eventoId={evento.id} />
      ))}

      {creando ? (
        <CreateAlojamientoModal eventoId={evento.id} onClose={() => setCreando(false)} reload={reload} />
      ) : null}

      {importando ? (
        <ImportAsignacionesModal
          eventoId={evento.id}
          alojamientos={evento.alojamientos ?? []}
          onClose={() => setImportando(false)}
          reload={reload}
        />
      ) : null}
    </div>
  );
}

function NocheGroup({
  fecha,
  hoteles,
  reload,
  eventoId,
}: {
  fecha: string;
  hoteles: Alojamiento[];
  reload: () => Promise<void>;
  eventoId: number;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-stone-900">
        Noche del{' '}
        {new Date(fecha).toLocaleDateString('es', { day: '2-digit', month: 'long' })}
      </h3>
      <div className="space-y-2">
        {hoteles.map((h) => (
          <HotelRow key={h.id} hotel={h} reload={reload} eventoId={eventoId} />
        ))}
      </div>
    </section>
  );
}

function HotelRow({
  hotel,
  reload,
  eventoId,
}: {
  hotel: Alojamiento;
  reload: () => Promise<void>;
  eventoId: number;
}) {
  const [editing, setEditing] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Eliminar "${hotel.nombre}"? Se borrarán sus asignaciones.`)) return;
    setBusy(true);
    try {
      await adminFetch(`/alojamientos/${hotel.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const grupos = groupByDelegacion(hotel.asignaciones);
  const mapsUrl =
    hotel.lat != null && hotel.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`
      : null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BedDouble className="h-4 w-4 text-amber-700" />
            <h4 className="text-base font-semibold text-stone-900">{hotel.nombre}</h4>
            {hotel.paraTodos ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                Todos
              </span>
            ) : null}
            {hotel.pendiente ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                <Hourglass className="h-3 w-3" /> Pendiente
              </span>
            ) : null}
          </div>
          {hotel.ciudad || hotel.direccion ? (
            <p className="mt-0.5 text-xs text-stone-500">
              {[hotel.ciudad, hotel.direccion].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-stone-500">
            {fmt(hotel.fechaCheckIn)} → {fmt(hotel.fechaCheckOut)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
              >
                <MapPin className="h-3 w-3" /> Maps
              </a>
            ) : null}
            {hotel.telefono ? (
              <a
                href={`tel:${hotel.telefono.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
              >
                <Phone className="h-3 w-3" /> {hotel.telefono}
              </a>
            ) : null}
            {hotel.web ? (
              <a
                href={hotel.web}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
              >
                <Globe className="h-3 w-3" /> Web
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Eliminar
          </button>
        </div>
      </div>

      {!hotel.paraTodos ? (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h5 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
              <Users className="h-3.5 w-3.5" /> Asignaciones ({hotel.asignaciones.length})
            </h5>
            <button
              onClick={() => setAddingPerson(true)}
              className="inline-flex items-center gap-1 rounded-md bg-amber-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-800"
            >
              <UserPlus className="h-3 w-3" /> Añadir persona
            </button>
          </div>
          {grupos.length === 0 ? (
            <p className="text-xs text-stone-500">Sin asignaciones todavía.</p>
          ) : (
            <div className="space-y-2">
              {grupos.map(([deleg, personas]) => (
                <div key={deleg}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{deleg}</p>
                  <ul className="mt-0.5 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    {personas.map((a) => (
                      <PersonaRow key={a.id} asig={a} reload={reload} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {editing ? (
        <EditAlojamientoModal
          hotel={hotel}
          eventoId={eventoId}
          onClose={() => setEditing(false)}
          reload={reload}
        />
      ) : null}
      {addingPerson ? (
        <AddAsignacionModal
          alojamientoId={hotel.id}
          delegacionesPrev={Array.from(new Set(hotel.asignaciones.map((a) => a.delegacion)))}
          onClose={() => setAddingPerson(false)}
          reload={reload}
        />
      ) : null}
    </div>
  );
}

function PersonaRow({ asig, reload }: { asig: Asignacion; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!confirm(`Quitar a ${asig.persona} de este hotel?`)) return;
    setBusy(true);
    try {
      await adminFetch(`/asignaciones/${asig.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="flex items-center justify-between gap-2 rounded px-1 py-0.5 text-sm text-stone-800 hover:bg-stone-50">
      <span className="truncate">{asig.persona}</span>
      <button
        onClick={remove}
        disabled={busy}
        title="Quitar"
        className="shrink-0 rounded p-0.5 text-stone-300 hover:text-red-600"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}

// ── Modales ─────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-stone-500 hover:bg-stone-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateAlojamientoModal({
  eventoId,
  onClose,
  reload,
}: {
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  return (
    <AlojamientoForm
      title="Nuevo alojamiento"
      eventoId={eventoId}
      onClose={onClose}
      reload={reload}
      onSubmit={async (payload) => {
        await adminFetch(`/${eventoId}/alojamientos`, { method: 'POST', json: payload });
      }}
    />
  );
}

function EditAlojamientoModal({
  hotel,
  eventoId,
  onClose,
  reload,
}: {
  hotel: Alojamiento;
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  return (
    <AlojamientoForm
      title={`Editar "${hotel.nombre}"`}
      eventoId={eventoId}
      initial={hotel}
      onClose={onClose}
      reload={reload}
      onSubmit={async (payload) => {
        await adminFetch(`/alojamientos/${hotel.id}`, { method: 'PATCH', json: payload });
      }}
    />
  );
}

function AlojamientoForm({
  title,
  eventoId,
  initial,
  onClose,
  reload,
  onSubmit,
}: {
  title: string;
  eventoId: number;
  initial?: Alojamiento;
  onClose: () => void;
  reload: () => Promise<void>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [fechaCheckIn, setFechaCheckIn] = useState(initial?.fechaCheckIn?.substring(0, 10) ?? '');
  const [fechaCheckOut, setFechaCheckOut] = useState(initial?.fechaCheckOut?.substring(0, 10) ?? '');
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? '');
  const [direccion, setDireccion] = useState(initial?.direccion ?? '');
  const [lat, setLat] = useState(initial?.lat?.toString() ?? '');
  const [lng, setLng] = useState(initial?.lng?.toString() ?? '');
  const [telefono, setTelefono] = useState(initial?.telefono ?? '');
  const [web, setWeb] = useState(initial?.web ?? '');
  const [paraTodos, setParaTodos] = useState(initial?.paraTodos ?? false);
  const [pendiente, setPendiente] = useState(initial?.pendiente ?? false);
  const [notas, setNotas] = useState(initial?.notas_es ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(initial?.fotoUrl ?? null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!nombre.trim() || !fechaCheckIn || !fechaCheckOut) {
      alert('Nombre, fecha entrada y fecha salida son obligatorios');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        fechaCheckIn,
        fechaCheckOut,
        ciudad: ciudad || null,
        direccion: direccion || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        telefono: telefono || null,
        web: web || null,
        paraTodos,
        pendiente,
        notas_es: notas || null,
        fotoUrl,
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
    <ModalShell title={title} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre del hotel">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={input} placeholder="Ej. Hotel El Alcornocal" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Check-in">
            <input type="date" value={fechaCheckIn} onChange={(e) => setFechaCheckIn(e.target.value)} className={input} />
          </Field>
          <Field label="Check-out">
            <input type="date" value={fechaCheckOut} onChange={(e) => setFechaCheckOut(e.target.value)} className={input} />
          </Field>
        </div>
        <Field label="Ciudad / municipio">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={input} placeholder="Vejer de la Frontera" />
        </Field>
        <Field label="Dirección (opcional)">
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Latitud">
            <input value={lat} onChange={(e) => setLat(e.target.value)} className={input} placeholder="36.252" />
          </Field>
          <Field label="Longitud">
            <input value={lng} onChange={(e) => setLng(e.target.value)} className={input} placeholder="-5.965" />
          </Field>
        </div>
        <p className="text-[11px] text-stone-500">
          Tip: en Google Maps, clic derecho en el sitio → copia las coordenadas.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Teléfono">
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={input} placeholder="+34 956 …" />
          </Field>
          <Field label="Web">
            <input value={web} onChange={(e) => setWeb(e.target.value)} className={input} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Notas (opcional)">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={input} />
        </Field>
        <Field label="Foto (opcional)">
          <ImageUploader eventoId={eventoId} subfolder="alojamientos" value={fotoUrl} onChange={setFotoUrl} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-1.5 text-xs text-stone-700">
            <input type="checkbox" checked={paraTodos} onChange={(e) => setParaTodos(e.target.checked)} className="h-4 w-4" />
            Para todas las delegaciones
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-stone-700">
            <input type="checkbox" checked={pendiente} onChange={(e) => setPendiente(e.target.checked)} className="h-4 w-4" />
            Hotel pendiente de asignar
          </label>
        </div>
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

function AddAsignacionModal({
  alojamientoId,
  delegacionesPrev,
  onClose,
  reload,
}: {
  alojamientoId: number;
  delegacionesPrev: string[];
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [delegacion, setDelegacion] = useState(delegacionesPrev[0] ?? '');
  const [persona, setPersona] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!delegacion.trim() || !persona.trim()) {
      alert('Delegación y persona son obligatorios');
      return;
    }
    setBusy(true);
    try {
      await adminFetch(`/alojamientos/${alojamientoId}/asignaciones`, {
        method: 'POST',
        json: { delegacion: delegacion.trim(), persona: persona.trim() },
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
    <ModalShell title="Añadir persona al hotel" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Delegación">
          <input
            list="delegaciones"
            value={delegacion}
            onChange={(e) => setDelegacion(e.target.value)}
            className={input}
            placeholder="Ej. Les Plus Beaux Villages de France"
          />
          <datalist id="delegaciones">
            {delegacionesPrev.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Persona (nombre y apellidos)">
          <input value={persona} onChange={(e) => setPersona(e.target.value)} className={input} placeholder="Esther Aisa" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={save} disabled={busy} className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white">
            {busy ? 'Añadiendo…' : 'Añadir'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ImportAsignacionesModal({
  eventoId,
  alojamientos,
  onClose,
  reload,
}: {
  eventoId: number;
  alojamientos: Alojamiento[];
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; errores: Array<{ row: number; reason: string }> } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const items = parseCsv(text);
      if (items.length === 0) {
        alert('No se han detectado filas válidas');
        return;
      }
      const res = await adminFetch<{ created: number; errores: Array<{ row: number; reason: string }> }>(
        `/${eventoId}/asignaciones/import`,
        { method: 'POST', json: { items } },
      );
      setResult(res);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Importar asignaciones" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-stone-600">
          Pega un CSV con cuatro columnas separadas por <code>;</code> o tabulador:
          <br />
          <code className="text-xs">delegación;persona;hotelNombre;notas</code>
        </p>
        <p className="text-xs text-stone-500">
          Hoteles disponibles:{' '}
          {alojamientos.map((a) => (
            <span key={a.id} className="mr-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">
              {a.nombre}
            </span>
          ))}
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className={input + ' font-mono text-xs'}
          placeholder="Les Plus Beaux Villages de France;Alain Di Stefano;Hotel Las Palmeras del Califa de Vejer;"
        />
        {result ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-semibold text-emerald-800">{result.created} asignaciones creadas.</p>
            {result.errores.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                {result.errores.map((er, i) => (
                  <li key={i}>Fila {er.row}: {er.reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">Cerrar</button>
          <button onClick={run} disabled={busy || !text.trim()} className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function parseCsv(text: string): Array<{ delegacion: string; persona: string; alojamientoNombre: string; notas?: string }> {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[;\t]/);
      const [delegacion, persona, alojamientoNombre, notas] = parts;
      return {
        delegacion: (delegacion ?? '').trim(),
        persona: (persona ?? '').trim(),
        alojamientoNombre: (alojamientoNombre ?? '').trim(),
        notas: notas ? notas.trim() : undefined,
      };
    })
    .filter((it) => it.delegacion && it.persona && it.alojamientoNombre);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupByDelegacion(asignaciones: Asignacion[]): Array<readonly [string, Asignacion[]]> {
  const m = new Map<string, Asignacion[]>();
  for (const a of asignaciones) {
    const arr = m.get(a.delegacion) ?? [];
    arr.push(a);
    m.set(a.delegacion, arr);
  }
  return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

const input =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</span>
      {children}
    </label>
  );
}
