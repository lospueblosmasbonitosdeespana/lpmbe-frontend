'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CAMPANA_NAVIDAD } from '../../_components/gestion-campana-themes';

type Config = {
  id: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  activo: boolean;
  gestionActiva: boolean;
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
          gestionActiva: config.gestionActiva,
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

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/gestion/asociacion"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-emerald-300/50 hover:bg-emerald-50/40 hover:text-foreground"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Gestión Asociación
        </Link>
        <div
          className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg"
          style={{ background: CAMPANA_NAVIDAD.heroGradient }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" aria-hidden />
          <h1 className="text-2xl font-bold">Navidad</h1>
          <p className="mt-1 text-sm text-white/90">Cargando campaña…</p>
        </div>
        <p className="text-muted-foreground">Un momento…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/gestion/asociacion"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-emerald-300/50 hover:bg-emerald-50/40 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Gestión Asociación
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8"
        style={{ background: CAMPANA_NAVIDAD.heroGradient }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner ring-1 ring-white/30">
            🎄
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl">Navidad en la red</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-white/90">
              Pino, oro y rojo carmesí: campaña pública, fechas y pueblos con mercadillos, belenes y cabalgatas.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}

      <div className={`mb-6 flex gap-1 p-1 ${CAMPANA_NAVIDAD.tabBar}`}>
        <button type="button" onClick={() => setTab('config')} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${tab === 'config' ? CAMPANA_NAVIDAD.tabActive : CAMPANA_NAVIDAD.tabInactive}`}>
          Configuración
        </button>
        <button type="button" onClick={() => setTab('pueblos')} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${tab === 'pueblos' ? CAMPANA_NAVIDAD.tabActive : CAMPANA_NAVIDAD.tabInactive}`}>
          Pueblos participantes ({pueblos.length})
        </button>
      </div>

      {tab === 'config' && config && (
        <div className="space-y-6">
          <section className={`rounded-xl border p-5 shadow-sm ${CAMPANA_NAVIDAD.sectionAccent}`}>
            <h2 className="mb-4 text-lg font-semibold text-emerald-950 dark:text-emerald-50">Datos generales de la campaña navideña</h2>
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
              <div className="sm:col-span-3 mt-2 space-y-3 rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">Estado de la campaña</p>
                <p className="text-xs text-muted-foreground">
                  Estos dos interruptores son <strong>independientes</strong>. Puedes abrir la
                  zona de gestión a los alcaldes para que vayan rellenando información sin que
                  la página pública esté todavía visible.
                </p>

                {/* 1. Web pública */}
                <label className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.activo}
                    onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-emerald-700"
                  />
                  <div>
                    <span className="text-sm font-semibold">Visible en la web pública</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      Habilita la página{' '}
                      <code className="rounded bg-muted px-1">/navidad</code>{' '}
                      con los pueblos participantes.
                    </p>
                    {config.activo && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Visible en la web pública
                      </div>
                    )}
                  </div>
                </label>

                {/* 2. Gestión activa para alcaldes */}
                <label className="flex items-start gap-3 rounded-lg border border-violet-200 p-3 hover:bg-violet-50/40 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.gestionActiva}
                    onChange={(e) => setConfig({ ...config, gestionActiva: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-violet-600"
                  />
                  <div>
                    <span className="text-sm font-semibold">Abrir la zona de gestión a los alcaldes</span>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      Permite que los alcaldes editen la edición vigente de Navidad{' '}
                      <strong>aunque la web pública aún no esté publicada</strong>. Útil para que
                      vayan preparando descripciones, eventos y carteles con tiempo. Si{' '}
                      <em>«Visible en la web pública»</em> ya está activo, no hace falta tocar
                      este interruptor.
                    </p>
                    {config.gestionActiva && !config.activo && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                        Los alcaldes pueden editar — la web pública aún no se ve
                      </div>
                    )}
                  </div>
                </label>

                {/* 3. Aviso sobre la app móvil */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                  <p className="font-semibold">📱 ¿Y el botón de la app móvil?</p>
                  <p className="mt-1 leading-relaxed">
                    El botón del evento estacional que aparece en la <strong>home de la app</strong>{' '}
                    no se controla aquí. Se elige en una pantalla aparte:
                  </p>
                  <p className="mt-2">
                    <a
                      href="/gestion/asociacion/app/evento-activo"
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
                    >
                      Ir a «Evento estacional de la app» →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
          <button type="button" onClick={saveConfig} disabled={saving} className={CAMPANA_NAVIDAD.primaryButton}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {tab === 'pueblos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pueblos participantes</h2>
            <button type="button" onClick={() => { setShowAddPueblo(true); loadAllPueblos(); }} className={CAMPANA_NAVIDAD.primaryButtonSm}>
              + Añadir pueblo
            </button>
          </div>

          {showAddPueblo && (
            <div className={`p-4 ${CAMPANA_NAVIDAD.formCallout}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Seleccionar pueblo</h3>
                <button className="text-sm text-muted-foreground" onClick={() => setShowAddPueblo(false)}>Cerrar</button>
              </div>
              <input type="text" className="mb-3 w-full rounded-md border px-3 py-2 text-sm" placeholder="Buscar pueblo o provincia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="max-h-64 overflow-y-auto">
                {filteredPueblos.slice(0, 50).map((p) => (
                  <button key={p.id} type="button" onClick={() => addPueblo(p.id)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-emerald-100/60 dark:hover:bg-emerald-950/35">
                    <span><strong>{p.nombre}</strong> <span className="text-muted-foreground">({p.provincia})</span></span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">Añadir</span>
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
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-emerald-100/90 p-4 dark:border-emerald-900/40">
                  <div>
                    <Link href={`/gestion/pueblos/${p.pueblo.slug}/navidad`} className="font-semibold text-emerald-800 hover:text-red-800 hover:underline dark:text-emerald-200 dark:hover:text-amber-100">
                      {p.pueblo.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.pueblo.provincia}, {p.pueblo.comunidad}
                      {p._count ? ` · ${p._count.eventos} eventos` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/gestion/pueblos/${p.pueblo.slug}/navidad`} className="rounded-md border border-emerald-200/80 px-3 py-1.5 text-xs font-medium text-emerald-900/80 hover:border-amber-400 hover:text-red-800 dark:border-emerald-800 dark:text-emerald-200">
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

      <div className="mt-10 border-t border-emerald-100/90 pt-6 text-sm dark:border-emerald-900/40">
        <Link href="/gestion/asociacion" className="font-medium text-emerald-700 hover:text-red-800 hover:underline dark:text-emerald-300 dark:hover:text-amber-100">
          ← Volver a Gestión Asociación
        </Link>
      </div>
    </main>
  );
}
