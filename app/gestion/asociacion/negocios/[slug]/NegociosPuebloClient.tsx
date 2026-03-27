'use client';

import { useCallback, useEffect, useState } from 'react';
import NegocioGallery from './NegocioGallery';
import MapLocationPicker from '@/app/components/MapLocationPicker';

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

type Negocio = {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  cerradoTemporal: boolean;
  codigoQr: string;
  scope: string;
  descuentoPorcentaje?: number | null;
  descripcion?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
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
};

export default function NegociosPuebloClient({ puebloSlug }: { puebloSlug: string }) {
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
      if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
      if (form.telefono.trim()) body.telefono = form.telefono.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.web.trim()) body.web = form.web.trim();
      if (form.contacto.trim()) body.contacto = form.contacto.trim();
      if (form.descuentoPorcentaje.trim()) {
        body.descuentoPorcentaje = Number(form.descuentoPorcentaje);
      }
      if (form.lat.trim()) body.lat = Number(form.lat);
      if (form.lng.trim()) body.lng = Number(form.lng);
      if (form.provincia.trim()) body.provincia = form.provincia.trim();
      if (form.comunidad.trim()) body.comunidad = form.comunidad.trim();

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
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
        Cargando pueblo&hellip;
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona hoteles, restaurantes, comercios y otros negocios privados.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            + Nuevo negocio
          </button>
        )}
      </div>

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
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Hotel Rural La Posada"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TIPOS_NEGOCIO.map((t) => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Descripci&oacute;n / Qu&eacute; ofrece a los socios del Club
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej: 10% en alojamiento, café de bienvenida gratuito..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tel&eacute;fono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Web</label>
              <input
                value={form.web}
                onChange={(e) => setForm((f) => ({ ...f, web: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contacto (persona)</label>
              <input
                value={form.contacto}
                onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.descuentoPorcentaje}
                onChange={(e) => setForm((f) => ({ ...f, descuentoPorcentaje: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: 10"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-blue-800">Ubicación</h4>
            <p className="text-xs text-gray-500">
              Haz clic en el mapa o busca por nombre para ubicar el negocio. Los visitantes podrán obtener indicaciones en la app.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="42.1234"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label className="block text-xs text-gray-500 mb-1">Provincia</label>
                  <input
                    value={form.provincia}
                    onChange={(e) => setForm((f) => ({ ...f, provincia: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej: Huesca"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Comunidad Aut&oacute;noma</label>
                  <input
                    value={form.comunidad}
                    onChange={(e) => setForm((f) => ({ ...f, comunidad: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej: Aragón"
                  />
                </div>
              </div>
            )}
            {!isAsociacion && puebloProvincia && (
              <p className="text-xs text-gray-400">
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          Cargando negocios&hellip;
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : negocios.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-400">
          No hay negocios {isAsociacion ? 'de asociación' : 'en este pueblo'} todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {negocios.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{n.nombre}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {TIPO_LABELS[n.tipo] ?? n.tipo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
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
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{n.descripcion}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
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
                        ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                    title={n.activo ? 'Desactivar' : 'Activar'}
                  >
                    {n.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => openEdit(n)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Editar
                  </button>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fotos del negocio
                </h4>
                <NegocioGallery negocioId={n.id} negocioNombre={n.nombre} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
