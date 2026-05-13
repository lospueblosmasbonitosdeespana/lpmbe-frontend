'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Trash2,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Euro,
  Star,
  MapPin,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';
import FotoLightbox from '../../../../_components/FotoLightbox';
import R2ImageUploader from '@/app/components/R2ImageUploader';
import MapLocationPicker from '@/app/components/MapLocationPicker';

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
  codigoQr: string | null;
  provincia: string | null;
  comunidad: string | null;
  localidad: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  horarios: string | null;
  precioCents: number | null;
  descuentoPorcentaje: number | null;
  precargadoFuente: string | null;
  precargadoPorIa: boolean | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  regaloActivo?: boolean | null;
  regaloTitulo?: string | null;
  regaloDescripcion?: string | null;
  regaloCondiciones?: string | null;
};

const TIPOS_RRTT = [
  'museo',
  'museo-parroquial',
  'museo-arqueologico',
  'casa-museo',
  'iglesia',
  'ermita',
  'monasterio',
  'cartuja',
  'abadia',
  'convento',
  'castillo',
  'fortaleza',
  'palacio',
  'claustro',
  'cripta',
  'molino',
  'molino-harinero',
  'almazara',
  'bodega',
  'biblioteca',
  'archivo',
  'coleccion',
  'centro-interpretacion',
  'centro-oficios',
  'yacimiento',
  'monumento',
  'otro',
];

export default function EditarRrttClient({ recursoId }: { recursoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [original, setOriginal] = useState<Recurso | null>(null);

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [comunidad, setComunidad] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [web, setWeb] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [horarios, setHorarios] = useState('');
  const [precioEur, setPrecioEur] = useState<string>('');
  const [descuento, setDescuento] = useState<string>('');
  const [activo, setActivo] = useState(false);
  const [cerradoTemporal, setCerradoTemporal] = useState(false);
  const [regaloActivo, setRegaloActivo] = useState(false);
  const [regaloTitulo, setRegaloTitulo] = useState('');
  const [regaloDescripcion, setRegaloDescripcion] = useState('');
  const [regaloCondiciones, setRegaloCondiciones] = useState('');

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
      setTipo(r.tipo ?? 'otro');
      setDescripcion(r.descripcion ?? '');
      setFotoUrl(r.fotoUrl ?? '');
      setLocalidad(r.localidad ?? '');
      setProvincia(r.provincia ?? '');
      setComunidad(r.comunidad ?? '');
      setLat(r.lat != null ? String(r.lat) : '');
      setLng(r.lng != null ? String(r.lng) : '');
      setTelefono(r.telefono ?? '');
      setEmail(r.email ?? '');
      setWeb(r.web ?? '');
      setWhatsapp(r.whatsapp ?? '');
      setBookingUrl(r.bookingUrl ?? '');
      setHorarios(r.horarios ?? '');
      setPrecioEur(
        r.precioCents != null
          ? (r.precioCents / 100).toFixed(2).replace('.', ',')
          : '',
      );
      setDescuento(
        r.descuentoPorcentaje != null ? String(r.descuentoPorcentaje) : '',
      );
      setActivo(!!r.activo);
      setCerradoTemporal(!!r.cerradoTemporal);
      setRegaloActivo(!!r.regaloActivo);
      setRegaloTitulo(r.regaloTitulo ?? '');
      setRegaloDescripcion(r.regaloDescripcion ?? '');
      setRegaloCondiciones(r.regaloCondiciones ?? '');
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

    const precioCents = (() => {
      if (precioEur.trim() === '') return null;
      const n = Number(precioEur.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.round(n * 100);
    })();

    const descuentoNum = (() => {
      if (descuento.trim() === '') return null;
      const n = Number(descuento);
      if (!Number.isFinite(n)) return null;
      return Math.max(0, Math.min(100, Math.round(n)));
    })();

    const latNum = lat.trim() === '' ? null : Number(lat.replace(',', '.'));
    const lngNum = lng.trim() === '' ? null : Number(lng.replace(',', '.'));

    const payload: Record<string, any> = {
      nombre: nombre.trim(),
      tipo: tipo.trim() || 'otro',
      descripcion: descripcion.trim() || null,
      fotoUrl: fotoUrl.trim() || null,
      localidad: localidad.trim() || null,
      provincia: provincia.trim() || null,
      comunidad: comunidad.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      web: web.trim() || null,
      whatsapp: whatsapp.trim() || null,
      bookingUrl: bookingUrl.trim() || null,
      horarios: horarios.trim() || null,
      precioCents,
      descuentoPorcentaje: descuentoNum,
      activo,
      cerradoTemporal,
      regaloActivo,
      regaloTitulo: regaloTitulo.trim() || null,
      regaloDescripcion: regaloDescripcion.trim() || null,
      regaloCondiciones: regaloCondiciones.trim() || null,
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
      router.push('/gestion/asociacion/club/rrtt-asociacion');
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

  const latNum = Number(lat.replace(',', '.'));
  const lngNum = Number(lng.replace(',', '.'));
  const tieneCoords =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    lat.trim() !== '' &&
    lng.trim() !== '';

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

      {/* Header con badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
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
          {original.imprescindible && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              <Star className="h-3 w-3" />
              Imprescindible
            </span>
          )}
          {ratingTexto && (
            <span className="font-mono text-xs text-amber-900">
              {ratingTexto}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/gestion/asociacion/club/rrtt-asociacion')}
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
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Datos básicos */}
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
              {TIPOS_RRTT.map((t) => (
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

      {/* Foto */}
      <Section titulo="Foto principal" icon={<ImageIcon className="h-4 w-4" />}>
        <R2ImageUploader
          label=""
          value={fotoUrl || null}
          onChange={(url) => setFotoUrl(url ?? '')}
          folder="recursos-rurales/asociacion-rrtt"
          previewHeight="h-56"
        />
        <p className="text-[11px] text-muted-foreground">
          Sube una foto desde tu equipo (JPG, PNG, WebP). Se comprime
          automáticamente y se almacena en Cloudflare R2.
        </p>
        {fotoUrl && (
          <button
            type="button"
            onClick={() => setLightbox(fotoUrl)}
            className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50"
            title="Ver foto en grande"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Ver foto en grande
          </button>
        )}
      </Section>

      {/* Ubicación */}
      <Section titulo="Ubicación" icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Localidad">
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
        <div className="mt-2">
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            Haz clic en el mapa o arrastra el marcador rojo para reubicar el
            recurso. Las coordenadas se actualizan automáticamente.
          </p>
          <MapLocationPicker
            center={tieneCoords ? [latNum, lngNum] : [40.4168, -3.7038]}
            zoom={tieneCoords ? 14 : 6}
            selectedPosition={tieneCoords ? { lat: latNum, lng: lngNum } : null}
            onLocationSelect={(la, ln) => {
              setLat(String(la));
              setLng(String(ln));
            }}
            height="360px"
            searchPlaceholder="Buscar lugar (ej: Castillo de Loarre)…"
          />
        </div>
      </Section>

      {/* Contacto */}
      <Section titulo="Contacto">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Teléfono" icon={<Phone className="h-3.5 w-3.5 text-amber-600" />}>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="WhatsApp">
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email" icon={<Mail className="h-3.5 w-3.5 text-amber-600" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Web" icon={<Globe className="h-3.5 w-3.5 text-amber-600" />}>
            <input
              type="url"
              value={web}
              onChange={(e) => setWeb(e.target.value)}
              placeholder="https://…"
              className="input"
            />
          </Field>
          <Field label="URL de reservas (Booking, GetYourGuide…)">
            <input
              type="url"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </Section>

      {/* Horarios y precio */}
      <Section titulo="Horarios y precio">
        <Field label="Horarios (texto libre)">
          <textarea
            value={horarios}
            onChange={(e) => setHorarios(e.target.value)}
            rows={3}
            placeholder="Mar-Dom 10:00-14:00, 16:00-19:00 · Lun cerrado"
            className="input"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Precio entrada (€)" icon={<Euro className="h-3.5 w-3.5 text-amber-600" />}>
            <input
              type="text"
              inputMode="decimal"
              value={precioEur}
              onChange={(e) => setPrecioEur(e.target.value)}
              placeholder="ej. 6,00"
              className="input"
            />
          </Field>
          <Field label="Descuento Club (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </Section>

      {/* Estado */}
      <Section titulo="Estado y publicación">
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
                Se muestra como "no disponible" sin desactivar.
              </div>
            </div>
          </label>
        </div>
      </Section>

      {/* Regalo */}
      <Section titulo="Regalo del Club (opcional)">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={regaloActivo}
            onChange={(e) => setRegaloActivo(e.target.checked)}
            className="h-4 w-4"
          />
          Regalo activo
        </label>
        {regaloActivo && (
          <div className="mt-2 space-y-3">
            <Field label="Título del regalo">
              <input
                type="text"
                value={regaloTitulo}
                onChange={(e) => setRegaloTitulo(e.target.value)}
                placeholder="ej. Postal antigua firmada"
                className="input"
              />
            </Field>
            <Field label="Descripción">
              <textarea
                value={regaloDescripcion}
                onChange={(e) => setRegaloDescripcion(e.target.value)}
                rows={2}
                className="input"
              />
            </Field>
            <Field label="Condiciones">
              <textarea
                value={regaloCondiciones}
                onChange={(e) => setRegaloCondiciones(e.target.value)}
                rows={2}
                placeholder="ej. Un regalo por reserva. Hasta agotar existencias."
                className="input"
              />
            </Field>
          </div>
        )}
      </Section>

      {/* Footer acciones */}
      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-end gap-2 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-4px_8px_rgba(0,0,0,0.04)] backdrop-blur">
        <button
          type="button"
          onClick={() => router.push('/gestion/asociacion/club/rrtt-asociacion')}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
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
          border-color: rgb(245 158 11);
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
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
