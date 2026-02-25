'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import HorariosEditor, { HorarioDia, CierreEspecial } from '@/app/_components/editor/HorariosEditor';

const MapLocationPicker = dynamic(
  () => import('@/app/components/MapLocationPicker'),
  { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse rounded-lg bg-gray-100" /> },
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Recurso = {
  id: number;
  puebloId: number | null;
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
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
  scope?: string;
  esExterno?: boolean;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  horariosSemana?: HorarioDia[];
  cierresEspeciales?: CierreEspecial[];
};

type Metricas = {
  hoy: { total: number; ok: number; noOk: number; adultos: number; menores: number };
  periodo?: { totalIntentos: number; ok: number; noOk: Record<string, number> };
  dias?: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosDias?: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosEscaneos?: Array<{
    scannedAt: string;
    hora: string;
    resultado: string;
    adultosUsados: number;
    menoresUsados: number;
  }>;
};

const PERIODOS = [
  { label: '7 días', days: 7 },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
  { label: '365 días', days: 365 },
];

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ColaboradorPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'metricas' | 'info'>('metricas');
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [metricasDays, setMetricasDays] = useState(7);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const loadRecursos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/colaborador/mis-recursos');
      if (!res.ok) throw new Error('Error cargando recursos');
      const data = await res.json();
      const lista: Recurso[] = Array.isArray(data) ? data : [];
      setRecursos(lista);
      if (lista.length > 0 && !selectedId) setSelectedId(lista[0].id);
    } catch (err: any) {
      setError(err.message || 'Error cargando recursos');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadMetricas = useCallback(async () => {
    if (!selectedId || tab !== 'metricas') return;
    try {
      setLoadingMetricas(true);
      const res = await fetch(`/api/colaborador/metricas?recursoId=${selectedId}&days=${metricasDays}`);
      if (!res.ok) throw new Error('Error cargando métricas');
      setMetricas(await res.json());
    } catch {
      setMetricas(null);
    } finally {
      setLoadingMetricas(false);
    }
  }, [selectedId, metricasDays, tab]);

  useEffect(() => { loadRecursos(); }, []);
  useEffect(() => { loadMetricas(); }, [loadMetricas]);

  const recurso = recursos.find((r) => r.id === selectedId) ?? null;
  const dias = metricas?.dias ?? metricas?.ultimosDias ?? [];

  const handleToggleCerrado = async (r: Recurso) => {
    try {
      const res = await fetch('/api/colaborador/cerrado-temporal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recursoId: r.id, cerradoTemporal: !r.cerradoTemporal }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      setRecursos((prev) => prev.map((x) => x.id === r.id ? { ...x, cerradoTemporal: !x.cerradoTemporal } : x));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="py-12 text-center text-muted-foreground">Cargando recursos...</p>;
  if (error) return (
    <div className="py-12 text-center">
      <p className="text-destructive">{error}</p>
      <p className="mt-2 text-sm text-muted-foreground">Asegúrate de haber iniciado sesión con una cuenta de colaborador.</p>
    </div>
  );
  if (recursos.length === 0) return (
    <div className="py-12 text-center">
      <h2 className="text-lg font-semibold">Sin recursos asignados</h2>
      <p className="mt-2 text-sm text-muted-foreground">No tienes ningún recurso turístico asignado. Contacta con el alcalde o administrador.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Selector de recurso (si hay más de uno) */}
      {recursos.length > 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map((r) => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); setTab('metricas'); }}
              className={`rounded-xl border p-4 text-left transition-all ${selectedId === r.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'}`}>
              <div className="font-medium">{r.nombre}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {r.pueblo?.nombre ?? (r.puebloId ? `Pueblo ${r.puebloId}` : 'Asociación')} · {r.tipo}
              </div>
            </button>
          ))}
        </div>
      )}

      {recurso && (
        <div>
          {/* Cabecera del recurso */}
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm mb-4">
            <div>
              <h2 className="text-xl font-semibold">{recurso.nombre}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {recurso.pueblo?.nombre ?? 'Asociación'} · <span className="uppercase tracking-wide text-xs">{recurso.tipo}</span>
                {recurso.descuentoPorcentaje != null && (
                  <span className="ml-2 font-medium text-green-600">{recurso.descuentoPorcentaje}% dto.</span>
                )}
                {recurso.activo
                  ? <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activo</span>
                  : <span className="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactivo</span>}
                {recurso.cerradoTemporal && (
                  <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">⚠ Cerrado</span>
                )}
              </p>
              {/* Condiciones del descuento */}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1">
                  Adultos: <strong>{recurso.maxAdultos ?? 1}</strong>
                </span>
                {(recurso.maxMenores ?? 0) > 0 && (
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1">
                    Menores: <strong>{recurso.maxMenores}</strong> (hasta {recurso.edadMaxMenor ?? 12} años)
                  </span>
                )}
                {recurso.precioCents != null && (
                  <span className="rounded-lg bg-gray-50 border border-gray-200 px-2 py-1">
                    Precio: <strong>{(recurso.precioCents / 100).toFixed(2)} €</strong>
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleToggleCerrado(recurso)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${recurso.cerradoTemporal ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-border bg-card text-foreground hover:bg-accent'}`}>
                {recurso.cerradoTemporal ? 'Reabrir recurso' : 'Cerrar temporalmente'}
              </button>
              <a href={`/api/colaborador/export-csv?recursoId=${recurso.id}&days=${metricasDays}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Exportar CSV
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <nav className="-mb-px flex gap-6 text-sm">
              {(['metricas', 'info'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`border-b-2 pb-2 font-medium transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {t === 'metricas' ? 'Métricas' : 'Información y horarios'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab métricas */}
          {tab === 'metricas' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {PERIODOS.map((p) => (
                  <button key={p.days} onClick={() => setMetricasDays(p.days)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${metricasDays === p.days ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {loadingMetricas ? (
                <p className="py-8 text-center text-muted-foreground">Cargando métricas...</p>
              ) : metricas ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Validaciones hoy" value={metricas.hoy.ok} color="text-green-600" />
                    <StatCard label="Rechazados hoy" value={metricas.hoy.noOk} color="text-destructive" />
                    <StatCard label="Adultos hoy" value={metricas.hoy.adultos} />
                    <StatCard label="Menores hoy" value={metricas.hoy.menores} />
                    <StatCard label={`Total OK (${metricasDays}d)`} value={metricas.periodo?.ok ?? dias.reduce((s, d) => s + d.ok, 0)} color="text-primary" />
                  </div>

                  {dias.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <h3 className="mb-4 font-semibold">Validaciones por día</h3>
                      <div className="flex items-end gap-1" style={{ height: 140 }}>
                        {dias.map((d) => {
                          const maxVal = Math.max(...dias.map((x) => x.ok), 1);
                          const h = Math.max((d.ok / maxVal) * 100, 3);
                          return (
                            <div key={d.fecha} className="flex flex-1 flex-col items-center">
                              <span className="mb-1 text-xs font-medium text-foreground">{d.ok > 0 ? d.ok : ''}</span>
                              <div className="w-full rounded-t-md bg-primary transition-all" style={{ height: `${h}%`, minHeight: 3, maxWidth: 32 }} title={`${d.fecha}: ${d.ok} OK`} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex gap-1">
                        {dias.map((d) => (
                          <div key={d.fecha} className="flex-1 overflow-hidden text-center text-[10px] text-muted-foreground">{d.fecha.slice(5)}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metricas.ultimosEscaneos && metricas.ultimosEscaneos.length > 0 && (
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                      <div className="border-b bg-muted/30 px-5 py-3">
                        <h3 className="font-semibold">Últimas validaciones</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b text-left">
                            <tr>
                              <th className="px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                              <th className="px-5 py-3 font-medium text-muted-foreground">Hora</th>
                              <th className="px-5 py-3 font-medium text-muted-foreground">Resultado</th>
                              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Adultos</th>
                              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Menores</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {metricas.ultimosEscaneos.map((e, i) => (
                              <tr key={i} className="hover:bg-accent/50">
                                <td className="px-5 py-2.5">{e.scannedAt ? new Date(e.scannedAt).toLocaleDateString('es-ES') : '-'}</td>
                                <td className="px-5 py-2.5">{e.hora}</td>
                                <td className="px-5 py-2.5">
                                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${e.resultado === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.resultado}</span>
                                </td>
                                <td className="px-5 py-2.5 text-right">{e.adultosUsados}</td>
                                <td className="px-5 py-2.5 text-right">{e.menoresUsados}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No hay datos de métricas disponibles.</p>
              )}
            </div>
          )}

          {/* Tab información y horarios */}
          {tab === 'info' && (
            <EditarRecursoForm
              recurso={recurso}
              onSaved={() => { loadRecursos(); setTab('metricas'); }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulario de edición ────────────────────────────────────────────────────

function EditarRecursoForm({ recurso, onSaved }: { recurso: Recurso; onSaved: () => void }) {
  const isAsociacion = !recurso.puebloId || recurso.scope === 'ASOCIACION';

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
    cerradoTemporal: recurso.cerradoTemporal,
    maxAdultos: recurso.maxAdultos ?? 1,
    maxMenores: recurso.maxMenores ?? 0,
    edadMaxMenor: recurso.edadMaxMenor ?? 12,
  });
  const [horariosSemana, setHorariosSemana] = useState<HorarioDia[]>(recurso.horariosSemana ?? []);
  const [cierresEspeciales, setCierresEspeciales] = useState<CierreEspecial[]>(recurso.cierresEspeciales ?? []);
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
      const { url } = await uploadImageToR2(file, isAsociacion ? 'recursos-asociacion' : 'recursos-pueblo');
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
        cerradoTemporal: form.cerradoTemporal,
        provincia: form.provincia.trim(),
        comunidad: form.comunidad.trim(),
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        maxAdultos: form.maxAdultos,
        maxMenores: form.maxMenores,
        edadMaxMenor: form.edadMaxMenor,
        descuentoPorcentaje: form.descuentoPorcentaje ? Number(form.descuentoPorcentaje) : null,
        precioCents: form.precioCents ? Math.round(Number(form.precioCents) * 100) : null,
        horariosSemana,
        cierresEspeciales,
      };
      if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
      else body.descripcion = null;
      if (form.horarios.trim()) body.horarios = form.horarios.trim();
      if (form.contacto.trim()) body.contacto = form.contacto.trim();
      if (form.web.trim()) body.web = form.web.trim();
      if (form.fotoUrl.trim()) body.fotoUrl = form.fotoUrl.trim();

      // Endpoint con scope para distinguir pueblo vs asociación
      const scopeParam = isAsociacion ? '' : '?scope=PUEBLO';
      const res = await fetch(`/api/colaborador/recursos/${recurso.id}${scopeParam}`, {
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
    <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
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
          <p className="mt-1 text-xs text-gray-400">Se traducirá automáticamente a 6 idiomas.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <input value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
          rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-gray-400">Se traducirá automáticamente a 6 idiomas.</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
          <input value={form.contacto} onChange={(e) => set('contacto', e.target.value)}
            placeholder="info@ejemplo.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Web</label>
          <input value={form.web} onChange={(e) => set('web', e.target.value)}
            placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
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

      {/* Precios y condiciones */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-4">Precios y condiciones del Club</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio regular (€)</label>
            <input type="number" min="0" step="0.01" value={form.precioCents}
              onChange={(e) => set('precioCents', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Club (%)</label>
            <input type="number" min="0" max="100" value={form.descuentoPorcentaje}
              onChange={(e) => set('descuentoPorcentaje', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máx. adultos</label>
            <input type="number" min="1" max="20" value={form.maxAdultos}
              onChange={(e) => set('maxAdultos', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
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
      </div>

      {/* Horarios y cierres especiales */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Horarios y cierres especiales</h3>
        <HorariosEditor
          horariosSemana={horariosSemana}
          cierresEspeciales={cierresEspeciales}
          onChange={(h, c) => { setHorariosSemana(h); setCierresEspeciales(c); }}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.cerradoTemporal} onChange={(e) => set('cerradoTemporal', e.target.checked)} className="rounded" />
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
      <div className={`text-3xl font-bold ${color ?? 'text-foreground'}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
