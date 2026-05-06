'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Pueblo = {
  id: number;
  nombre: string;
  provincia: string;
  comunidad: string;
  radioGeoMetros: number;
};

type DataResponse = {
  items: Pueblo[];
  total: number;
  personalizados: number;
  reducidos: number;
  ampliados: number;
  defaultRadioMetros: number;
  minRadioMetros: number;
  maxRadioMetros: number;
};

const PRESETS = [800, 1200, 1500, 2000, 2500, 3000, 4000];

function formatRadio(m: number): string {
  if (m >= 1000) {
    const km = m / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${m} m`;
}

export default function DistanciasPueblosClient() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'default' | 'reducido' | 'ampliado'>('todos');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/datos/distancias-pueblos', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (filter === 'default') items = items.filter((p) => p.radioGeoMetros === data.defaultRadioMetros);
    if (filter === 'reducido') items = items.filter((p) => p.radioGeoMetros < data.defaultRadioMetros);
    if (filter === 'ampliado') items = items.filter((p) => p.radioGeoMetros > data.defaultRadioMetros);
    const q = search.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.provincia.toLowerCase().includes(q) ||
          p.comunidad.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, search, filter]);

  function startEdit(pueblo: Pueblo) {
    setEditingId(pueblo.id);
    setEditValue(String(pueblo.radioGeoMetros));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: number, overrideValue?: number) {
    if (!data) return;
    const val = overrideValue ?? parseInt(editValue, 10);
    if (
      isNaN(val) ||
      val < data.minRadioMetros ||
      val > data.maxRadioMetros ||
      !Number.isInteger(val)
    ) {
      alert(
        `El radio debe ser un entero entre ${data.minRadioMetros} y ${data.maxRadioMetros} metros`,
      );
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/datos/distancias-pueblos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radioGeoMetros: val }),
      });
      if (!res.ok) throw new Error('Error guardando');
      setData((prev) => {
        if (!prev) return prev;
        const items = prev.items.map((p) => (p.id === id ? { ...p, radioGeoMetros: val } : p));
        const personalizados = items.filter((p) => p.radioGeoMetros !== prev.defaultRadioMetros).length;
        const reducidos = items.filter((p) => p.radioGeoMetros < prev.defaultRadioMetros).length;
        const ampliados = items.filter((p) => p.radioGeoMetros > prev.defaultRadioMetros).length;
        return { ...prev, items, personalizados, reducidos, ampliados };
      });
      setEditingId(null);
    } catch {
      alert('Error al guardar el radio');
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefault(id: number) {
    if (!data) return;
    if (!confirm('¿Restablecer este pueblo a la distancia general (2 km)?')) return;
    await saveEdit(id, data.defaultRadioMetros);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando distancias de pueblos…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <p className="text-red-700">{error ?? 'Error desconocido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Aviso explicativo */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Distancias por pueblo (geofence)</p>
        <p className="mt-1 leading-relaxed">
          Distancia (en metros) que la app usa para considerar al socio <strong>dentro del pueblo</strong> y
          registrar visita GPS. Por defecto <strong>{formatRadio(data.defaultRadioMetros)}</strong>. Bájalo
          en pueblos por los que pasa una carretera importante (Medinaceli, Lerma…) para evitar visitas
          falsas. Súbelo en pueblos muy extensos.
        </p>
        <p className="mt-2 leading-relaxed text-blue-800">
          Rango permitido: {formatRadio(data.minRadioMetros)} – {formatRadio(data.maxRadioMetros)}. Los
          cambios se aplican inmediatamente: la app los lee al cargar la lista de pueblos (cada arranque y
          cada vez que se refresca la geolocalización).
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total pueblos</p>
          <p className="mt-1 text-2xl font-bold">{data.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Por defecto ({formatRadio(data.defaultRadioMetros)})</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {data.total - data.personalizados}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Reducidos</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.reducidos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Ampliados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{data.ampliados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: 'todos' as const, label: `Todos (${data.total})` },
              { key: 'default' as const, label: `Por defecto (${data.total - data.personalizados})` },
              { key: 'reducido' as const, label: `Reducidos (${data.reducidos})` },
              { key: 'ampliado' as const, label: `Ampliados (${data.ampliados})` },
            ]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                filter === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar pueblo, provincia…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comunidad</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Radio</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-72"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isEditing = editingId === p.id;
                const isDefault = p.radioGeoMetros === data.defaultRadioMetros;
                const isReducido = p.radioGeoMetros < data.defaultRadioMetros;
                const isAmpliado = p.radioGeoMetros > data.defaultRadioMetros;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      isEditing ? 'bg-blue-50/60' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{p.id}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{p.nombre}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.provincia}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.comunidad}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={data.minRadioMetros}
                            max={data.maxRadioMetros}
                            step={100}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(p.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-24 rounded border border-blue-400 bg-white px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <span className="text-xs text-muted-foreground">m</span>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            isReducido
                              ? 'text-amber-600'
                              : isAmpliado
                                ? 'text-emerald-600'
                                : 'text-foreground'
                          }`}
                        >
                          {formatRadio(p.radioGeoMetros)}
                          {!isDefault && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                isReducido
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                              title={isReducido ? 'Radio reducido respecto al estándar' : 'Radio ampliado respecto al estándar'}
                            >
                              {isReducido ? '↓' : '↑'}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex flex-wrap justify-center gap-1">
                            {PRESETS.map((preset) => (
                              <button
                                key={preset}
                                onClick={() => setEditValue(String(preset))}
                                className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                                  Number(editValue) === preset
                                    ? 'border-blue-400 bg-blue-100 text-blue-700'
                                    : 'border-border bg-white text-muted-foreground hover:border-blue-300 hover:text-blue-600'
                                }`}
                              >
                                {formatRadio(preset)}
                              </button>
                            ))}
                          </span>
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => saveEdit(p.id)}
                              disabled={saving}
                              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {saving ? '…' : 'Guardar'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/30 disabled:opacity-50"
                            >
                              X
                            </button>
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex gap-1">
                          <button
                            onClick={() => startEdit(p)}
                            className="rounded border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-blue-400 hover:text-blue-600"
                          >
                            Editar
                          </button>
                          {!isDefault && (
                            <button
                              onClick={() => resetToDefault(p.id)}
                              disabled={saving}
                              className="rounded border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-amber-400 hover:text-amber-600 disabled:opacity-50"
                              title="Volver al valor por defecto (2 km)"
                            >
                              Restablecer
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {data.total} pueblos
      </p>
    </div>
  );
}
