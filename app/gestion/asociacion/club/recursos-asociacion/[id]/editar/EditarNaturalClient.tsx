'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  ArrowLeft,
  Star,
  MapPin,
  Image as ImageIcon,
  Compass,
} from 'lucide-react';
import FotoLightbox from '../../../../_components/FotoLightbox';

type Recurso = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: string;
  activo: boolean;
  cerradoTemporal?: boolean | null;
  descripcion: string | null;
  fotoUrl: string | null;
  validacionTipo: string;
  geoRadioMetros?: number | null;
  provincia: string | null;
  comunidad: string | null;
  localidad: string | null;
  lat: number | null;
  lng: number | null;
  horarios: string | null;
  precargadoFuente: string | null;
  precargadoPorIa: boolean | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
};

const TIPOS_NATURAL = [
  'paraje',
  'natural',
  'cascada',
  'mirador',
  'ruta_corta',
  'sendero',
  'cueva',
  'garganta',
  'hoces',
  'laguna',
  'lago',
  'pantano',
  'rio',
  'valle',
  'cumbre',
  'pico',
  'parque-natural',
  'monumento-natural',
  'espacio-natural',
  'otro',
];

export default function EditarNaturalClient({ recursoId }: { recursoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [original, setOriginal] = useState<Recurso | null>(null);

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [comunidad, setComunidad] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [horarios, setHorarios] = useState('');
  const [activo, setActivo] = useState(false);
  const [cerradoTemporal, setCerradoTemporal] = useState(false);

  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursoId]);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/club/recursos/asociacion/${recursoId}`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error cargando el recurso');
        return;
      }
      const r: Recurso = await res.json();
      setOriginal(r);
      setNombre(r.nombre ?? '');
      setTipo((r.tipo ?? 'paraje').toLowerCase());
      setDescripcion(r.descripcion ?? '');
      setFotoUrl(r.fotoUrl ?? '');
      setLocalidad(r.localidad ?? '');
      setProvincia(r.provincia ?? '');
      setComunidad(r.comunidad ?? '');
      setLat(r.lat != null ? String(r.lat) : '');
      setLng(r.lng != null ? String(r.lng) : '');
      setHorarios(r.horarios ?? '');
      setActivo(!!r.activo);
      setCerradoTemporal(!!r.cerradoTemporal);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  const ratingTexto = useMemo(() => {
    if (!original?.precargadoFuente) return null;
    const f = original.precargadoFuente;
    const m = f.match(/google-places\[([\d.]+)\/(\d+)\]/);
    if (m) return `Google Places: ${m[1]}★ · ${m[2]} reseñas`;
    const m2 = f.match(/perplexity-only\[([\d.]+)\]/);
    if (m2) return `Perplexity (sin verificar Google): ${m2[1]}★`;
    return null;
  }, [original?.precargadoFuente]);

  async function guardar() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError(null);
    setAviso(null);
    setSaving(true);

    const latNum = lat.trim() === '' ? null : Number(lat.replace(',', '.'));
    const lngNum = lng.trim() === '' ? null : Number(lng.replace(',', '.'));

    const payload: Record<string, any> = {
      nombre: nombre.trim(),
      tipo: tipo.trim() || 'paraje',
      descripcion: descripcion.trim() || null,
      fotoUrl: fotoUrl.trim() || null,
      localidad: localidad.trim() || null,
      provincia: provincia.trim() || null,
      comunidad: comunidad.trim() || null,
      horarios: horarios.trim() || null,
      activo,
      cerradoTemporal,
    };
    if (latNum != null && Number.isFinite(latNum)) payload.lat = latNum;
    if (lngNum != null && Number.isFinite(lngNum)) payload.lng = lngNum;

    try {
      const res = await fetch(
        `/api/club/recursos/asociacion/${recursoId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (Array.isArray(data?.message)
            ? data.message.join(' · ')
            : data?.message) ?? 'Error al guardar',
        );
        return;
      }
      setAviso('Cambios guardados.');
      await cargar();
    } catch {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  }

  async function borrar() {
    if (
      !confirm(
        `¿Borrar definitivamente "${original?.nombre ?? 'este recurso'}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/club/recursos/asociacion/${recursoId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al borrar');
        setSaving(false);
        return;
      }
      router.push('/gestion/asociacion/club/recursos-asociacion');
    } catch {
      setError('Error de red');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Cargando recurso…
      </div>
    );
  }
  if (!original) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error ?? 'No se ha podido cargar el recurso.'}
      </div>
    );
  }

  const mapSrc =
    Number.isFinite(Number(lat.replace(',', '.'))) &&
    Number.isFinite(Number(lng.replace(',', '.'))) &&
    lat.trim() !== '' &&
    lng.trim() !== ''
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${lat.replace(',', '.')},${lng.replace(',', '.')}`,
        )}&z=14&output=embed`
      : null;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}
      {aviso && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {aviso}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
              original.activo
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {original.activo ? 'Activo' : 'Inactivo'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <Compass className="h-3 w-3" />
            Validación GEO
            {original.geoRadioMetros ? ` · ${original.geoRadioMetros} m` : ''}
          </span>
          {original.imprescindible && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              <Star className="h-3 w-3" />
              Imprescindible
            </span>
          )}
          {ratingTexto && (
            <span className="font-mono text-xs text-emerald-900">
              {ratingTexto}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/gestion/asociacion/club/recursos-asociacion')}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </button>
          <button
            type="button"
            onClick={borrar}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Borrar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <Section titulo="Datos básicos">
        <Field label="Nombre" required>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="input"
            >
              {TIPOS_NATURAL.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Slug (solo lectura)">
            <input
              type="text"
              value={original.slug ?? ''}
              readOnly
              className="input bg-slate-50 text-slate-500"
            />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="input"
          />
        </Field>
      </Section>

      <Section titulo="Foto principal" icon={<ImageIcon className="h-4 w-4" />}>
        <Field label="URL de la foto">
          <input
            type="url"
            value={fotoUrl}
            onChange={(e) => setFotoUrl(e.target.value)}
            placeholder="https://…"
            className="input"
          />
        </Field>
        {fotoUrl && (
          <div className="mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt="Preview"
              onClick={() => setLightbox(fotoUrl)}
              className="h-40 w-full max-w-md cursor-zoom-in rounded-lg border border-border object-cover transition hover:ring-2 hover:ring-emerald-300"
              title="Ver foto en grande"
            />
          </div>
        )}
      </Section>

      <Section titulo="Ubicación" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Localidad / comarca">
            <input
              type="text"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Provincia">
            <input
              type="text"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Comunidad autónoma">
            <input
              type="text"
              value={comunidad}
              onChange={(e) => setComunidad(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Latitud">
            <input
              type="text"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="ej. 36.9876"
              className="input"
            />
          </Field>
          <Field label="Longitud">
            <input
              type="text"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="ej. -2.4576"
              className="input"
            />
          </Field>
        </div>
        {mapSrc && (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <iframe
              src={mapSrc}
              width="100%"
              height="240"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa"
              className="block"
            />
          </div>
        )}
      </Section>

      <Section titulo="Horarios y estado">
        <Field label="Horarios / observaciones (texto libre)">
          <textarea
            value={horarios}
            onChange={(e) => setHorarios(e.target.value)}
            rows={3}
            placeholder="Acceso libre todo el año. Mejor primavera. Aparcamiento a 200 m."
            className="input"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white p-3 text-sm hover:bg-slate-50">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <div className="font-semibold">Activo en la web pública</div>
              <div className="text-xs text-muted-foreground">
                Aparece en listados públicos y app del Club.
              </div>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white p-3 text-sm hover:bg-slate-50">
            <input
              type="checkbox"
              checked={cerradoTemporal}
              onChange={(e) => setCerradoTemporal(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <div className="font-semibold">Cerrado temporalmente</div>
              <div className="text-xs text-muted-foreground">
                Por obras, restricción ambiental, etc.
              </div>
            </div>
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-end gap-2 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-4px_8px_rgba(0,0,0,0.04)] backdrop-blur">
        <button
          type="button"
          onClick={() => router.push('/gestion/asociacion/club/recursos-asociacion')}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid hsl(var(--border));
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          outline: none;
        }
        .input:focus {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
      `}</style>

      {lightbox && (
        <FotoLightbox
          src={lightbox}
          alt={nombre}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function Section({
  titulo,
  icon,
  children,
}: {
  titulo: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        {icon}
        {titulo}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}
