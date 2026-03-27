'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Config = {
  id: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  activo: boolean;
};

type PuebloItem = {
  id: number;
  puebloId: number;
  activo: boolean;
  orden: number;
  interesTuristico: string;
  pueblo: { id: number; nombre: string; slug: string; provincia: string; comunidad: string };
  _count?: { eventos: number };
};

type PuebloOption = { id: number; nombre: string; slug: string; provincia: string };

export default function GestionNavidadAsociacionPage() {
  const [tab, setTab] = useState<'config' | 'pueblos'>('config');
  const [config, setConfig] = useState<Config | null>(null);
  const [pueblos, setPueblos] = useState<PuebloItem[]>([]);
  const [allPueblos, setAllPueblos] = useState<PuebloOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPueblo, setShowAddPueblo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, pueblosRes] = await Promise.all([
        fetch('/api/admin/navidad/config'),
        fetch('/api/admin/navidad/pueblos'),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (pueblosRes.ok) setPueblos(await pueblosRes.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadAllPueblos = useCallback(async () => {
    if (allPueblos.length > 0) return;
    const res = await fetch('/api/pueblos');
    if (!res.ok) return;
    setAllPueblos(await res.json());
  }, [allPueblos.length]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2500); };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/navidad/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anio: config.anio,
          fechaInicio: config.fechaInicio,
          fechaFin: config.fechaFin,
          titulo: config.titulo,
          subtitulo: config.subtitulo || undefined,
          descripcion: config.descripcion || undefined,
          activo: config.activo,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error guardando');
      setConfig(await res.json());
      flash('Configuración guardada');
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const addPueblo = async (puebloId: number) => {
    try {
      const res = await fetch('/api/admin/navidad/pueblos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Error añadiendo pueblo');
      setShowAddPueblo(false);
      setSearchTerm('');
      await loadData();
      flash('Pueblo añadido a Navidad');
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const removePueblo = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" de Navidad?`)) return;
    const res = await fetch(`/api/admin/navidad/pueblos/${id}`, { method: 'DELETE' });
    if (!res.ok) { setError('No se pudo eliminar'); return; }
    await loadData();
  };

  const inscribedIds = useMemo(() => new Set(pueblos.map((p) => p.puebloId)), [pueblos]);
  const filteredPueblos = allPueblos.filter(
    (p) => !inscribedIds.has(p.id) &&
      (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.provincia.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) return <main className="mx-auto max-w-5xl p-6"><p className="text-muted-foreground">Cargando...</p></main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">🎄</span>
        <div>
          <h1 className="text-2xl font-semibold">Navidad</h1>
          <p className="text-sm text-muted-foreground">Activa/desactiva la campaña navideña y configura pueblos participantes.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button onClick={() => setTab('config')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${tab === 'config' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
          Configuración
        </button>
        <button onClick={() => setTab('pueblos')} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${tab === 'pueblos' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
          Pueblos participantes ({pueblos.length})
        </button>
      </div>

      {tab === 'config' && config && (
        <div className="space-y-6">
          <section className="rounded-lg border border-red-100 bg-gradient-to-br from-red-50/30 to-green-50/20 p-5">
            <h2 className="mb-4 text-lg font-semibold">Datos generales de la campaña navideña</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm">Año</label>
                <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={config.anio} onChange={(e) => setConfig({ ...config, anio: parseInt(e.target.value || '0', 10) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Inicio campaña</label>
                <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={config.fechaInicio} onChange={(e) => setConfig({ ...config, fechaInicio: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Fin campaña</label>
                <input type="date" className="w-full rounded-md border px-3 py-2 text-sm" value={config.fechaFin} onChange={(e) => setConfig({ ...config, fechaFin: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Título</label>
                <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" value={config.titulo} onChange={(e) => setConfig({ ...config, titulo: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Subtítulo</label>
                <input type="text" className="w-full rounded-md border px-3 py-2 text-sm" value={config.subtitulo ?? ''} onChange={(e) => setConfig({ ...config, subtitulo: e.target.value || null })} />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Descripción</label>
                <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={config.descripcion ?? ''} onChange={(e) => setConfig({ ...config, descripcion: e.target.value || null })} />
              </div>
              <label className="sm:col-span-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={config.activo} onChange={(e) => setConfig({ ...config, activo: e.target.checked })} />
                Campaña navideña activa en la web pública
              </label>
            </div>
          </section>
          <button onClick={saveConfig} disabled={saving} className="rounded-lg bg-red-700 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {tab === 'pueblos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pueblos participantes</h2>
            <button onClick={() => { setShowAddPueblo(true); loadAllPueblos(); }} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white">
              + Añadir pueblo
            </button>
          </div>

          {showAddPueblo && (
            <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Seleccionar pueblo</h3>
                <button className="text-sm text-muted-foreground" onClick={() => setShowAddPueblo(false)}>Cerrar</button>
              </div>
              <input type="text" className="mb-3 w-full rounded-md border px-3 py-2 text-sm" placeholder="Buscar pueblo o provincia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="max-h-64 overflow-y-auto">
                {filteredPueblos.slice(0, 50).map((p) => (
                  <button key={p.id} onClick={() => addPueblo(p.id)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-red-100/50">
                    <span><strong>{p.nombre}</strong> <span className="text-muted-foreground">({p.provincia})</span></span>
                    <span className="text-red-700">Añadir</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pueblos.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">No hay pueblos activos para esta campaña navideña.</div>
          ) : (
            <div className="space-y-2">
              {pueblos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Link href={`/gestion/pueblos/${p.pueblo.slug}/navidad`} className="font-medium text-red-700 hover:underline">
                      {p.pueblo.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.pueblo.provincia}, {p.pueblo.comunidad}
                      {p._count ? ` · ${p._count.eventos} eventos` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/gestion/pueblos/${p.pueblo.slug}/navidad`} className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:border-red-700 hover:text-red-700">
                      Editar
                    </Link>
                    <button onClick={() => removePueblo(p.id, p.pueblo.nombre)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-10 text-sm">
        <Link href="/gestion/asociacion" className="text-muted-foreground hover:text-foreground hover:underline">← Volver a Gestión Asociación</Link>
      </div>
    </main>
  );
}
