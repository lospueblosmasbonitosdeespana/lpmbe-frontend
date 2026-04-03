'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Pueblo = {
  id: number;
  nombre: string;
  provincia: string;
  comunidad: string;
  puntosVisita: number;
};

type DataResponse = {
  items: Pueblo[];
  total: number;
  conPuntos: number;
  sinPuntos: number;
};

export default function PuntosPueblosClient() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'con' | 'sin'>('todos');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/datos/puntos-pueblos', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    if (filter === 'con') items = items.filter((p) => p.puntosVisita > 0);
    if (filter === 'sin') items = items.filter((p) => p.puntosVisita === 0);
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
    setEditValue(String(pueblo.puntosVisita));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: number) {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/datos/puntos-pueblos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntosVisita: val }),
      });
      if (!res.ok) throw new Error('Error guardando');
      setData((prev) => {
        if (!prev) return prev;
        const items = prev.items.map((p) =>
          p.id === id ? { ...p, puntosVisita: val } : p,
        );
        const conPuntos = items.filter((p) => p.puntosVisita > 0).length;
        return { ...prev, items, conPuntos, sinPuntos: prev.total - conPuntos };
      });
      setEditingId(null);
    } catch {
      alert('Error al guardar los puntos');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando puntos de pueblos…
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
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total pueblos</p>
          <p className="mt-1 text-2xl font-bold">{data.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Con puntos</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{data.conPuntos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Sin puntos (0)</p>
          <p className="mt-1 text-2xl font-bold text-red-500">{data.sinPuntos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([
            { key: 'todos' as const, label: `Todos (${data.total})` },
            { key: 'con' as const, label: `Con puntos (${data.conPuntos})` },
            { key: 'sin' as const, label: `Sin puntos (${data.sinPuntos})` },
          ]).map((t) => (
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
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Puntos</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground w-28"></th>
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
                        <input
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(p.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="w-20 rounded border border-blue-400 bg-white px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            p.puntosVisita === 0
                              ? 'text-red-500'
                              : 'text-foreground'
                          }`}
                        >
                          {p.puntosVisita}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {isEditing ? (
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
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          className="rounded border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-blue-400 hover:text-blue-600"
                        >
                          Editar
                        </button>
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
