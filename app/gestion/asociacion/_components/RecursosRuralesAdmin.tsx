'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Mountain,
  MapPin,
  Plus,
  Save,
  Trash2,
  Loader2,
  X,
  Camera,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import MapLocationPicker from '@/app/components/MapLocationPicker';
import { uploadImageToR2 } from '@/src/lib/uploadHelper';

type RecursoRural = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: string;
  descripcion: string | null;
  fotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  geoRadioMetros: number | null;
  validacionTipo: string;
  provincia: string | null;
  comunidad: string | null;
  activo: boolean;
  puebloId: number | null;
  puebloNombre: string | null;
  puebloSlug: string | null;
};

type ReglaGamif = {
  key: string;
  nombre: string;
  puntos: number;
  activo: boolean;
};

const TIPOS = [
  'NATURAL',
  'CASCADA',
  'MIRADOR',
  'PARAJE',
  'DOLMEN',
  'YACIMIENTO',
  'ERMITA',
  'RUTA_CORTA',
  'OTRO',
];

const RADIOS = [50, 100, 150, 200, 300, 400];

export default function RecursosRuralesAdmin() {
  const [items, setItems] = useState<RecursoRural[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [puntosNatural, setPuntosNatural] = useState<number | null>(null);
  // Ref al panel del formulario para hacer scroll automático cuando
  // el admin pulsa "Editar" en un recurso situado al final de la
  // página: sin esto el form aparece arriba (fuera de la vista) y
  // parece que el botón no hace nada.
  const formRef = useRef<HTMLDivElement | null>(null);

  // Form state — siempre asociación (puebloId null) desde aquí
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<string>('NATURAL');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radio, setRadio] = useState<number>(150);
  const [provincia, setProvincia] = useState('');
  const [comunidad, setComunidad] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [resItems, resReglas] = await Promise.all([
        fetch('/api/club/recursos-rurales', { cache: 'no-store' }),
        fetch('/api/club/admin/gamificacion', { cache: 'no-store' }),
      ]);
      if (resItems.ok) {
        const data = await resItems.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setError('Error cargando recursos rurales');
      }
      if (resReglas.ok) {
        const reglas: ReglaGamif[] = await resReglas.json();
        const r = reglas.find((x) => x.key === 'RECURSO_NATURAL_VISITADO' && x.activo);
        setPuntosNatural(r?.puntos ?? 0);
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setNombre('');
    setTipo('NATURAL');
    setDescripcion('');
    setFotoUrl(null);
    setLat(null);
    setLng(null);
    setRadio(150);
    setProvincia('');
    setComunidad('');
    setEditId(null);
    setError(null);
    setAviso(null);
  }

  function startCreateAsociacion() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(r: RecursoRural) {
    setEditId(r.id);
    setNombre(r.nombre);
    setTipo(r.tipo || 'NATURAL');
    setDescripcion(r.descripcion ?? '');
    setFotoUrl(r.fotoUrl ?? null);
    setLat(r.lat ?? null);
    setLng(r.lng ?? null);
    setRadio(r.geoRadioMetros ?? 150);
    setProvincia(r.provincia ?? '');
    setComunidad(r.comunidad ?? '');
    setShowForm(true);
    // Espera al siguiente tick para que React monte el panel antes
    // de scrollear. Sin requestAnimationFrame el ref aún es null.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleUploadFoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImageToR2(file, 'recursos-rurales');
      setFotoUrl(result.url);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function guardar() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (lat == null || lng == null) {
      setError('Marca la ubicación exacta del recurso en el mapa.');
      return;
    }
    setSaving(true);
    setError(null);
    setAviso(null);
    try {
      const payload: any = {
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || null,
        fotoUrl: fotoUrl || null,
        lat,
        lng,
        geoRadioMetros: radio,
        provincia: provincia.trim() || null,
        comunidad: comunidad.trim() || null,
      };
      const url = editId
        ? `/api/club/recursos-rurales/${editId}`
        : `/api/club/recursos-rurales/asociacion`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error guardando');
        return;
      }
      setAviso(editId ? 'Recurso actualizado.' : 'Recurso de la asociación creado.');
      setShowForm(false);
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(r: RecursoRural) {
    if (!confirm(`¿Eliminar "${r.nombre}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/club/recursos-rurales/${r.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error eliminando');
        return;
      }
      setAviso('Recurso eliminado.');
      await load();
    } catch {
      setError('Error de red');
    }
  }

  const itemsAsociacion = useMemo(() => items.filter((r) => r.scope === 'ASOCIACION'), [items]);
  const itemsPueblos = useMemo(() => items.filter((r) => r.scope === 'PUEBLO'), [items]);

  const pueblosAgrupados = useMemo(() => {
    const map = new Map<number, { nombre: string; slug: string | null; items: RecursoRural[] }>();
    for (const r of itemsPueblos) {
      const pid = r.puebloId ?? 0;
      if (!map.has(pid)) {
        map.set(pid, { nombre: r.puebloNombre ?? 'Sin pueblo', slug: r.puebloSlug, items: [] });
      }
      map.get(pid)!.items.push(r);
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [itemsPueblos]);

  const mapCenter: [number, number] = useMemo(() => {
    if (lat != null && lng != null) return [lat, lng];
    return [40.4168, -3.7038];
  }, [lat, lng]);

  const existingMarkers = useMemo(
    () =>
      items
        .filter((r) => r.lat != null && r.lng != null && r.id !== editId)
        .map((r) => ({
          lat: r.lat as number,
          lng: r.lng as number,
          label: r.nombre,
          color: r.scope === 'ASOCIACION' ? 'gold' : 'green',
        })),
    [items, editId],
  );

  return (
    <div>
      {/* Aviso de gamificación */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-3 text-sm text-fuchsia-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Cada visita validada por GPS suma{' '}
            <strong>{puntosNatural ?? '…'} puntos</strong> al socio del Club.
          </span>
        </div>
        <Link
          href="/gestion/asociacion/gamificacion"
          className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-fuchsia-800 hover:bg-white"
        >
          <Lock className="h-3 w-3" /> Configurar puntos
        </Link>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {aviso && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {aviso}
        </div>
      )}

      <div className="mb-3">
        {!showForm ? (
          <button
            type="button"
            onClick={startCreateAsociacion}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Añadir recurso de la asociación
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/30"
          >
            <X className="h-4 w-4" /> Cerrar formulario
          </button>
        )}
      </div>

      {showForm && (
        <div
          ref={formRef}
          className="mb-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4 sm:p-5"
        >
          <h3 className="mb-3 text-base font-semibold text-foreground">
            {editId ? 'Editar recurso rural/natural' : 'Nuevo recurso de la asociación (fuera de pueblos)'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Mirador del Valle del Tajo"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">Descripción</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cómo es, qué destaca, recomendaciones para el socio…"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Foto del recurso
              </label>
              <div className="mt-1 flex items-center gap-3">
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFoto(f);
                    }}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                    </>
                  ) : fotoUrl ? (
                    'Cambiar foto'
                  ) : (
                    'Subir foto'
                  )}
                </label>
                {fotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFotoUrl(null)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground">Provincia</label>
              <input
                type="text"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                placeholder="Cuenca"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Comunidad autónoma
              </label>
              <input
                type="text"
                value={comunidad}
                onChange={(e) => setComunidad(e.target.value)}
                placeholder="Castilla-La Mancha"
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Ubicación exacta
              </label>
              <div className="mt-1 overflow-hidden rounded-xl border border-border">
                <MapLocationPicker
                  center={mapCenter}
                  zoom={lat != null ? 14 : 6}
                  existingMarkers={existingMarkers}
                  selectedPosition={lat != null && lng != null ? { lat, lng } : null}
                  onLocationSelect={(la, ln) => {
                    setLat(la);
                    setLng(ln);
                  }}
                  height="420px"
                  searchPlaceholder="Buscar lugar (ej. Mirador del Tajo)…"
                  activeHint="Pulsa en el mapa o busca para fijar la ubicación exacta del recurso."
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {lat != null && lng != null ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono text-foreground">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </span>
                  </span>
                ) : (
                  <em className="text-amber-700">Sin marcar — obligatorio</em>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Radio de validación
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {RADIOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRadio(m)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                      radio === m
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-border bg-white text-foreground hover:border-emerald-300'
                    }`}
                  >
                    {m} m
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/30"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editId ? 'Guardar cambios' : 'Crear recurso de la asociación'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          Cargando recursos rurales/naturales…
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Recursos de la asociación{' '}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({itemsAsociacion.length})
              </span>
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Recursos sin pueblo asignado, fuera del mapa de la red. Solo
              admins pueden crearlos y editarlos.
            </p>
            {itemsAsociacion.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                Aún no hay recursos de la asociación. Pulsa{' '}
                <em>"Añadir recurso de la asociación"</em>.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {itemsAsociacion.map((r) => (
                  <CardRecurso
                    key={r.id}
                    r={r}
                    puntosNatural={puntosNatural}
                    onEdit={() => startEdit(r)}
                    onDelete={() => eliminar(r)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Recursos rurales por pueblo{' '}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({itemsPueblos.length} recursos en {pueblosAgrupados.length} pueblos)
              </span>
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Se crean por IA (activos directamente) o por los alcaldes. Aquí los
              admins los ven agrupados por pueblo para revisarlos o desactivarlos.
            </p>
            {pueblosAgrupados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                Aún no hay recursos rurales en ningún pueblo.
              </div>
            ) : (
              <div className="space-y-3">
                {pueblosAgrupados.map((grupo) => (
                  <PuebloGrupo
                    key={grupo.id}
                    grupo={grupo}
                    puntosNatural={puntosNatural}
                    onEdit={startEdit}
                    onDelete={eliminar}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function PuebloGrupo({
  grupo,
  puntosNatural,
  onEdit,
  onDelete,
}: {
  grupo: { id: number; nombre: string; slug: string | null; items: RecursoRural[] };
  puntosNatural: number | null;
  onEdit: (r: RecursoRural) => void;
  onDelete: (r: RecursoRural) => void;
}) {
  const [open, setOpen] = useState(false);
  const activos = grupo.items.filter((r) => r.activo).length;
  const inactivos = grupo.items.length - activos;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <Mountain className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-foreground">{grupo.nombre}</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            {activos} activo{activos !== 1 ? 's' : ''}
          </span>
          {inactivos > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {inactivos} inactivo{inactivos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border bg-muted/10 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {grupo.items.map((r) => (
              <CardRecurso
                key={r.id}
                r={r}
                puntosNatural={puntosNatural}
                onEdit={() => onEdit(r)}
                onDelete={() => onDelete(r)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CardRecurso({
  r,
  puntosNatural,
  onEdit,
  onDelete,
}: {
  r: RecursoRural;
  puntosNatural: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {r.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.fotoUrl} alt={r.nombre} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-300">
            <Mountain className="h-8 w-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">{r.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {r.tipo}
                {r.puebloNombre ? ` · ${r.puebloNombre}` : ' · Asociación'}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                r.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {r.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {r.descripcion && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.descripcion}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {r.lat != null && r.lng != null && (
              <span className="inline-flex items-center gap-1 font-mono">
                <MapPin className="h-3 w-3" />
                {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
              </span>
            )}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
              Radio {r.geoRadioMetros ?? 200} m
            </span>
            {puntosNatural != null && puntosNatural > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2 py-0.5 font-medium text-fuchsia-800">
                <Sparkles className="h-3 w-3" />+{puntosNatural} pts
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Editar
        </button>
      </div>
    </article>
  );
}
