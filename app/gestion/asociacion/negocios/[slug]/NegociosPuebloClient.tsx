'use client';

import { useCallback, useEffect, useState } from 'react';
import NegocioGallery from './NegocioGallery';
import NegocioOfertas from './NegocioOfertas';
import NegocioStats from './NegocioStats';
import NegocioRrssPanel from './NegocioRrssPanel';
import MejorarPlanModal from './MejorarPlanModal';
import MapLocationPicker from '@/app/components/MapLocationPicker';
import { SERVICIOS_DISPONIBLES, SOCIAL_NETWORKS, getPlanFeatures, type PlanNegocio } from '@/lib/plan-features';
import { QrCartelModal } from '@/app/_components/club/QrCartelModal';

const TIPOS_NEGOCIO = [
  'HOTEL',
  'CASA_RURAL',
  'RESTAURANTE',
  'BAR',
  'COMERCIO',
  'TIENDA_ARTESANIA',
  'BODEGA',
  'EXPERIENCIA',
  'OTRO',
] as const;

const TIPO_LABELS: Record<string, string> = {
  HOTEL: 'Hotel',
  CASA_RURAL: 'Casa rural',
  RESTAURANTE: 'Restaurante',
  BAR: 'Bar / Cafetería',
  COMERCIO: 'Comercio',
  TIENDA_ARTESANIA: 'Tienda de artesanía',
  BODEGA: 'Bodega',
  EXPERIENCIA: 'Experiencia',
  OTRO: 'Otro',
};

const TIPO_TO_ROUTE: Record<string, string> = {
  HOTEL: 'donde-dormir',
  CASA_RURAL: 'donde-dormir',
  RESTAURANTE: 'donde-comer',
  BAR: 'donde-comer',
  BODEGA: 'donde-comer',
  COMERCIO: 'donde-comprar',
  TIENDA_ARTESANIA: 'donde-comprar',
};

type Negocio = {
  id: number;
  nombre: string;
  slug?: string | null;
  tipo: string;
  activo: boolean;
  cerradoTemporal: boolean;
  codigoQr: string;
  scope: string;
  planNegocio?: string;
  puntosClub?: number | null;
  descuentoPorcentaje?: number | null;
  descripcion?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  localidad?: string | null;
  socialLinks?: Record<string, string> | null;
  servicios?: string[] | null;
  landingConfig?: Record<string, any> | null;
  fotoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  provincia?: string | null;
  comunidad?: string | null;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  colaboradores?: Array<{
    id: number;
    activo: boolean;
    user: { id: number; email: string; nombre?: string | null };
  }>;
  imagenes?: Array<{
    id: number;
    url: string;
    alt: string | null;
    orden: number;
  }>;
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: 'Gratuito', color: 'bg-muted text-muted-foreground' },
  PREMIUM: { label: 'Premium', color: 'bg-amber-100 text-amber-800' },
  SELECTION: { label: 'Selection', color: 'bg-gradient-to-r from-slate-800 to-slate-700 text-white' },
};

type FormData = {
  nombre: string;
  tipo: string;
  descripcion: string;
  telefono: string;
  email: string;
  web: string;
  contacto: string;
  descuentoPorcentaje: string;
  lat: string;
  lng: string;
  provincia: string;
  comunidad: string;
  whatsapp: string;
  bookingUrl: string;
  localidad: string;
  socialLinks: Record<string, string>;
  servicios: string[];
};

const emptyForm: FormData = {
  nombre: '',
  tipo: 'HOTEL',
  descripcion: '',
  telefono: '',
  email: '',
  web: '',
  contacto: '',
  descuentoPorcentaje: '',
  lat: '',
  lng: '',
  provincia: '',
  comunidad: '',
  whatsapp: '',
  bookingUrl: '',
  localidad: '',
  socialLinks: {},
  servicios: [],
};

export default function NegociosPuebloClient({
  puebloSlug,
  embeddedInShell,
}: {
  puebloSlug: string;
  /** Si true, el título va en GestionAsociacionSubpageShell (página padre). */
  embeddedInShell?: boolean;
}) {
  const isAsociacion = puebloSlug === 'asociacion-general';

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puebloId, setPuebloId] = useState<number | null>(isAsociacion ? 0 : null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [puebloNombre, setPuebloNombre] = useState<string>(isAsociacion ? 'Asociación' : '');
  const [puebloLat, setPuebloLat] = useState<number | null>(null);
  const [puebloLng, setPuebloLng] = useState<number | null>(null);
  const [puebloProvincia, setPuebloProvincia] = useState<string>('');
  const [puebloComunidad, setPuebloComunidad] = useState<string>('');
  const [qrCartelNegocio, setQrCartelNegocio] = useState<Negocio | null>(null);
  const [mejorarPlanNegocio, setMejorarPlanNegocio] = useState<Negocio | null>(null);

  useEffect(() => {
    if (isAsociacion) return;
    fetch('/api/club/negocios/pueblos')
      .then((r) => r.json())
      .then((pueblos: Array<{ id: number; nombre: string; slug: string; lat?: number; lng?: number; provincia?: string; comunidad?: string }>) => {
        const found = pueblos.find((p) => p.slug === puebloSlug);
        if (found) {
          setPuebloId(found.id);
          setPuebloNombre(found.nombre);
          if (found.lat != null) setPuebloLat(found.lat);
          if (found.lng != null) setPuebloLng(found.lng);
          if (found.provincia) setPuebloProvincia(found.provincia);
          if (found.comunidad) setPuebloComunidad(found.comunidad);
        }
      })
      .catch(() => {});
  }, [isAsociacion, puebloSlug]);

  const apiBase = isAsociacion
    ? '/api/club/negocios/asociacion'
    : puebloId != null ? `/api/club/negocios/pueblo/${puebloId}` : null;

  const load = useCallback(async () => {
    if (!apiBase) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiBase);
      if (!res.ok) throw new Error('Error al cargar negocios');
      const data: Negocio[] = await res.json();
      setNegocios(Array.isArray(data) ? data : []);
      if (data.length > 0 && data[0].pueblo?.nombre && !puebloNombre) {
        setPuebloNombre(data[0].pueblo.nombre);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [apiBase, puebloNombre]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam === 'ok') {
      setMsg({ ok: true, text: '¡Pago completado! El plan se actualizará en unos segundos.' });
      const t = setTimeout(() => load(), 3000);
      window.history.replaceState({}, '', window.location.pathname);
      return () => clearTimeout(t);
    }
    if (planParam === 'cancel') {
      setMsg({ ok: false, text: 'Pago cancelado. No se ha realizado ningún cargo.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [load]);

  const mapCenter: [number, number] =
    puebloLat != null && puebloLng != null
      ? [puebloLat, puebloLng]
      : [40.4168, -3.7038];

  const mapZoom = puebloLat != null ? 14 : 6;

  const selectedMapPosition = (() => {
    if (!form.lat || !form.lng) return null;
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return { lat, lng };
  })();

  const negocioEditando = editId ? negocios.find((n) => n.id === editId) ?? null : null;

  const existingMarkers = negocios
    .filter((n) => n.lat && n.lng)
    .map((n) => ({
      lat: n.lat!,
      lng: n.lng!,
      label: n.nombre,
      color: n.activo ? 'blue' : 'grey',
    }));

  function handleMapLocationSelect(lat: number, lng: number) {
    const rounded = {
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
    };
    setForm((prev) => ({
      ...prev,
      lat: rounded.lat.toString(),
      lng: rounded.lng.toString(),
    }));
  }

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, provincia: puebloProvincia, comunidad: puebloComunidad });
    setShowForm(true);
    setMsg(null);
  };

  const openEdit = (n: Negocio) => {
    setEditId(n.id);
    setForm({
      nombre: n.nombre,
      tipo: n.tipo,
      descripcion: n.descripcion ?? '',
      telefono: n.telefono ?? '',
      email: n.email ?? '',
      web: n.web ?? '',
      contacto: n.contacto ?? '',
      descuentoPorcentaje: n.descuentoPorcentaje != null ? String(n.descuentoPorcentaje) : '',
      lat: n.lat != null ? String(n.lat) : '',
      lng: n.lng != null ? String(n.lng) : '',
      provincia: n.provincia ?? puebloProvincia,
      comunidad: n.comunidad ?? puebloComunidad,
      whatsapp: n.whatsapp ?? '',
      bookingUrl: n.bookingUrl ?? '',
      localidad: n.localidad ?? '',
      socialLinks: (n.socialLinks as Record<string, string>) ?? {},
      servicios: (n.servicios as string[]) ?? [],
    });
    setShowForm(true);
    setMsg(null);
  };

  const cancel = () => {
    setShowForm(false);
    setEditId(null);
    setMsg(null);
  };

  const handleSave = async () => {
    if (!apiBase) return;
    if (!form.nombre.trim()) {
      setMsg({ ok: false, text: 'El nombre es obligatorio' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const body: any = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
      };

      const setNullableField = (key: string, value: string) => {
        const trimmed = value.trim();
        if (trimmed) {
          body[key] = trimmed;
        } else if (editId) {
          // En edición, vacío significa "borrar valor previo" (guardar null)
          body[key] = null;
        }
      };

      setNullableField('descripcion', form.descripcion);
      setNullableField('telefono', form.telefono);
      setNullableField('email', form.email);
      setNullableField('web', form.web);
      setNullableField('contacto', form.contacto);
      setNullableField('whatsapp', form.whatsapp);
      setNullableField('bookingUrl', form.bookingUrl);
      setNullableField('localidad', form.localidad);
      if (form.descuentoPorcentaje.trim()) {
        body.descuentoPorcentaje = Number(form.descuentoPorcentaje);
      }
      if (form.lat.trim()) body.lat = Number(form.lat);
      if (form.lng.trim()) body.lng = Number(form.lng);
      if (form.provincia.trim()) body.provincia = form.provincia.trim();
      if (form.comunidad.trim()) body.comunidad = form.comunidad.trim();

      const filteredLinks = Object.fromEntries(
        Object.entries(form.socialLinks).filter(([, v]) => v.trim()),
      );
      body.socialLinks = Object.keys(filteredLinks).length > 0 ? filteredLinks : null;
      body.servicios = form.servicios.length > 0 ? form.servicios : null;

      let res: Response;
      if (editId) {
        res = await fetch(`/api/club/negocios/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || err?.error || 'Error al guardar');
      }

      setMsg({ ok: true, text: editId ? 'Negocio actualizado' : 'Negocio creado' });
      setShowForm(false);
      setEditId(null);
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Se borrarán también sus visitas, validaciones y colaboradores.`)) return;
    try {
      const res = await fetch(`/api/club/negocios/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setMsg({ ok: true, text: `"${nombre}" eliminado` });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? 'Error al eliminar' });
    }
  };

  const handleToggleActivo = async (n: Negocio) => {
    try {
      const res = await fetch(`/api/club/negocios/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !n.activo }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? 'Error' });
    }
  };

  const title = isAsociacion
    ? 'Negocios · Asociación'
    : `Negocios · ${puebloNombre || puebloSlug}`;

  if (!isAsociacion && puebloId === null) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Cargando pueblo&hellip;
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!(embeddedInShell && showForm) && (
        <div
          className={`flex items-center gap-4 ${embeddedInShell ? 'justify-end' : 'justify-between'}`}
        >
          {!embeddedInShell && (
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gestiona hoteles, restaurantes, comercios y otros negocios privados.
              </p>
            </div>
          )}
          {!showForm && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
            >
              + Nuevo negocio
            </button>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            msg.ok
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg">
            {editId ? 'Editar negocio' : 'Nuevo negocio'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Hotel Rural La Posada"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TIPOS_NEGOCIO.map((t) => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Descripci&oacute;n del negocio
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Presenta tu negocio: qué ofrecéis, qué os hace especiales..."
            />
          </div>

          {/* Ofertas para socios del Club */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-amber-600">🎁</span> Ofertas para socios del Club
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Crea ofertas estructuradas para los miembros del Club. Usa las plantillas para empezar r&aacute;pidamente.
            </p>
            {negocioEditando && (
              <NegocioOfertas
                negocioId={negocioEditando.id}
                tipoNegocio={negocioEditando.tipo}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tel&eacute;fono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Web</label>
              <input
                value={form.web}
                onChange={(e) => setForm((f) => ({ ...f, web: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Contacto (persona)</label>
            <input
              value={form.contacto}
              onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              className="w-full max-w-xl rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* WhatsApp, Booking, Localidad */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+34600123456"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Enlace de reservas</label>
              <input
                value={form.bookingUrl}
                onChange={(e) => setForm((f) => ({ ...f, bookingUrl: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://booking.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Localidad</label>
              <input
                value={form.localidad}
                onChange={(e) => setForm((f) => ({ ...f, localidad: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ciudad o localidad"
              />
            </div>
          </div>

          {/* Servicios / amenities */}
          {(() => {
            const planKey = (negocioEditando?.planNegocio ?? 'FREE') as PlanNegocio;
            const pf = getPlanFeatures(planKey);
            if (!pf.serviceHighlightsEnabled) return null;
            return (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Servicios</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICIOS_DISPONIBLES.map((s) => {
                    const active = form.servicios.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            servicios: active
                              ? f.servicios.filter((k) => k !== s.key)
                              : [...f.servicios, s.key],
                          }))
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Redes sociales */}
          {(() => {
            const planKey = (negocioEditando?.planNegocio ?? 'FREE') as PlanNegocio;
            const pf = getPlanFeatures(planKey);
            if (!pf.socialLinksEnabled) return null;
            return (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Redes sociales</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SOCIAL_NETWORKS.map((sn) => (
                    <div key={sn.key} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">{sn.label}</span>
                      <input
                        value={form.socialLinks[sn.key] ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            socialLinks: { ...f.socialLinks, [sn.key]: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={`https://${sn.key}.com/...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Descuento resumen: un solo % para listados y cabecera de ficha (distinto de ofertas estructuradas) */}
          <div className="rounded-xl border-2 border-[#c45c48] bg-[#fdf6f3] p-4 sm:p-5 shadow-sm ring-1 ring-[#c45c48]/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c45c48]/20 text-lg font-bold text-[#8b3d2f]"
                  aria-hidden
                >
                  %
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#5c2e26]">
                      Descuento resumen para socios del Club
                    </h4>
                    <span
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c45c48]/50 bg-white text-[#8b3d2f]"
                      title="Más abajo puedes desplegar la explicación completa"
                      aria-hidden
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#7a4a40]">
                    Un solo porcentaje que se muestra de forma destacada en la web pública: en las{' '}
                    <strong className="font-semibold text-[#5c2e26]">tarjetas del listado</strong> del Club y en la{' '}
                    <strong className="font-semibold text-[#5c2e26]">cabecera de la ficha</strong> del negocio.
                    No sustituye las ofertas detalladas de abajo (desayuno, noches, menú, etc.): es el &ldquo;número
                    principal&rdquo; que ve el socio de un vistazo.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 sm:flex sm:items-end sm:gap-4">
              <div className="sm:w-40">
                <label htmlFor="negocio-descuento-resumen" className="sr-only">
                  Porcentaje de descuento resumen (0 a 100)
                </label>
                <input
                  id="negocio-descuento-resumen"
                  type="number"
                  min="0"
                  max="100"
                  value={form.descuentoPorcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, descuentoPorcentaje: e.target.value }))}
                  className="w-full rounded-lg border-2 border-[#c45c48]/35 bg-white px-3 py-2.5 text-sm font-medium text-[#5c2e26] shadow-inner focus:border-[#c45c48] focus:outline-none focus:ring-2 focus:ring-[#c45c48]/30"
                  placeholder="Ej. 10"
                />
                <span className="mt-1 block text-[11px] text-[#8b3d2f]/90">Dejar vacío si no aplica</span>
              </div>
            </div>
            <details className="mt-4 rounded-lg border border-[#c45c48]/25 bg-white/70 px-3 py-2 text-[#5c2e26]">
              <summary className="cursor-pointer select-none text-xs font-semibold text-[#8b3d2f] hover:text-[#5c2e26]">
                Cómo se combina con las ofertas estructuradas
              </summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[#6b4540]">
                <li>
                  <strong className="text-[#5c2e26]">Listado del Club:</strong> si creas una oferta y la marcas como{' '}
                  <em>destacada</em>, la tarjeta puede mostrar primero esa oferta. Si no hay destacada, se usa este
                  porcentaje resumen (si lo rellenas).
                </li>
                <li>
                  <strong className="text-[#5c2e26]">Ficha del negocio:</strong> este campo controla el bloque grande
                  &ldquo;X% descuento Club&rdquo; junto al nombre. Las ofertas estructuradas aparecen en su propia
                  sección con el detalle (qué incluye, si es por persona o por habitación, etc.).
                </li>
                <li>
                  Puedes usar solo ofertas detalladas y dejar este campo vacío, o usar ambos: resumen para el impacto
                  visual y ofertas para explicar bien las condiciones.
                </li>
              </ul>
            </details>
          </div>

          {/* Ubicación */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-blue-800">Ubicación</h4>
            <p className="text-xs text-muted-foreground">
              Haz clic en el mapa o busca por nombre para ubicar el negocio. Los visitantes podrán obtener indicaciones en la app.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="42.1234"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="-3.5678"
                />
              </div>
            </div>
            {showForm && (
              <MapLocationPicker
                center={selectedMapPosition ? [selectedMapPosition.lat, selectedMapPosition.lng] : mapCenter}
                zoom={selectedMapPosition ? 16 : mapZoom}
                existingMarkers={existingMarkers}
                selectedPosition={selectedMapPosition}
                onLocationSelect={handleMapLocationSelect}
                height="350px"
                searchPlaceholder="Buscar negocio o dirección…"
                activeHint={editId ? 'Haz clic en el mapa para cambiar la ubicación' : 'Haz clic en el mapa para ubicar el negocio'}
              />
            )}
            {isAsociacion && (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Provincia</label>
                  <input
                    value={form.provincia}
                    onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej: Huesca"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Comunidad Aut&oacute;noma</label>
                  <input
                    value={form.comunidad}
                    onChange={(e) => setForm((f) => ({ ...f, comunidad: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej: Aragón"
                  />
                </div>
              </div>
            )}
            {!isAsociacion && puebloProvincia && (
              <p className="text-xs text-muted-foreground">
                Provincia: {puebloProvincia} · Comunidad: {puebloComunidad} (del pueblo, se aplica automáticamente)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear negocio'}
            </button>
            <button
              onClick={cancel}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/30"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          Cargando negocios&hellip;
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : negocios.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No hay negocios {isAsociacion ? 'de asociación' : 'en este pueblo'} todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {negocios.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              {/* Plan banner */}
              {(() => {
                const planKey = n.planNegocio ?? 'FREE';
                const pl = PLAN_LABELS[planKey] ?? PLAN_LABELS.FREE;
                const isFree = planKey === 'FREE';
                const isSelection = planKey === 'SELECTION';
                const bannerBg = isSelection
                  ? 'bg-slate-900 border border-slate-600'
                  : planKey === 'PREMIUM'
                    ? 'bg-amber-50 border border-amber-200'
                    : '';
                return isFree ? (
                  <div className="mb-3 flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Plan Gratuito — Funcionalidades limitadas en la web pública</span>
                    <button
                      type="button"
                      onClick={() => setMejorarPlanNegocio(n)}
                      className="rounded bg-primary px-3 py-1 text-[11px] font-semibold text-white hover:bg-primary/90"
                    >
                      Mejorar plan
                    </button>
                  </div>
                ) : (
                  <div className={`mb-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${bannerBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${pl.color}`}>{pl.label}</span>
                      <span className={`text-xs ${isSelection ? 'text-slate-300' : 'text-muted-foreground'}`}>Plan activo</span>
                    </div>
                    
                  </div>
                );
              })()}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{n.nombre}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {TIPO_LABELS[n.tipo] ?? n.tipo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {n.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {n.cerradoTemporal && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Cerrado temporal
                      </span>
                    )}
                  </div>

                  {n.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.descripcion}</p>
                  )}

                  {n.puntosClub != null && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="text-lg font-bold text-amber-800">+{n.puntosClub}</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-800">puntos por validación</p>
                        <p className="text-[11px] text-amber-700/70">que este negocio aporta a los socios del Club</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {n.telefono && <span>Tel: {n.telefono}</span>}
                    {n.email && <span>{n.email}</span>}
                    {n.web && <span>{n.web}</span>}
                    {n.descuentoPorcentaje != null && (
                      <span className="font-medium text-primary">{n.descuentoPorcentaje}% dto.</span>
                    )}
                    <span className="font-mono">QR: {n.codigoQr}</span>
                    {n.lat != null && n.lng != null ? (
                      <span className="text-green-600">📍 Ubicado</span>
                    ) : (
                      <span className="text-amber-600">⚠ Sin ubicación</span>
                    )}
                  </div>

                  {n.colaboradores && n.colaboradores.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {n.colaboradores.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {c.user.nombre ?? c.user.email}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => handleToggleActivo(n)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      n.activo
                        ? 'border-border text-muted-foreground hover:bg-muted/30'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                    title={n.activo ? 'Desactivar' : 'Activar'}
                  >
                    {n.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => openEdit(n)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/30"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setQrCartelNegocio(n)}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
                    title="Descargar / imprimir cartel QR para ponerlo en el local"
                  >
                    QR del local
                  </button>
                  {(() => {
                    const negSlug = n.slug?.trim();
                    const pSlug = n.pueblo?.slug ?? puebloSlug;
                    const route = TIPO_TO_ROUTE[n.tipo];
                    const href = negSlug && route
                      ? `/${route}/${pSlug}/${negSlug}`
                      : negSlug
                        ? `/negocio/${negSlug}`
                        : null;
                    if (!href) return null;
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 text-center"
                        title="Ver cómo se muestra este negocio al público"
                      >
                        Vista previa
                      </a>
                    );
                  })()}
                  <button
                    onClick={() => handleDelete(n.id, n.nombre)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Gallery */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Fotos del negocio
                </h4>
                <NegocioGallery negocioId={n.id} negocioNombre={n.nombre} plan={n.planNegocio ?? 'FREE'} />
              </div>

              {/* Stats */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Estadísticas
                </h4>
                <NegocioStats negocioId={n.id} planNegocio={n.planNegocio ?? 'FREE'} />
              </div>

              {/* RRSS de LPMBE — solicitar publicaciones incluidas y extras */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Redes sociales LPMBE
                </h4>
                <NegocioRrssPanel negocioId={n.id} planNegocio={n.planNegocio ?? 'FREE'} />
              </div>

              {/* Landing personalizada */}
              {(() => {
                const pk = (n.planNegocio ?? 'FREE') as PlanNegocio;
                const pf = getPlanFeatures(pk);
                if (!pf.customLandingEnabled) return null;
                return <NegocioLandingEditor negocio={n} />;
              })()}
            </div>
          ))}
        </div>
      )}

      {qrCartelNegocio && (
        <QrCartelModal
          open={true}
          onClose={() => setQrCartelNegocio(null)}
          codigoQr={qrCartelNegocio.codigoQr}
          nombre={qrCartelNegocio.nombre}
          puebloNombre={qrCartelNegocio.pueblo?.nombre ?? puebloNombre ?? null}
          tipo={TIPO_LABELS[qrCartelNegocio.tipo] ?? qrCartelNegocio.tipo}
        />
      )}

      {mejorarPlanNegocio && (
        <MejorarPlanModal
          negocioId={mejorarPlanNegocio.id}
          negocioNombre={mejorarPlanNegocio.nombre}
          currentPlan={(mejorarPlanNegocio.planNegocio ?? 'FREE') as PlanNegocio}
          onClose={() => setMejorarPlanNegocio(null)}
        />
      )}
    </div>
  );
}

function NegocioLandingEditor({ negocio }: { negocio: Negocio }) {
  const [config, setConfig] = useState<Record<string, any>>(
    (negocio.landingConfig as Record<string, any>) ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (key: string, value: string) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/club/negocios/${negocio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingConfig: config }),
      });
      if (res.ok) setMsg('Guardado');
      else setMsg('Error al guardar');
    } catch {
      setMsg('Error de conexión');
    }
    setSaving(false);
  };

  const handleHeroUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      setUploading(true);
      setMsg('');
      try {
        const { compressImage } = await import('@/src/lib/compressImage');
        const compressed = await compressImage(file, {
          fileName: file.name.replace(/\.[^.]+$/, ''),
        });
        const fd = new FormData();
        fd.append('file', compressed);
        fd.append('folder', 'negocios/landing');
        const uploadRes = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        const json = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) throw new Error(json?.error ?? json?.message ?? `Error ${uploadRes.status}`);
        const url = json?.url ?? json?.publicUrl ?? json?.data?.url ?? null;
        if (!url) throw new Error('No se recibió URL de imagen');
        update('heroImageUrl', url);
        setMsg('Imagen subida (recuerda guardar)');
      } catch (err: any) {
        setMsg(err?.message ?? 'Error subiendo imagen');
      }
      setUploading(false);
    };
    input.click();
  };

  const landingUrl = `/negocio/${negocio.codigoQr.replace(/^qr-/, '')}`;
  const slug = (negocio as any).slug;
  const previewUrl = slug ? `/negocio/${slug}` : landingUrl;
  const inputCls = 'w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Landing personalizada
      </h4>
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Titular principal</label>
            <input value={config.headline ?? ''} onChange={(e) => update('headline', e.target.value)}
              className={inputCls} placeholder={negocio.nombre} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Subtítulo</label>
            <input value={config.subheadline ?? ''} onChange={(e) => update('subheadline', e.target.value)}
              className={inputCls} placeholder="Descripción breve" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Texto del botón CTA</label>
            <input value={config.ctaText ?? ''} onChange={(e) => update('ctaText', e.target.value)}
              className={inputCls} placeholder="Reservar ahora" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">URL del botón CTA</label>
            <input value={config.ctaUrl ?? ''} onChange={(e) => update('ctaUrl', e.target.value)}
              className={inputCls} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Imagen hero</label>
            <div className="flex gap-2 items-center">
              <input value={config.heroImageUrl ?? ''} onChange={(e) => update('heroImageUrl', e.target.value)}
                className={`flex-1 ${inputCls}`} placeholder="URL o sube una imagen" />
              <button type="button" onClick={handleHeroUpload} disabled={uploading}
                className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors">
                {uploading ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
            {config.heroImageUrl && (
              <img src={config.heroImageUrl} alt="Hero preview" className="mt-2 h-24 w-full rounded-lg object-cover border border-border" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tema visual</label>
            <select value={config.theme ?? 'classic'} onChange={(e) => update('theme', e.target.value)} className={inputCls}>
              <option value="classic">Clásico</option>
              <option value="dark">Oscuro</option>
              <option value="nature">Naturaleza</option>
              <option value="elegant">Elegante</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Guardar landing'}
          </button>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary hover:underline">
            Ver landing →
          </a>
          {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
