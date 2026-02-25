'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from '@/lib/resource-types';
import HorariosEditor, { HorarioDia, CierreEspecial } from '@/app/_components/editor/HorariosEditor';

const MapLocationPicker = dynamic(
  () => import('@/app/components/MapLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-lg bg-gray-100" />
    ),
  },
);

const TIPOS = RESOURCE_TYPES;
const TIPO_LABELS = RESOURCE_TYPE_LABELS;

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
  cerradoTemporal?: boolean;
  codigoQr?: string;
  maxAdultos?: number | null;
  maxMenores?: number | null;
  edadMaxMenor?: number | null;
  horariosSemana?: HorarioDia[];
  cierresEspeciales?: CierreEspecial[];
};

type Colaborador = {
  id: number;
  activo: boolean;
  user: {
    id: number;
    email: string;
    nombre?: string | null;
    apellidos?: string | null;
    rol: string;
  };
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
  cerradoTemporal: boolean;
  maxAdultos: string;
  maxMenores: string;
  edadMaxMenor: string;
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
  cerradoTemporal: false,
  maxAdultos: '1',
  maxMenores: '0',
  edadMaxMenor: '12',
};

const API_BASE = '/api/gestion/asociacion/recursos-turisticos';

function formToBody(f: FormData, horariosSemana?: HorarioDia[], cierresEspeciales?: CierreEspecial[]) {
  const body: Record<string, unknown> = {
    nombre: f.nombre.trim(),
    tipo: f.tipo,
    activo: f.activo,
    cerradoTemporal: f.cerradoTemporal,
    provincia: f.provincia.trim(),
    comunidad: f.comunidad.trim(),
    lat: f.lat ? Number(f.lat) : 0,
    lng: f.lng ? Number(f.lng) : 0,
    maxAdultos: f.maxAdultos ? Math.max(1, Number(f.maxAdultos)) : 1,
    maxMenores: f.maxMenores ? Math.max(0, Number(f.maxMenores)) : 0,
    edadMaxMenor: f.edadMaxMenor ? Math.max(0, Number(f.edadMaxMenor)) : 12,
  };

  if (f.descripcion.trim()) body.descripcion = f.descripcion.trim();
  else body.descripcion = null;
  if (f.horarios.trim()) body.horarios = f.horarios.trim();
  if (f.contacto.trim()) body.contacto = f.contacto.trim();
  if (f.web.trim()) body.web = f.web.trim();
  if (f.fotoUrl.trim()) body.fotoUrl = f.fotoUrl.trim();

  body.descuentoPorcentaje = f.descuentoPorcentaje ? Number(f.descuentoPorcentaje) : null;
  body.precioCents = f.precioCents ? Math.round(Number(f.precioCents) * 100) : null;

  if (horariosSemana !== undefined) body.horariosSemana = horariosSemana;
  if (cierresEspeciales !== undefined) body.cierresEspeciales = cierresEspeciales;

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
    cerradoTemporal: r.cerradoTemporal ?? false,
    maxAdultos: r.maxAdultos?.toString() ?? '1',
    maxMenores: r.maxMenores?.toString() ?? '0',
    edadMaxMenor: r.edadMaxMenor?.toString() ?? '12',
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
  horariosSemana,
  cierresEspeciales,
  onHorariosChange,
}: {
  data: FormData;
  onChange: (d: FormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
  horariosSemana: HorarioDia[];
  cierresEspeciales: CierreEspecial[];
  onHorariosChange: (h: HorarioDia[], c: CierreEspecial[]) => void;
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
    <div className="space-y-4">
      {/* Foto */}
      <div>
        <label className="mb-1 block text-sm text-gray-600">Foto</label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
        {data.fotoUrl ? (
          <div className="flex items-center gap-3">
            <img src={data.fotoUrl} alt="Preview" className="h-20 w-28 rounded-lg border object-cover" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving || uploading}
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={saving || uploading}
            className="flex h-20 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            {uploading ? 'Subiendo…' : '+ Subir foto'}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Nombre *</label>
          <input type="text" value={data.nombre} onChange={(e) => set('nombre', e.target.value)}
            disabled={saving} className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          <p className="mt-0.5 text-xs text-gray-400">Se traducirá a 6 idiomas automáticamente.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Tipo *</label>
          <select value={data.tipo} onChange={(e) => set('tipo', e.target.value)}
            disabled={saving} className="w-full rounded border px-3 py-2 disabled:opacity-50">
            {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Descripción</label>
        <textarea value={data.descripcion} onChange={(e) => set('descripcion', e.target.value)}
          disabled={saving} rows={3} className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        <p className="mt-0.5 text-xs text-gray-400">Se traducirá a 6 idiomas automáticamente.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Provincia *</label>
          <input type="text" value={data.provincia} onChange={(e) => set('provincia', e.target.value)}
            disabled={saving} className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Comunidad autónoma *</label>
          <input type="text" value={data.comunidad} onChange={(e) => set('comunidad', e.target.value)}
            disabled={saving} className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Contacto</label>
          <input type="text" value={data.contacto} onChange={(e) => set('contacto', e.target.value)}
            disabled={saving} placeholder="info@ejemplo.com" className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Web</label>
          <input type="text" value={data.web} onChange={(e) => set('web', e.target.value)}
            disabled={saving} placeholder="https://..." className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Latitud</label>
          <input type="number" step="any" value={data.lat} onChange={(e) => set('lat', e.target.value)}
            disabled={saving} placeholder="42.1234" className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Longitud</label>
          <input type="number" step="any" value={data.lng} onChange={(e) => set('lng', e.target.value)}
            disabled={saving} placeholder="-3.5678" className="w-full rounded border px-3 py-2 disabled:opacity-50" />
        </div>
      </div>

      {/* Precios, descuento y condiciones */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
        <h4 className="mb-3 text-sm font-semibold text-blue-800">Precios y condiciones del Club</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Precio (€)</label>
            <input type="number" min="0" step="0.01" value={data.precioCents}
              onChange={(e) => set('precioCents', e.target.value)} disabled={saving}
              placeholder="0.00" className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Descuento Club (%)</label>
            <input type="number" min="0" max="100" value={data.descuentoPorcentaje}
              onChange={(e) => set('descuentoPorcentaje', e.target.value)} disabled={saving}
              className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Máx. adultos</label>
            <input type="number" min="1" max="20" value={data.maxAdultos}
              onChange={(e) => set('maxAdultos', e.target.value)} disabled={saving}
              className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Máx. menores</label>
            <input type="number" min="0" max="10" value={data.maxMenores}
              onChange={(e) => set('maxMenores', e.target.value)} disabled={saving}
              className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Edad máx. menor</label>
            <input type="number" min="0" max="18" value={data.edadMaxMenor}
              onChange={(e) => set('edadMaxMenor', e.target.value)} disabled={saving}
              className="w-full rounded border px-3 py-2 disabled:opacity-50" />
          </div>
        </div>
      </div>

      {/* Horarios y cierres especiales */}
      <div className="rounded-lg border border-gray-200 bg-gray-50/40 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Horarios y cierres especiales</h4>
        <HorariosEditor
          horariosSemana={horariosSemana}
          cierresEspeciales={cierresEspeciales}
          onChange={onHorariosChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={data.activo} onChange={(e) => set('activo', e.target.checked)}
            disabled={saving} className="rounded disabled:opacity-50" />
          Activo
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={data.cerradoTemporal} onChange={(e) => set('cerradoTemporal', e.target.checked)}
            disabled={saving} className="rounded disabled:opacity-50" />
          Cerrado temporalmente
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onSubmit} disabled={saving || !data.nombre.trim()}
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {saving ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
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
                {c.user.nombre
                  ? `${c.user.nombre} (${c.user.email})`
                  : c.user.email}
              </span>
              <button
                type="button"
                onClick={() => handleRevoke(c.user.id)}
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
  const [createHorarios, setCreateHorarios] = useState<HorarioDia[]>([]);
  const [createCierres, setCreateCierres] = useState<CierreEspecial[]>([]);
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormData>({ ...EMPTY_FORM });
  const [editHorarios, setEditHorarios] = useState<HorarioDia[]>([]);
  const [editCierres, setEditCierres] = useState<CierreEspecial[]>([]);
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
        body: JSON.stringify(formToBody(createForm, createHorarios, createCierres)),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || 'Error creando recurso');
        return;
      }
      setCreateForm({ ...EMPTY_FORM });
      setCreateHorarios([]);
      setCreateCierres([]);
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
    setEditHorarios(r.horariosSemana ?? []);
    setEditCierres(r.cierresEspeciales ?? []);
    if (r.lat && r.lng) {
      setFlyToPos([r.lat, r.lng]);
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ ...EMPTY_FORM });
    setEditHorarios([]);
    setEditCierres([]);
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
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToBody(editForm, editHorarios, editCierres)),
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
              setCreateHorarios([]);
              setCreateCierres([]);
            }}
            saving={creating}
            submitLabel="Crear"
            horariosSemana={createHorarios}
            cierresEspeciales={createCierres}
            onHorariosChange={(h, c) => { setCreateHorarios(h); setCreateCierres(c); }}
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
                    horariosSemana={editHorarios}
                    cierresEspeciales={editCierres}
                    onHorariosChange={(h, c) => { setEditHorarios(h); setEditCierres(c); }}
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
                          <span>Precio: {(r.precioCents / 100).toFixed(2)} €</span>
                        )}
                        {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
                          <span className="font-medium text-blue-700">Descuento Club: {r.descuentoPorcentaje}%</span>
                        )}
                        {r.contacto && <span>✉ {r.contacto}</span>}
                        {r.web && (
                          <a href={r.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            🌐 Web
                          </a>
                        )}
                        {r.cerradoTemporal && (
                          <span className="font-semibold text-red-600">⛔ Cerrado temporalmente</span>
                        )}
                      </div>

                      {/* Horarios estructurados (actualizados por colaborador o admin) */}
                      {r.horariosSemana && r.horariosSemana.length > 0 && (
                        <div className="mt-3 overflow-hidden rounded border border-gray-100">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-1 text-left font-medium text-gray-500">Día</th>
                                <th className="px-2 py-1 text-left font-medium text-gray-500">Horario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {r.horariosSemana
                                .sort((a, b) => a.diaSemana - b.diaSemana)
                                .map((h) => {
                                  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                                  return (
                                    <tr key={h.diaSemana} className="hover:bg-gray-50/60">
                                      <td className="px-2 py-1 font-medium text-gray-700">{dias[h.diaSemana]}</td>
                                      <td className="px-2 py-1 text-gray-600">
                                        {h.abierto
                                          ? h.horaAbre && h.horaCierra
                                            ? `${h.horaAbre} – ${h.horaCierra}`
                                            : 'Abierto (sin horario concreto)'
                                          : <span className="text-red-500">Cerrado</span>
                                        }
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Cierres especiales */}
                      {r.cierresEspeciales && r.cierresEspeciales.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500">Cierres especiales:</p>
                          <ul className="mt-1 space-y-0.5">
                            {r.cierresEspeciales.map((c) => {
                              const fecha = new Date(c.fecha);
                              const hoy = new Date();
                              hoy.setHours(0, 0, 0, 0);
                              const esHoy = fecha.toDateString() === hoy.toDateString();
                              const esPasado = fecha < hoy && !esHoy;
                              return (
                                <li key={c.fecha.toString()}
                                  className={`text-xs ${esHoy ? 'font-semibold text-red-600' : esPasado ? 'text-gray-400' : 'text-amber-700'}`}>
                                  {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  {c.motivo ? ` — ${c.motivo}` : ''}
                                  {esHoy && ' (HOY)'}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

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
