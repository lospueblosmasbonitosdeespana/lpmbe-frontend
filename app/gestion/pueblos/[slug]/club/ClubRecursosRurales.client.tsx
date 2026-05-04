'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Info,
  Wifi,
} from 'lucide-react';
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
  puntosCustom?: number | null;
  puntosEfectivos?: number;
  puntosGenericos?: number;
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

export default function ClubRecursosRurales({
  puebloId,
  puebloLat,
  puebloLng,
  puebloNombre,
  esAdmin = false,
}: {
  puebloId: number;
  puebloLat: number | null;
  puebloLng: number | null;
  puebloNombre?: string;
  esAdmin?: boolean;
}) {
  const [items, setItems] = useState<RecursoRural[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [puntosNatural, setPuntosNatural] = useState<number | null>(null);

  // Puntos por recurso (solo admin)
  const [editandoPuntosId, setEditandoPuntosId] = useState<number | null>(null);
  const [editPuntosValor, setEditPuntosValor] = useState('');
  const [guardandoPuntos, setGuardandoPuntos] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<string>('NATURAL');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radio, setRadio] = useState<number>(150);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [resItems, resReglas] = await Promise.all([
        fetch(`/api/club/recursos-rurales?puebloId=${puebloId}&scope=PUEBLO`, {
          cache: 'no-store',
        }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puebloId]);

  function resetForm() {
    setNombre('');
    setTipo('NATURAL');
    setDescripcion('');
    setFotoUrl(null);
    setLat(null);
    setLng(null);
    setRadio(150);
    setEditId(null);
    setError(null);
    setAviso(null);
  }

  function startCreate() {
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
    setShowForm(true);
    setError(null);
    setAviso(null);
  }

  function cancelar() {
    setShowForm(false);
    resetForm();
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
      const payload = {
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || null,
        fotoUrl: fotoUrl || null,
        lat,
        lng,
        geoRadioMetros: radio,
      };
      const url = editId
        ? `/api/club/recursos-rurales/${editId}`
        : `/api/club/recursos-rurales/pueblo/${puebloId}`;
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
      setAviso(editId ? 'Recurso rural actualizado.' : 'Recurso rural creado.');
      setShowForm(false);
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(r: RecursoRural) {
    setError(null);
    try {
      const res = await fetch(`/api/club/recursos-rurales/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !r.activo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al cambiar estado');
        return;
      }
      await load();
    } catch {
      setError('Error de red');
    }
  }

  function startEditPuntos(r: RecursoRural) {
    setEditandoPuntosId(r.id);
    setEditPuntosValor(r.puntosCustom != null ? String(r.puntosCustom) : '');
  }

  async function handleGuardarPuntos(id: number, payload: { puntosCustom: number | null }) {
    setGuardandoPuntos(true);
    try {
      const res = await fetch(`/api/club/admin/recursos/${id}/puntos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'No se pudieron guardar los puntos.');
        return;
      }
      setEditandoPuntosId(null);
      setEditPuntosValor('');
      await load();
    } finally {
      setGuardandoPuntos(false);
    }
  }

  async function eliminar(r: RecursoRural) {
    if (!confirm(`¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`)) return;
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

  const mapCenter: [number, number] = useMemo(() => {
    if (lat != null && lng != null) return [lat, lng];
    if (puebloLat != null && puebloLng != null) return [puebloLat, puebloLng];
    return [40.4168, -3.7038]; // fallback España
  }, [lat, lng, puebloLat, puebloLng]);

  const existingMarkers = useMemo(
    () =>
      items
        .filter((r) => r.lat != null && r.lng != null && r.id !== editId)
        .map((r) => ({ lat: r.lat as number, lng: r.lng as number, label: r.nombre, color: 'green' })),
    [items, editId],
  );

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
          <Mountain className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Recursos rurales / naturales
          </h2>
          <p className="text-sm text-muted-foreground">
            Cascadas, miradores, parajes, dólmenes, ermitas en ruta… Lugares que
            no tienen QR físico.
          </p>
        </div>
      </div>

      {/* Caja explicativa siempre visible */}
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">
              Aquí no hay lectura de QR. La validación es por GPS.
            </p>
            <p className="text-emerald-900/85">
              El socio del Club abre la app, llega al recurso y pulsa{' '}
              <strong>"Estoy aquí"</strong>. La app envía sus coordenadas y, si
              está dentro del radio que configures, se le suma una visita y los
              puntos de gamificación. Por eso es <strong>imprescindible</strong>{' '}
              que marques la ubicación con la mayor precisión posible.
            </p>
          </div>
        </div>
      </div>

      {/* Cobertura: la pregunta del millón */}
      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900">
        <div className="flex items-start gap-2">
          <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p>
              <strong>¿Funciona sin cobertura?</strong> El GPS del móvil sí
              funciona sin datos (es señal por satélite, igual que en montaña).
              El paso de "registrar la visita" sí necesita conexión a internet
              para enviarla a nuestros servidores. En la app, si el socio se
              queda sin cobertura, lo avisamos y le proponemos reintentar al
              recuperar señal.
            </p>
          </div>
        </div>
      </div>

      {/* Aviso de gamificación */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-3 text-sm text-fuchsia-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Cada visita validada por GPS suma{' '}
            <strong>{puntosNatural ?? '…'} puntos</strong> al socio del Club.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-fuchsia-800">
          <Lock className="h-3 w-3" />
          Solo el admin de la asociación puede cambiar este valor
        </span>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
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
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> Añadir Recurso Rural / Natural
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelar}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/30"
          >
            <X className="h-4 w-4" /> Cerrar formulario
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4 sm:p-5">
          <h3 className="mb-3 text-base font-semibold text-foreground">
            {editId ? 'Editar recurso rural/natural' : 'Nuevo recurso rural/natural'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Nombre del recurso
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Cascada de la Cimbarra"
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
              <label className="block text-xs font-medium text-muted-foreground">
                Descripción
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cómo es, qué destaca, recomendaciones…"
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

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Ubicación exacta · haz clic en el mapa para situarla
              </label>
              <div className="mt-1 overflow-hidden rounded-xl border border-border">
                <MapLocationPicker
                  center={mapCenter}
                  zoom={lat != null ? 15 : 13}
                  existingMarkers={existingMarkers}
                  selectedPosition={lat != null && lng != null ? { lat, lng } : null}
                  onLocationSelect={(la, ln) => {
                    setLat(la);
                    setLng(ln);
                  }}
                  height="380px"
                  searchPlaceholder="Buscar (ej. Cascada de la Cimbarra)…"
                  activeHint="Pulsa en el mapa o busca una dirección para fijar la ubicación exacta del recurso."
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lat != null && lng != null ? (
                    <>
                      <span className="font-mono text-foreground">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </span>
                    </>
                  ) : (
                    <em className="text-amber-700">Sin marcar — obligatorio</em>
                  )}
                </span>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Radio de validación (en metros)
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
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Cuanto más estricto, más fiable</strong>. Recomendaciones:
                50–100 m si el sitio está aislado al aire libre · 150–200 m para
                la mayoría de casos · 300–400 m solo si es un paraje muy amplio.
                Por debajo de 50 m algunos socios pueden frustrarse en días
                nublados o bajo árboles.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelar}
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
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editId ? 'Guardar cambios' : 'Crear recurso'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          Cargando recursos rurales…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          Aún no hay recursos rurales/naturales{puebloNombre ? ` en ${puebloNombre}` : ''}. Pulsa{' '}
          <em>"Añadir Recurso Rural / Natural"</em> para crear el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {r.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.fotoUrl}
                    alt={r.nombre}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-300">
                    <Mountain className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {r.nombre}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.tipo}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.activo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {r.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {r.descripcion}
                    </p>
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleActivo(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
                >
                  {r.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(r)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
                {r.slug && (
                  <a
                    href={`/recursos/${r.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Ver en web ↗
                  </a>
                )}
                <a
                  href={`/gestion/asociacion/club/metricas/${puebloId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  Métricas
                </a>
                {esAdmin ? (
                  <button
                    type="button"
                    onClick={() => startEditPuntos(r)}
                    className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-300 bg-white px-3 py-1.5 text-xs font-medium text-fuchsia-700 hover:bg-fuchsia-50"
                    title="Cambiar los puntos del Club que otorga este recurso"
                  >
                    <Sparkles className="h-3 w-3" />
                    Puntos
                  </button>
                ) : (r.puntosEfectivos ?? 0) > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
                    title="Solo el admin de la asociación puede modificar los puntos"
                  >
                    <Lock className="h-3 w-3" />
                    Puntos: solo admin
                  </span>
                ) : null}
              </div>
              {esAdmin && editandoPuntosId === r.id && (
                <div className="mt-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50/40 p-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs font-semibold text-fuchsia-900 mb-1">
                        Puntos del Club al validar este recurso
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder={`gen: ${r.puntosGenericos ?? puntosNatural ?? 0}`}
                        value={editPuntosValor}
                        onChange={(e) => setEditPuntosValor(e.target.value)}
                        className="w-full rounded border border-fuchsia-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                        autoFocus
                      />
                      <p className="mt-1 text-[11px] text-fuchsia-800/80">
                        Deja vacío para usar el genérico ({r.puntosGenericos ?? puntosNatural ?? 0} pts).
                        {r.puntosCustom != null ? ' Ahora tiene valor personalizado.' : ' Ahora hereda el genérico.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditandoPuntosId(null); setEditPuntosValor(''); }}
                        disabled={guardandoPuntos}
                        className="rounded border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/30"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={guardandoPuntos}
                        onClick={() => {
                          const t = editPuntosValor.trim();
                          const payload = t === '' ? { puntosCustom: null } : { puntosCustom: parseInt(t, 10) };
                          if (t !== '' && (Number.isNaN((payload as any).puntosCustom) || (payload as any).puntosCustom < 0)) {
                            alert('Introduce un entero ≥ 0, o vacío para el valor genérico.');
                            return;
                          }
                          handleGuardarPuntos(r.id, payload);
                        }}
                        className="rounded bg-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"
                      >
                        {guardandoPuntos ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
