'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from '@/lib/resource-types';

const MapLocationPicker = dynamic(
  () => import('@/app/components/MapLocationPicker'),
  { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-100" /> },
);

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  slug?: string;
  descripcion?: string | null;
  horarios?: string | null;
  contacto?: string | null;
  web?: string | null;
  fotoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  provincia?: string | null;
  comunidad?: string | null;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  activo: boolean;
  cerradoTemporal: boolean;
  scope: string;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
};

type Metricas = {
  totalValidaciones: number;
  totalOk: number;
  totalNoOk: number;
  totalAdultos: number;
  periodos?: {
    hoy: number;
    semana: number;
    mes: number;
  };
};

export default function ColaboradorClient() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'info' | 'metricas'>('info');

  const loadRecursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/colaborador/recursos', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) { window.location.href = '/entrar'; return; }
        throw new Error('Error cargando recursos');
      }
      const data = await res.json();
      const arr: Recurso[] = Array.isArray(data) ? data : data.items ?? [];
      setRecursos(arr);
      if (arr.length > 0 && !selectedId) setSelectedId(arr[0].id);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadRecursos(); }, []);

  const selected = recursos.find((r) => r.id === selectedId) ?? null;

  if (loading) return <div className="py-16 text-center text-sm text-gray-500">Cargando…</div>;
  if (error) return <div className="py-16 text-center text-sm text-red-500">{error}</div>;
  if (recursos.length === 0) return (
    <div className="py-16 text-center text-gray-500">
      <p className="text-lg font-medium">Sin recursos asignados</p>
      <p className="mt-2 text-sm">Contacta con la asociación para que te asignen un recurso turístico.</p>
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Sidebar — lista de recursos */}
      <aside className="w-56 shrink-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Mis recursos</h2>
        <ul className="space-y-1">
          {recursos.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => { setSelectedId(r.id); setTab('info'); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === r.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium leading-tight">{r.nombre}</div>
                <div className={`mt-0.5 text-xs ${selectedId === r.id ? 'text-white/70' : 'text-gray-400'}`}>
                  {RESOURCE_TYPE_LABELS[r.tipo] || r.tipo}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel principal */}
      <div className="min-w-0 flex-1">
        {selected && (
          <RecursoPanel
            recurso={selected}
            tab={tab}
            onTabChange={setTab}
            onSaved={loadRecursos}
          />
        )}
      </div>
    </div>
  );
}

// ── Panel de un recurso ───────────────────────────────────────────────────────

function RecursoPanel({
  recurso,
  tab,
  onTabChange,
  onSaved,
}: {
  recurso: Recurso;
  tab: 'info' | 'metricas';
  onTabChange: (t: 'info' | 'metricas') => void;
  onSaved: () => void;
}) {
  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{recurso.nombre}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500">
            <span>{RESOURCE_TYPE_LABELS[recurso.tipo] || recurso.tipo}</span>
            {recurso.provincia && <span>· {recurso.provincia}</span>}
            {recurso.activo
              ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activo</span>
              : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactivo</span>}
            {recurso.cerradoTemporal && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Cerrado temporalmente</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 border-b">
        <nav className="-mb-px flex gap-6 text-sm">
          {(['info', 'metricas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`border-b-2 pb-2 font-medium transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'info' ? 'Información' : 'Métricas'}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'info' && <EditarRecursoForm recurso={recurso} onSaved={onSaved} />}
      {tab === 'metricas' && <MetricasPanel recursoId={recurso.id} />}
    </div>
  );
}

// ── Formulario de edición ─────────────────────────────────────────────────────

function EditarRecursoForm({ recurso, onSaved }: { recurso: Recurso; onSaved: () => void }) {
  const [form, setForm] = useState({
    nombre: recurso.nombre,
    tipo: recurso.tipo,
    descripcion: recurso.descripcion ?? '',
    horarios: recurso.horarios ?? '',
    contacto: recurso.contacto ?? '',
    web: recurso.web ?? '',
    fotoUrl: recurso.fotoUrl ?? '',
    lat: recurso.lat?.toString() ?? '',
    lng: recurso.lng?.toString() ?? '',
    provincia: recurso.provincia ?? '',
    comunidad: recurso.comunidad ?? '',
    descuentoPorcentaje: recurso.descuentoPorcentaje?.toString() ?? '',
    precioCents: recurso.precioCents ? (recurso.precioCents / 100).toString() : '',
    activo: recurso.activo,
    cerradoTemporal: recurso.cerradoTemporal,
    maxAdultos: recurso.maxAdultos,
    maxMenores: recurso.maxMenores,
    edadMaxMenor: recurso.edadMaxMenor,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url } = await uploadImageToR2(file, 'recursos-asociacion');
      set('fotoUrl', url);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setMsg({ type: 'error', text: 'El nombre es obligatorio' }); return; }
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        activo: form.activo,
        cerradoTemporal: form.cerradoTemporal,
        provincia: form.provincia.trim(),
        comunidad: form.comunidad.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        maxAdultos: form.maxAdultos,
        maxMenores: form.maxMenores,
        edadMaxMenor: form.edadMaxMenor,
      };
      if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
      else body.descripcion = null;
      if (form.horarios.trim()) body.horarios = form.horarios.trim();
      if (form.contacto.trim()) body.contacto = form.contacto.trim();
      if (form.web.trim()) body.web = form.web.trim();
      if (form.fotoUrl.trim()) body.fotoUrl = form.fotoUrl.trim();
      body.descuentoPorcentaje = form.descuentoPorcentaje ? Number(form.descuentoPorcentaje) : null;
      body.precioCents = form.precioCents ? Math.round(Number(form.precioCents) * 100) : null;

      const res = await fetch(`/api/colaborador/recursos/${recurso.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setMsg({ type: 'error', text: d?.message ?? 'Error guardando' });
        return;
      }
      setMsg({ type: 'ok', text: 'Cambios guardados correctamente' });
      onSaved();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message ?? 'Error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Foto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Foto del recurso</label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
        {form.fotoUrl ? (
          <div className="flex items-center gap-4">
            <img src={form.fotoUrl} alt="Preview" className="h-24 w-32 rounded-lg border object-cover" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50">
            {uploading ? 'Subiendo…' : '+ Subir foto'}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
          rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-gray-400">Se traducirá automáticamente a los 6 idiomas del sitio web.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
          <input value={form.provincia} onChange={(e) => set('provincia', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comunidad autónoma</label>
          <input value={form.comunidad} onChange={(e) => set('comunidad', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
          <input value={form.horarios} onChange={(e) => set('horarios', e.target.value)}
            placeholder="L-V 10:00-18:00" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
          <input value={form.contacto} onChange={(e) => set('contacto', e.target.value)}
            placeholder="info@ejemplo.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Web</label>
        <input value={form.web} onChange={(e) => set('web', e.target.value)}
          placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      {/* Mapa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitud</label>
            <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="42.1234" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitud</label>
            <input type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="-3.5678" />
          </div>
        </div>
        <MapLocationPicker
          center={form.lat && form.lng ? [Number(form.lat), Number(form.lng)] : [40.0, -3.7]}
          zoom={form.lat && form.lng ? 13 : 6}
          selectedPosition={form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : null}
          onLocationSelect={(lat, lng) => { set('lat', String(Math.round(lat * 1e6) / 1e6)); set('lng', String(Math.round(lng * 1e6) / 1e6)); }}
          height="300px"
          searchPlaceholder="Buscar ubicación…"
          activeHint="Haz clic en el mapa para fijar la ubicación"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Club (%)</label>
          <input type="number" min="0" max="100" value={form.descuentoPorcentaje}
            onChange={(e) => set('descuentoPorcentaje', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
          <input type="number" min="0" step="0.01" value={form.precioCents}
            onChange={(e) => set('precioCents', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Máx. adultos</label>
          <input type="number" min="1" max="20" value={form.maxAdultos}
            onChange={(e) => set('maxAdultos', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Máx. menores</label>
          <input type="number" min="0" max="10" value={form.maxMenores}
            onChange={(e) => set('maxMenores', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad máx. menor</label>
          <input type="number" min="0" max="18" value={form.edadMaxMenor}
            onChange={(e) => set('edadMaxMenor', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)}
            className="rounded" />
          Recurso activo
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.cerradoTemporal} onChange={(e) => set('cerradoTemporal', e.target.checked)}
            className="rounded" />
          Cerrado temporalmente
        </label>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={saving}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}

// ── Panel de métricas ─────────────────────────────────────────────────────────

function MetricasPanel({ recursoId }: { recursoId: number }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/club/validador/metricas?recursoId=${recursoId}&days=${days}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [recursoId, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Cargando métricas…</div>;
  if (error) return <div className="py-8 text-sm text-red-500">{error}</div>;
  if (!data) return null;

  const totalOk = data.totalOk ?? data.total ?? 0;
  const totalAdultos = data.totalAdultos ?? 0;
  const totalMenores = data.totalMenores ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Últimos {days} días</h3>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Usos validados" value={String(totalOk)} color="green" />
        <StatCard label="Adultos atendidos" value={String(totalAdultos)} color="blue" />
        <StatCard label="Menores atendidos" value={String(totalMenores)} color="amber" />
      </div>

      {/* Últimas validaciones */}
      {data.ultimasValidaciones?.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b">
            <h4 className="text-sm font-semibold text-gray-700">Últimas visitas</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Adultos</th>
                  <th className="px-4 py-3 text-center">Menores</th>
                  <th className="px-4 py-3 text-center">Descuento</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.ultimasValidaciones.slice(0, 20).map((v: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(v.scannedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-center">{v.adultosUsados ?? 0}</td>
                    <td className="px-4 py-2 text-center">{v.menoresUsados ?? 0}</td>
                    <td className="px-4 py-2 text-center">{v.descuentoPorcentaje != null ? `${v.descuentoPorcentaje}%` : '—'}</td>
                    <td className="px-4 py-2 text-center">
                      {v.resultado === 'OK'
                        ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>
                        : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">{v.resultado}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'green' | 'blue' | 'amber' }) {
  const bg = { green: 'bg-green-50 border-green-200', blue: 'bg-blue-50 border-blue-200', amber: 'bg-amber-50 border-amber-200' };
  const text = { green: 'text-green-700', blue: 'text-blue-700', amber: 'text-amber-700' };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className={`text-3xl font-bold ${text[color]}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-700">{label}</div>
    </div>
  );
}
