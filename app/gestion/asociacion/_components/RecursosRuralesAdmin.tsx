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
  Search,
  ChevronDown,
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
  localidad: string | null;
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

  async function togglePublicar(r: RecursoRural) {
    const queremosActivar = !r.activo;
    if (
      !confirm(
        queremosActivar
          ? `¿Activar y publicar en la web "${r.nombre}"?\n\nSe generarán slug y traducciones a 7 idiomas si faltan.`
          : `¿Desactivar "${r.nombre}"? Dejará de aparecer en la web pública.`,
      )
    ) {
      return;
    }
    setError(null);
    setAviso(null);
    try {
      const res = await fetch(`/api/club/recursos-rurales/${r.id}/publicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: queremosActivar }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al publicar');
        return;
      }
      setAviso(
        queremosActivar
          ? `"${r.nombre}" publicado en la web.`
          : `"${r.nombre}" desactivado.`,
      );
      await load();
    } catch {
      setError('Error de red');
    }
  }

  const itemsAsociacion = useMemo(() => items.filter((r) => r.scope === 'ASOCIACION'), [items]);

  // Agrupación jerárquica: CCAA → Provincia → Pueblo
  const grouped = useMemo(() => {
    type PuebloGroup = { nombre: string; slug: string | null; items: RecursoRural[] };
    type ProvGroup = { pueblos: Map<string, PuebloGroup> };
    type CcaaGroup = { provincias: Map<string, ProvGroup> };

    const ccaaMap = new Map<string, CcaaGroup>();

    for (const r of items) {
      const ccaa = r.comunidad?.trim() || 'Sin comunidad';
      const prov = r.provincia?.trim() || 'Sin provincia';
      const puebloKey =
        r.scope === 'ASOCIACION'
          ? '__ASOCIACION__'
          : String(r.puebloId ?? r.puebloNombre ?? '__NONE__');
      const puebloNombre = r.scope === 'ASOCIACION' ? '🏛 Asociación' : (r.puebloNombre ?? 'Sin pueblo');

      if (!ccaaMap.has(ccaa)) ccaaMap.set(ccaa, { provincias: new Map() });
      const cg = ccaaMap.get(ccaa)!;
      if (!cg.provincias.has(prov)) cg.provincias.set(prov, { pueblos: new Map() });
      const pg = cg.provincias.get(prov)!;
      if (!pg.pueblos.has(puebloKey))
        pg.pueblos.set(puebloKey, { nombre: puebloNombre, slug: r.puebloSlug, items: [] });
      pg.pueblos.get(puebloKey)!.items.push(r);
    }

    // Ordenar: CCAA → Provincia → Pueblo
    return Array.from(ccaaMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([ccaa, cg]) => ({
        ccaa,
        total: Array.from(cg.provincias.values()).reduce(
          (s, p) => s + Array.from(p.pueblos.values()).reduce((ss, pu) => ss + pu.items.length, 0),
          0,
        ),
        activos: Array.from(cg.provincias.values()).reduce(
          (s, p) =>
            s +
            Array.from(p.pueblos.values()).reduce(
              (ss, pu) => ss + pu.items.filter((i) => i.activo).length,
              0,
            ),
          0,
        ),
        provincias: Array.from(cg.provincias.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'es'))
          .map(([prov, pg]) => ({
            prov,
            total: Array.from(pg.pueblos.values()).reduce((s, pu) => s + pu.items.length, 0),
            activos: Array.from(pg.pueblos.values()).reduce(
              (s, pu) => s + pu.items.filter((i) => i.activo).length,
              0,
            ),
            pueblos: Array.from(pg.pueblos.entries())
              .sort(([keyA, a], [keyB, b]) => {
                // Asociación siempre primero
                if (keyA === '__ASOCIACION__') return -1;
                if (keyB === '__ASOCIACION__') return 1;
                return a.nombre.localeCompare(b.nombre, 'es');
              })
              .map(([, g]) => g),
          })),
      }));
  }, [items]);

  const [searchText, setSearchText] = useState('');
  const [openCcaas, setOpenCcaas] = useState<Set<string>>(new Set());
  const [openProvs, setOpenProvs] = useState<Set<string>>(new Set());

  const toggleCcaa = (ccaa: string) =>
    setOpenCcaas((prev) => {
      const n = new Set(prev);
      n.has(ccaa) ? n.delete(ccaa) : n.add(ccaa);
      return n;
    });

  const toggleProv = (key: string) =>
    setOpenProvs((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const filteredGrouped = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return grouped;
    return grouped
      .map((cg) => ({
        ...cg,
        provincias: cg.provincias
          .map((pg) => ({
            ...pg,
            pueblos: pg.pueblos
              .map((pu) => ({
                ...pu,
                items: pu.items.filter(
                  (r) =>
                    r.nombre.toLowerCase().includes(q) ||
                    (r.tipo || '').toLowerCase().includes(q) ||
                    (r.descripcion || '').toLowerCase().includes(q) ||
                    pu.nombre.toLowerCase().includes(q),
                ),
              }))
              .filter((pu) => pu.items.length > 0),
          }))
          .filter((pg) => pg.pueblos.length > 0),
      }))
      .filter((cg) => cg.provincias.length > 0);
  }, [grouped, searchText]);

  const pueblosAgrupados = useMemo(() => {
    const map = new Map<number, { nombre: string; slug: string | null; items: RecursoRural[] }>();
    for (const r of items.filter((r) => r.scope === 'PUEBLO')) {
      const pid = r.puebloId ?? 0;
      if (!map.has(pid)) {
        map.set(pid, { nombre: r.puebloNombre ?? 'Sin pueblo', slug: r.puebloSlug, items: [] });
      }
      map.get(pid)!.items.push(r);
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [items]);

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
          {/* Resumen global */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {items.length} recursos en total
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
              {items.filter((r) => r.activo).length} activos
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
              {items.filter((r) => !r.activo).length} inactivos
            </span>
            <span className="text-xs text-muted-foreground">
              {grouped.length} CCAA · {grouped.reduce((s, c) => s + c.provincias.length, 0)} provincias
            </span>
          </div>

          {/* Buscador */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por nombre, tipo, descripción o pueblo…"
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Acciones de expansión */}
          <div className="mb-3 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setOpenCcaas(new Set(grouped.map((c) => c.ccaa)));
                setOpenProvs(
                  new Set(grouped.flatMap((c) => c.provincias.map((p) => `${c.ccaa}|${p.prov}`))),
                );
              }}
              className="text-xs text-primary underline"
            >
              Expandir todo
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenCcaas(new Set());
                setOpenProvs(new Set());
              }}
              className="text-xs text-muted-foreground underline"
            >
              Colapsar todo
            </button>
          </div>

          {filteredGrouped.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              {searchText ? `Sin resultados para "${searchText}"` : 'Aún no hay recursos rurales.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGrouped.map((cg) => {
                const ccaaOpen = openCcaas.has(cg.ccaa) || searchText.length > 0;
                return (
                  <div
                    key={cg.ccaa}
                    className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                  >
                    {/* Cabecera CCAA */}
                    <button
                      type="button"
                      onClick={() => toggleCcaa(cg.ccaa)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{cg.ccaa}</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          {cg.activos} activo{cg.activos !== 1 ? 's' : ''}
                        </span>
                        {cg.total - cg.activos > 0 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {cg.total - cg.activos} inactivo{cg.total - cg.activos !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          · {cg.provincias.length} prov.
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${ccaaOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {ccaaOpen && (
                      <div className="border-t border-border bg-muted/5 px-3 pb-3 pt-2 space-y-2">
                        {cg.provincias.map((pg) => {
                          const provKey = `${cg.ccaa}|${pg.prov}`;
                          const provOpen = openProvs.has(provKey) || searchText.length > 0;
                          return (
                            <div
                              key={pg.prov}
                              className="overflow-hidden rounded-xl border border-border bg-white"
                            >
                              {/* Cabecera Provincia */}
                              <button
                                type="button"
                                onClick={() => toggleProv(provKey)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                  <span className="text-sm font-semibold text-foreground">
                                    {pg.prov}
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {pg.activos}✓
                                  </span>
                                  {pg.total - pg.activos > 0 && (
                                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                      {pg.total - pg.activos}✗
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    · {pg.pueblos.length} pueblo{pg.pueblos.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${provOpen ? 'rotate-180' : ''}`}
                                />
                              </button>

                              {provOpen && (
                                <div className="border-t border-border bg-muted/5 p-2 space-y-3">
                                  {pg.pueblos.map((pueblo) => {
                                    const esAsociacion = pueblo.nombre === '🏛 Asociación';
                                    return (
                                    <div key={pueblo.nombre}>
                                      {/* Cabecera de grupo: diferencia visualmente Asociación vs Pueblo */}
                                      {esAsociacion ? (
                                        <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1">
                                          <span className="text-sm">🏛</span>
                                          <span className="text-xs font-bold text-amber-800">
                                            Recursos de la Asociación
                                          </span>
                                          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                            {pueblo.items.length} recurso{pueblo.items.length !== 1 ? 's' : ''}
                                          </span>
                                          <span className="ml-auto text-[10px] text-amber-600 italic">
                                            Sin pueblo · Nivel nacional
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="mb-1.5 flex items-center gap-2 px-1">
                                          <Mountain className="h-3.5 w-3.5 text-emerald-600" />
                                          {pueblo.slug ? (
                                            <a
                                              href={`/gestion/alcalde/${pueblo.slug}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs font-bold text-emerald-700 hover:underline"
                                            >
                                              {pueblo.nombre}
                                            </a>
                                          ) : (
                                            <span className="text-xs font-bold text-foreground">
                                              {pueblo.nombre}
                                            </span>
                                          )}
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                            {pueblo.items.length} recurso{pueblo.items.length !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      )}
                                      <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${esAsociacion ? 'rounded-lg border border-amber-100 bg-amber-50/40 p-2' : ''}`}>
                                        {pueblo.items.map((r) => (
                                          <CardRecurso
                                            key={r.id}
                                            r={r}
                                            puntosNatural={puntosNatural}
                                            onEdit={() => startEdit(r)}
                                            onDelete={() => eliminar(r)}
                                            onTogglePublicar={
                                              r.scope === 'ASOCIACION'
                                                ? () => togglePublicar(r)
                                                : undefined
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


function CardRecurso({
  r,
  puntosNatural,
  onEdit,
  onDelete,
  onTogglePublicar,
}: {
  r: RecursoRural;
  puntosNatural: number | null;
  onEdit: () => void;
  onDelete: () => void;
  /** Botón de publicar/despublicar. Solo se muestra si se pasa la prop. */
  onTogglePublicar?: () => void;
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{r.nombre}</span>
                {r.scope === 'ASOCIACION' ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    🏛 Asociación
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    🏘 Pueblo
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.tipo}
                {r.puebloNombre ? ` · ${r.puebloNombre}` : r.scope === 'ASOCIACION' ? ` · ${r.localidad ?? r.provincia ?? ''}` : ''}
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
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
        {onTogglePublicar && (
          <button
            type="button"
            onClick={onTogglePublicar}
            className={
              r.activo
                ? 'inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50'
                : 'inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600'
            }
            title={
              r.activo
                ? 'Quitar de la web pública'
                : 'Activar y publicar en la web (genera slug y 7 idiomas si faltan)'
            }
          >
            {r.activo ? 'Desactivar' : 'Activar y publicar'}
          </button>
        )}
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
