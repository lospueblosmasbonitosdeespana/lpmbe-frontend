'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react';

import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';
import ImageUploader from './_ImageUploader';

const MapLocationPicker = dynamic(() => import('@/app/components/MapLocationPicker'), { ssr: false });

type Restaurante = EventoEditDetail['restaurantes'][number];

export default function TabRestaurantes({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const [creando, setCreando] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-amber-50/40 px-4 py-3 text-sm text-stone-700">
        Añade los restaurantes del evento con su nombre y geolocalización. Los asistentes verán un botón{' '}
        <em>Cómo llegar</em> que abre Google Maps directamente.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCreando(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-800"
        >
          <Plus className="h-4 w-4" /> Nuevo restaurante
        </button>
      </div>

      {(evento.restaurantes ?? []).length === 0 ? (
        <p className="text-sm text-stone-500">Aún no hay restaurantes. Crea el primero.</p>
      ) : (
        <div className="space-y-3">
          {(evento.restaurantes ?? []).map((r) => (
            <RestauranteRow key={r.id} restaurante={r} reload={reload} eventoId={evento.id} />
          ))}
        </div>
      )}

      {creando ? (
        <CreateRestauranteModal eventoId={evento.id} onClose={() => setCreando(false)} reload={reload} />
      ) : null}
    </div>
  );
}

function RestauranteRow({
  restaurante,
  reload,
  eventoId,
}: {
  restaurante: Restaurante;
  reload: () => Promise<void>;
  eventoId: number;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Eliminar "${restaurante.nombre}"?`)) return;
    setBusy(true);
    try {
      await adminFetch(`/restaurantes/${restaurante.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const mapsUrl =
    restaurante.lat != null && restaurante.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${restaurante.lat},${restaurante.lng}`
      : null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber-700" />
            <h4 className="text-base font-semibold text-stone-900">{restaurante.nombre}</h4>
          </div>
          {restaurante.ciudad || restaurante.direccion ? (
            <p className="mt-0.5 text-xs text-stone-500">
              {[restaurante.ciudad, restaurante.direccion].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {restaurante.notas_es ? (
            <p className="mt-1 text-xs text-stone-600 italic">{restaurante.notas_es}</p>
          ) : null}
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
            {restaurante.telefono ? (
              <a
                href={`tel:${restaurante.telefono.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
              >
                <Phone className="h-3 w-3" /> {restaurante.telefono}
              </a>
            ) : null}
            {restaurante.web ? (
              <a
                href={restaurante.web}
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

      {editing ? (
        <EditRestauranteModal
          restaurante={restaurante}
          eventoId={eventoId}
          onClose={() => setEditing(false)}
          reload={reload}
        />
      ) : null}
    </div>
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

function CreateRestauranteModal({
  eventoId,
  onClose,
  reload,
}: {
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  return (
    <RestauranteForm
      title="Nuevo restaurante"
      eventoId={eventoId}
      onClose={onClose}
      reload={reload}
      onSubmit={async (payload) => {
        await adminFetch(`/${eventoId}/restaurantes`, { method: 'POST', json: payload });
      }}
    />
  );
}

function EditRestauranteModal({
  restaurante,
  eventoId,
  onClose,
  reload,
}: {
  restaurante: Restaurante;
  eventoId: number;
  onClose: () => void;
  reload: () => Promise<void>;
}) {
  return (
    <RestauranteForm
      title={`Editar "${restaurante.nombre}"`}
      eventoId={eventoId}
      initial={restaurante}
      onClose={onClose}
      reload={reload}
      onSubmit={async (payload) => {
        await adminFetch(`/restaurantes/${restaurante.id}`, { method: 'PATCH', json: payload });
      }}
    />
  );
}

function RestauranteForm({
  title,
  eventoId,
  initial,
  onClose,
  reload,
  onSubmit,
}: {
  title: string;
  eventoId: number;
  initial?: Restaurante;
  onClose: () => void;
  reload: () => Promise<void>;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? '');
  const [direccion, setDireccion] = useState(initial?.direccion ?? '');
  const [coords, setCoords] = useState(
    initial?.lat != null && initial?.lng != null ? `${initial.lat}, ${initial.lng}` : '',
  );
  const [telefono, setTelefono] = useState(initial?.telefono ?? '');
  const [web, setWeb] = useState(initial?.web ?? '');
  const [notas, setNotas] = useState(initial?.notas_es ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(initial?.fotoUrl ?? null);
  const [busy, setBusy] = useState(false);

  const parsedCoords = parseCoords(coords);
  const coordsError = coords.trim() && !parsedCoords ? 'Formato no válido. Usa "36.2539, -5.9622"' : null;

  const save = async () => {
    if (!nombre.trim()) {
      alert('El nombre del restaurante es obligatorio');
      return;
    }
    if (coordsError) {
      alert(coordsError);
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        ciudad: ciudad || null,
        direccion: direccion || null,
        lat: parsedCoords?.lat ?? null,
        lng: parsedCoords?.lng ?? null,
        telefono: telefono || null,
        web: web || null,
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
        <Field label="Nombre del restaurante">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={input}
            placeholder="Ej. Restaurante El Alcornocal"
          />
        </Field>
        <Field label="Ciudad / municipio">
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className={input}
            placeholder="Vejer de la Frontera"
          />
        </Field>
        <Field label="Dirección (opcional)">
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={input} />
        </Field>
        <Field label="Coordenadas (latitud, longitud)">
          <input
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            className={input}
            placeholder="36.25398851147167, -5.962280031342549"
            inputMode="text"
          />
        </Field>
        <p className="text-[11px] text-stone-500">
          Tip: en Google Maps, clic derecho sobre el restaurante → toca las coordenadas para copiarlas y pégalas aquí.
          O busca/haz clic en el mapa de abajo.
          {parsedCoords ? (
            <span className="ml-1 font-medium text-emerald-700">
              ✓ {parsedCoords.lat.toFixed(5)}, {parsedCoords.lng.toFixed(5)}
            </span>
          ) : null}
          {coordsError ? <span className="ml-1 font-medium text-red-600">{coordsError}</span> : null}
        </p>
        <div className="mt-2 overflow-hidden rounded-xl border border-stone-200">
          <MapLocationPicker
            center={parsedCoords ? [parsedCoords.lat, parsedCoords.lng] : [36.75, -5.4]}
            zoom={parsedCoords ? 15 : 8}
            selectedPosition={parsedCoords}
            onLocationSelect={(lat, lng) => {
              setCoords(`${Math.round(lat * 1e6) / 1e6}, ${Math.round(lng * 1e6) / 1e6}`);
            }}
            height="250px"
            searchPlaceholder="Buscar restaurante o dirección…"
            activeHint="Haz clic en el mapa para fijar la ubicación del restaurante"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Teléfono">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={input}
              placeholder="+34 956 …"
            />
          </Field>
          <Field label="Web">
            <input
              value={web}
              onChange={(e) => setWeb(e.target.value)}
              className={input}
              placeholder="https://…"
            />
          </Field>
        </div>
        <Field label="Notas (opcional)">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={input} />
        </Field>
        <Field label="Foto (opcional)">
          <ImageUploader eventoId={eventoId} subfolder="restaurantes" value={fotoUrl} onChange={setFotoUrl} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseCoords(input: string): { lat: number; lng: number } | null {
  const cleaned = input.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/^\s*(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/);
  if (!match) return null;
  const lat = parseFloat(match[1].replace(',', '.'));
  const lng = parseFloat(match[2].replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
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
