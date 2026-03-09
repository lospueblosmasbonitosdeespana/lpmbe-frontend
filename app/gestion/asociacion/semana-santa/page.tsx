'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type DiaConfig = {
  id?: number;
  fecha: string;
  nombreDia: string;
  orden: number;
};

type Config = {
  id: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  activo: boolean;
  dias: DiaConfig[];
};

type PuebloItem = {
  id: number;
  puebloId: number;
  activo: boolean;
  orden: number;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
  };
  _count?: { agenda: number; dias: number };
};

type PuebloOption = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
};

export default function GestionSemanaSantaAsociacionPage() {
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
        fetch('/api/admin/semana-santa/config'),
        fetch('/api/admin/semana-santa/pueblos'),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (pueblosRes.ok) setPueblos(await pueblosRes.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAllPueblos = useCallback(async () => {
    if (allPueblos.length > 0) return;
    const res = await fetch('/api/pueblos');
    if (!res.ok) return;
    const json = await res.json();
    setAllPueblos(Array.isArray(json) ? json : []);
  }, [allPueblos.length]);

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        anio: config.anio,
        fechaInicio: config.fechaInicio,
        fechaFin: config.fechaFin,
        titulo: config.titulo,
        subtitulo: config.subtitulo || undefined,
        descripcion: config.descripcion || undefined,
        activo: config.activo,
        dias: config.dias.map((d, idx) => ({
          fecha: d.fecha,
          nombreDia: d.nombreDia,
          orden: d.orden ?? idx,
        })),
      };
      const res = await fetch('/api/admin/semana-santa/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Error guardando');
      }
      setConfig(await res.json());
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const addPueblo = async (puebloId: number) => {
    try {
      const res = await fetch('/api/admin/semana-santa/pueblos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Error añadiendo pueblo');
      }
      setShowAddPueblo(false);
      setSearchTerm('');
      await loadData();
      setSuccess('Pueblo añadido a Semana Santa');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e?.message ?? 'Error añadiendo pueblo');
    }
  };

  const removePueblo = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" de Semana Santa?`)) return;
    const res = await fetch(`/api/admin/semana-santa/pueblos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar');
      return;
    }
    await loadData();
  };

  const inscribedIds = useMemo(() => new Set(pueblos.map((p) => p.puebloId)), [pueblos]);
  const filteredPueblos = allPueblos.filter(
    (p) =>
      !inscribedIds.has(p.id) &&
      (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.provincia.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">✝️</span>
        <div>
          <h1 className="text-2xl font-semibold">Semana Santa</h1>
          <p className="text-sm text-muted-foreground">
            Activa/desactiva la campaña y configura pueblos participantes.
          </p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab('config')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${tab === 'config' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
        >
          Configuración
        </button>
        <button
          onClick={() => setTab('pueblos')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${tab === 'pueblos' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
        >
          Pueblos participantes ({pueblos.length})
        </button>
      </div>

      {tab === 'config' && config && (
        <div className="space-y-6">
          <section className="rounded-lg border p-5">
            <h2 className="mb-4 text-lg font-semibold">Datos generales</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm">Año</label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.anio}
                  onChange={(e) => setConfig({ ...config, anio: parseInt(e.target.value || '0', 10) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Inicio</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.fechaInicio}
                  onChange={(e) => setConfig({ ...config, fechaInicio: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Fin</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.fechaFin}
                  onChange={(e) => setConfig({ ...config, fechaFin: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Título</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.titulo}
                  onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Subtítulo</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.subtitulo ?? ''}
                  onChange={(e) => setConfig({ ...config, subtitulo: e.target.value || null })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="mb-1 block text-sm">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={config.descripcion ?? ''}
                  onChange={(e) => setConfig({ ...config, descripcion: e.target.value || null })}
                />
              </div>
              <label className="sm:col-span-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.activo}
                  onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                />
                Campaña activa en la web pública
              </label>
            </div>
          </section>

          <section className="rounded-lg border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Días de Semana Santa</h2>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    dias: [...config.dias, { fecha: '', nombreDia: '', orden: config.dias.length }],
                  })
                }
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                + Añadir día
              </button>
            </div>
            <div className="space-y-3">
              {config.dias.map((d, idx) => (
                <div key={`${d.fecha}-${idx}`} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                  <input
                    type="date"
                    className="rounded-md border px-2 py-2 text-sm"
                    value={d.fecha}
                    onChange={(e) => {
                      const next = [...config.dias];
                      next[idx] = { ...next[idx], fecha: e.target.value };
                      setConfig({ ...config, dias: next });
                    }}
                  />
                  <input
                    type="text"
                    className="rounded-md border px-2 py-2 text-sm"
                    placeholder="Nombre del día (ej. Viernes Santo)"
                    value={d.nombreDia}
                    onChange={(e) => {
                      const next = [...config.dias];
                      next[idx] = { ...next[idx], nombreDia: e.target.value };
                      setConfig({ ...config, dias: next });
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600"
                    onClick={() => {
                      const next = config.dias.filter((_, i) => i !== idx).map((x, i) => ({ ...x, orden: i }));
                      setConfig({ ...config, dias: next });
                    }}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {tab === 'pueblos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pueblos participantes</h2>
            <button
              onClick={() => {
                setShowAddPueblo(true);
                loadAllPueblos();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              + Añadir pueblo
            </button>
          </div>

          {showAddPueblo && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Seleccionar pueblo</h3>
                <button className="text-sm text-muted-foreground" onClick={() => setShowAddPueblo(false)}>
                  Cerrar
                </button>
              </div>
              <input
                type="text"
                className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Buscar pueblo o provincia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto">
                {filteredPueblos.slice(0, 50).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addPueblo(p.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-primary/10"
                  >
                    <span>
                      <strong>{p.nombre}</strong> <span className="text-muted-foreground">({p.provincia})</span>
                    </span>
                    <span className="text-primary">Añadir</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pueblos.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No hay pueblos activos para esta campaña.
            </div>
          ) : (
            <div className="space-y-2">
              {pueblos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Link href={`/gestion/pueblos/${p.pueblo.slug}/semana-santa`} className="font-medium text-primary hover:underline">
                      {p.pueblo.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.pueblo.provincia}, {p.pueblo.comunidad}
                      {p._count ? ` · ${p._count.agenda} agenda · ${p._count.dias} días` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/gestion/pueblos/${p.pueblo.slug}/semana-santa`}
                      className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => removePueblo(p.id, p.pueblo.nombre)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    >
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
        <Link href="/gestion/asociacion" className="text-muted-foreground hover:text-foreground hover:underline">
          ← Volver a Gestión Asociación
        </Link>
      </div>
    </main>
  );
}
