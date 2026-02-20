'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

const MapLocationPicker = dynamic(
  () => import('@/app/components/MapLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-lg bg-gray-100" />
    ),
  },
);

const TIPOS = [
  'CASTILLO',
  'MONASTERIO',
  'MUSEO',
  'BODEGA',
  'PARQUE_NATURAL',
  'OTRO',
] as const;

const TIPO_LABELS: Record<string, string> = {
  CASTILLO: 'Castillo',
  MONASTERIO: 'Monasterio',
  MUSEO: 'Museo',
  BODEGA: 'Bodega',
  PARQUE_NATURAL: 'Parque natural',
  OTRO: 'Otro',
};

type RecursoAsociacion = {
  id: number;
  nombre: string;
  tipo: string;
  slug?: string;
  descripcion?: string | null;
  horarios?: string | null;
  contacto?: string | null;
  web?: string | null;
  fotoUrl?: string | null;
  lat: number;
  lng: number;
  provincia: string;
  comunidad: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  activo: boolean;
  codigoQr?: string;
};

type Colaborador = {
  id: number;
  email: string;
  nombre?: string | null;
};

type FormData = {
  nombre: string;
  tipo: string;
  descripcion: string;
  horarios: string;
  contacto: string;
  web: string;
  fotoUrl: string;
  lat: string;
  lng: string;
  provincia: string;
  comunidad: string;
  descuentoPorcentaje: string;
  precioCents: string;
  activo: boolean;
};

const EMPTY_FORM: FormData = {
  nombre: '',
  tipo: 'CASTILLO',
  descripcion: '',
  horarios: '',
  contacto: '',
  web: '',
  fotoUrl: '',
  lat: '',
  lng: '',
  provincia: '',
  comunidad: '',
  descuentoPorcentaje: '',
  precioCents: '',
  activo: true,
};

const API_BASE = '/api/gestion/asociacion/recursos-turisticos';

function formToBody(f: FormData) {
  const body: Record<string, unknown> = {
    nombre: f.nombre.trim(),
    tipo: f.tipo,
    activo: f.activo,
    provincia: f.provincia.trim(),
    comunidad: f.comunidad.trim(),
    lat: f.lat ? Number(f.lat) : 0,
    lng: f.lng ? Number(f.lng) : 0,
  };

  if (f.descripcion.trim()) body.descripcion = f.descripcion.trim();
  if (f.horarios.trim()) body.horarios = f.horarios.trim();
  if (f.contacto.trim()) body.contacto = f.contacto.trim();
  if (f.web.trim()) body.web = f.web.trim();
  if (f.fotoUrl.trim()) body.fotoUrl = f.fotoUrl.trim();

  if (f.descuentoPorcentaje) {
    body.descuentoPorcentaje = Number(f.descuentoPorcentaje);
  }
  if (f.precioCents) {
    body.precioCents = Math.round(Number(f.precioCents) * 100);
  }

  return body;
}

function recursoToForm(r: RecursoAsociacion): FormData {
  return {
    nombre: r.nombre,
    tipo: r.tipo || 'OTRO',
    descripcion: r.descripcion || '',
    horarios: r.horarios || '',
    contacto: r.contacto || '',
    web: r.web || '',
    fotoUrl: r.fotoUrl || '',
    lat: r.lat?.toString() || '',
    lng: r.lng?.toString() || '',
    provincia: r.provincia || '',
    comunidad: r.comunidad || '',
    descuentoPorcentaje: r.descuentoPorcentaje?.toString() || '',
    precioCents: r.precioCents ? (r.precioCents / 100).toString() : '',
    activo: r.activo,
  };
}

// ---------------------------------------------------------------------------
// Form component (reused for create & edit)
// ---------------------------------------------------------------------------

function RecursoForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}: {
  data: FormData;
  onChange: (d: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormData, val: string | boolean) =>
    onChange({ ...data, [key]: val });

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url } = await uploadImageToR2(file, 'recursos-asociacion');
      onChange({ ...data, fotoUrl: url });
    } catch {
      // silently fail — user can retry
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Nombre *</label>
          <input
            type="text"
            value={data.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Tipo *</label>
          <select
            value={data.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Descripción</label>
        <textarea
          value={data.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          disabled={saving}
          rows={3}
          className="w-full rounded border px-3 py-2 disabled:opacity-50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Provincia *</label>
          <input
            type="text"
            value={data.provincia}
            onChange={(e) => set('provincia', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            Comunidad autónoma *
          </label>
          <input
            type="text"
            value={data.comunidad}
            onChange={(e) => set('comunidad', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Latitud</label>
          <input
            type="number"
            step="any"
            value={data.lat}
            onChange={(e) => set('lat', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="42.1234"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Longitud</label>
          <input
            type="number"
            step="any"
            value={data.lng}
            onChange={(e) => set('lng', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="-3.5678"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Horarios</label>
          <input
            type="text"
            value={data.horarios}
            onChange={(e) => set('horarios', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="L-V 10:00-18:00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Contacto</label>
          <input
            type="text"
            value={data.contacto}
            onChange={(e) => set('contacto', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="info@ejemplo.com"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Web</label>
          <input
            type="text"
            value={data.web}
            onChange={(e) => set('web', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Foto</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
          {data.fotoUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={data.fotoUrl}
                alt="Preview"
                className="h-12 w-12 rounded border object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || uploading}
                className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subiendo…
                  </span>
                ) : (
                  'Cambiar'
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || uploading}
              className="w-full rounded border border-dashed px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subiendo…
                </span>
              ) : (
                'Subir foto'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            Descuento (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={data.descuentoPorcentaje}
            onChange={(e) => set('descuentoPorcentaje', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            Precio (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.precioCents}
            onChange={(e) => set('precioCents', e.target.value)}
            disabled={saving}
            className="w-full rounded border px-3 py-2 disabled:opacity-50"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={data.activo}
          onChange={(e) => set('activo', e.target.checked)}
          disabled={saving}
          className="disabled:opacity-50"
        />
        <label className="text-sm text-gray-600">Activo</label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !data.nombre.trim()}
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Colaboradores section per resource
// ---------------------------------------------------------------------------

function ColaboradoresSection({ recursoId }: { recursoId: number }) {
  const [cols, setCols] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/club/recursos/${recursoId}/colaboradores`,
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error cargando colaboradores');
        return;
      }
      const data = await res.json();
      setCols(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [recursoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign() {
    if (!email.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/club/recursos/${recursoId}/colaboradores`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error asignando colaborador');
        return;
      }
      setEmail('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setAdding(false);
    }
  }

  async function handleRevoke(userId: number) {
    if (!confirm('¿Revocar acceso a este colaborador?')) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/club/recursos/${recursoId}/colaboradores/${userId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error revocando acceso');
        return;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  return (
    <div className="mt-3 rounded border border-dashed p-3">
      <h4 className="text-sm font-medium text-gray-700">Colaboradores</h4>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="mt-1 text-xs text-gray-500">Cargando…</p>
      ) : cols.length === 0 ? (
        <p className="mt-1 text-xs text-gray-500">
          Sin colaboradores asignados.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {cols.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-sm"
            >
              <span>
                {c.nombre ? `${c.nombre} (${c.email})` : c.email}
              </span>
              <button
                type="button"
                onClick={() => handleRevoke(c.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Revocar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          disabled={adding}
          className="flex-1 rounded border px-2 py-1 text-sm disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAssign}
          disabled={adding || !email.trim()}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {adding ? 'Asignando…' : 'Asignar'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RecursosAsociacionClient() {
  const [recursos, setRecursos] = useState<RecursoAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormData>({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const [expandedColab, setExpandedColab] = useState<number | null>(null);

  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);

  const recursoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const isFormActive = showCreate || editId !== null;

  const existingMarkers = recursos
    .filter((r) => r.lat && r.lng)
    .map((r) => ({
      lat: r.lat,
      lng: r.lng,
      label: r.nombre,
      color: r.activo ? 'blue' : 'grey',
    }));

  const selectedMapPosition = (() => {
    const form = showCreate ? createForm : editId !== null ? editForm : null;
    if (!form || !form.lat || !form.lng) return null;
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return { lat, lng };
  })();

  const activeHint = showCreate
    ? 'Haz clic en el mapa para ubicar el nuevo recurso'
    : editId !== null
      ? 'Haz clic en el mapa para cambiar la ubicación del recurso'
      : undefined;

  function handleMapLocationSelect(lat: number, lng: number) {
    const rounded = {
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
    };
    if (showCreate) {
      setCreateForm((prev) => ({
        ...prev,
        lat: rounded.lat.toString(),
        lng: rounded.lng.toString(),
      }));
    } else if (editId !== null) {
      setEditForm((prev) => ({
        ...prev,
        lat: rounded.lat.toString(),
        lng: rounded.lng.toString(),
      }));
    }
  }

  function handleExistingMarkerClick(index: number) {
    const withCoords = recursos.filter((r) => r.lat && r.lng);
    const recurso = withCoords[index];
    if (!recurso) return;
    const el = recursoRefs.current.get(recurso.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000);
    }
  }

  // ---- Load ----

  const loadRecursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error cargando recursos');
        return;
      }
      const data = await res.json();
      setRecursos(Array.isArray(data) ? data : data.items || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecursos();
  }, [loadRecursos]);

  // ---- Create ----

  async function handleCreate() {
    if (!createForm.nombre.trim() || !createForm.provincia.trim() || !createForm.comunidad.trim()) {
      setError('Nombre, provincia y comunidad son obligatorios');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToBody(createForm)),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error creando recurso');
        return;
      }
      setCreateForm({ ...EMPTY_FORM });
      setShowCreate(false);
      await loadRecursos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCreating(false);
    }
  }

  // ---- Edit ----

  function startEdit(r: RecursoAsociacion) {
    setEditId(r.id);
    setEditForm(recursoToForm(r));
    if (r.lat && r.lng) {
      setFlyToPos([r.lat, r.lng]);
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ ...EMPTY_FORM });
    setFlyToPos(null);
  }

  async function handleSave(id: number) {
    if (!editForm.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = formToBody(editForm);
      if (!editForm.descuentoPorcentaje) body.descuentoPorcentaje = null;
      if (!editForm.precioCents) body.precioCents = null;

      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error guardando recurso');
        return;
      }
      cancelEdit();
      await loadRecursos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete ----

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error eliminando recurso');
        return;
      }
      await loadRecursos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  // ---- Toggle activo ----

  async function handleToggle(id: number, activo: boolean) {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error actualizando recurso');
        return;
      }
      await loadRecursos();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  // ---- Render ----

  return (
    <>
      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Mapa interactivo */}
      <div className="mt-4">
        <MapLocationPicker
          center={[40.0, -3.7]}
          zoom={6}
          existingMarkers={existingMarkers}
          selectedPosition={selectedMapPosition}
          onLocationSelect={isFormActive ? handleMapLocationSelect : undefined}
          onExistingMarkerClick={handleExistingMarkerClick}
          height="420px"
          searchPlaceholder="Buscar ubicación (ej: Castillo de Loarre)..."
          activeHint={activeHint}
          flyTo={flyToPos}
        />
      </div>

      {/* Botón / formulario de creación */}
      {!showCreate ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            + Nuevo recurso
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded border p-4">
          <h2 className="mb-3 font-medium">Nuevo recurso</h2>
          <RecursoForm
            data={createForm}
            onChange={setCreateForm}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreate(false);
              setCreateForm({ ...EMPTY_FORM });
            }}
            saving={creating}
            submitLabel="Crear"
          />
        </div>
      )}

      {/* Lista */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-600">Cargando recursos…</p>
        ) : recursos.length === 0 ? (
          <p className="text-sm text-gray-600">
            No hay recursos de asociación todavía.
          </p>
        ) : (
          recursos.map((r) => (
            <div
              key={r.id}
              ref={(el) => {
                if (el) recursoRefs.current.set(r.id, el);
                else recursoRefs.current.delete(r.id);
              }}
              className="rounded border p-4 transition-shadow"
            >
              {editId === r.id ? (
                <div>
                  <h3 className="mb-3 font-medium">Editar recurso</h3>
                  <RecursoForm
                    data={editForm}
                    onChange={setEditForm}
                    onSubmit={() => handleSave(r.id)}
                    onCancel={cancelEdit}
                    saving={saving}
                    submitLabel="Guardar"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.nombre}</span>
                        <span className="inline-block rounded border bg-gray-50 px-2 py-0.5 text-xs">
                          {TIPO_LABELS[r.tipo] || r.tipo}
                        </span>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                            r.activo
                              ? 'border border-green-200 bg-green-50 text-green-700'
                              : 'border border-gray-200 bg-gray-100 text-gray-500'
                          }`}
                        >
                          {r.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-gray-600">
                        {r.provincia}, {r.comunidad}
                      </div>

                      {r.descripcion && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {r.descripcion}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {r.precioCents != null && r.precioCents > 0 && (
                          <span>
                            Precio: {(r.precioCents / 100).toFixed(2)} €
                          </span>
                        )}
                        {r.descuentoPorcentaje != null &&
                          r.descuentoPorcentaje > 0 && (
                            <span>Descuento: {r.descuentoPorcentaje}%</span>
                          )}
                        {r.horarios && <span>Horarios: {r.horarios}</span>}
                        {r.web && (
                          <a
                            href={r.web}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Web
                          </a>
                        )}
                      </div>

                      {r.codigoQr && (
                        <div className="mt-1 break-all font-mono text-xs text-gray-400">
                          QR: {r.codigoQr}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(r.id, r.activo)}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      {r.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedColab(
                          expandedColab === r.id ? null : r.id,
                        )
                      }
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Colaboradores
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Sección colaboradores expandida */}
                  {expandedColab === r.id && (
                    <ColaboradoresSection recursoId={r.id} />
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
