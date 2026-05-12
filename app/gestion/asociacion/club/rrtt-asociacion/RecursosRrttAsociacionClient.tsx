'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  Landmark,
  Phone,
  Mail,
  Globe,
  Pencil,
  Trash2,
} from 'lucide-react';

type Recurso = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  activo: boolean;
  scope: string;
  descripcion: string | null;
  fotoUrl: string | null;
  validacionTipo: string;
  codigoQr: string | null;
  provincia: string | null;
  comunidad: string | null;
  localidad: string | null;
  precargadoFuente: string | null;
  precargadoPorIa: boolean | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  precioCents?: number | null;
  descuentoPorcentaje?: number | null;
  lat?: number | null;
  lng?: number | null;
  horarios?: string | null;
};

const SIN_CCAA = 'Sin comunidad asignada';
const SIN_PROVINCIA = 'Sin provincia';

export default function RecursosRrttAsociacionClient() {
  const [items, setItems] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [openCcaas, setOpenCcaas] = useState<Set<string>>(new Set());
  const [openProvs, setOpenProvs] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/recursos-rrtt-asociacion', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error cargando recursos');
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublicar(r: Recurso) {
    const queremosActivar = !r.activo;
    if (
      !confirm(
        queremosActivar
          ? `¿Activar y publicar "${r.nombre}" en la web?`
          : `¿Desactivar "${r.nombre}"? Dejará de aparecer en la web pública.`,
      )
    ) {
      return;
    }
    setError(null);
    setAviso(null);
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/club/recursos/asociacion/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: queremosActivar }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al actualizar');
        return;
      }
      setAviso(
        queremosActivar
          ? `"${r.nombre}" publicado en la web.`
          : `"${r.nombre}" desactivado.`,
      );
      await load();
    } catch {
      setError('Error de red');
    } finally {
      setBusyId(null);
    }
  }

  async function borrar(r: Recurso) {
    if (
      !confirm(
        `¿Borrar "${r.nombre}" definitivamente? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError(null);
    setAviso(null);
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/club/recursos/asociacion/${r.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al borrar');
        return;
      }
      setAviso(`"${r.nombre}" borrado.`);
      await load();
    } catch {
      setError('Error de red');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((r) => {
      if (filtroEstado === 'activos' && !r.activo) return false;
      if (filtroEstado === 'inactivos' && r.activo) return false;
      if (!q) return true;
      return (
        r.nombre.toLowerCase().includes(q) ||
        (r.tipo || '').toLowerCase().includes(q) ||
        (r.descripcion || '').toLowerCase().includes(q) ||
        (r.localidad || '').toLowerCase().includes(q) ||
        (r.provincia || '').toLowerCase().includes(q) ||
        (r.comunidad || '').toLowerCase().includes(q)
      );
    });
  }, [items, busqueda, filtroEstado]);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Recurso[]>>();
    for (const r of filtered) {
      const ccaa = (r.comunidad?.trim() || SIN_CCAA) as string;
      const prov = (r.provincia?.trim() || SIN_PROVINCIA) as string;
      if (!map.has(ccaa)) map.set(ccaa, new Map());
      const m = map.get(ccaa)!;
      if (!m.has(prov)) m.set(prov, []);
      m.get(prov)!.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([ccaa, provMap]) => ({
        ccaa,
        total: Array.from(provMap.values()).reduce((s, l) => s + l.length, 0),
        activos: Array.from(provMap.values()).reduce(
          (s, l) => s + l.filter((r) => r.activo).length,
          0,
        ),
        provincias: Array.from(provMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'es'))
          .map(([prov, lista]) => ({
            prov,
            items: lista,
            activos: lista.filter((r) => r.activo).length,
          })),
      }));
  }, [filtered]);

  const total = items.length;
  const totalActivos = items.filter((r) => r.activo).length;
  const totalInactivos = total - totalActivos;

  const toggleCcaa = (ccaa: string) =>
    setOpenCcaas((prev) => {
      const n = new Set(prev);
      n.has(ccaa) ? n.delete(ccaa) : n.add(ccaa);
      return n;
    });
  const toggleProv = (key: string) =>
    setOpenProvs((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  return (
    <div className="space-y-4">
      {/* Hero amber */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-white p-5 border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-900">RRTT de la Asociación</h1>
            <p className="text-xs text-amber-800">
              Museos, iglesias, castillos, monasterios, palacios, ermitas… ámbito nacional · gestionados por la asociación
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 border border-rose-200">
          {error}
        </div>
      )}
      {aviso && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 border border-emerald-200">
          {aviso}
        </div>
      )}

      {/* Resumen */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
          {total} recursos en total
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
          {totalActivos} activos
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
          {totalInactivos} inactivos
        </span>
        {grouped.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {grouped.length} CCAA · {grouped.reduce((s, c) => s + c.provincias.length, 0)} provincias
          </span>
        )}
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, tipo, descripción, localidad…"
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        <div className="inline-flex rounded-xl border border-border bg-white p-1 text-xs font-semibold">
          {(['todos', 'activos', 'inactivos'] as const).map((opt) => {
            const cnt = opt === 'todos' ? total : opt === 'activos' ? totalActivos : totalInactivos;
            const active = filtroEstado === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFiltroEstado(opt)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt === 'todos' ? 'Todos' : opt === 'activos' ? 'Activos' : 'Inactivos'} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          Cargando RRTT de la asociación…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-8 text-center">
          <Landmark className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <p className="text-sm font-semibold text-amber-900">
            Aún no hay RRTT de la Asociación
          </p>
          <p className="mt-1 text-xs text-amber-700 max-w-md mx-auto">
            Próximamente se cargarán museos, iglesias, castillos, monasterios y demás recursos
            turísticos de toda España gestionados directamente por la asociación. Aparecerán aquí
            agrupados por comunidad y provincia, todos inactivos por defecto.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((cg) => {
            const ccaaOpen = openCcaas.has(cg.ccaa) || busqueda.length > 0;
            return (
              <div
                key={cg.ccaa}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleCcaa(cg.ccaa)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {ccaaOpen ? (
                      <ChevronDown className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="font-bold text-foreground">{cg.ccaa}</span>
                    <span className="text-[11px] text-muted-foreground">
                      · {cg.provincias.length} prov. · {cg.total} recurso{cg.total !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {cg.activos} activos
                    </span>
                    {cg.total - cg.activos > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        {cg.total - cg.activos} inactivos
                      </span>
                    )}
                  </div>
                </button>
                {ccaaOpen && (
                  <div className="border-t border-border bg-muted/5 px-3 pb-3 pt-2 space-y-2">
                    {cg.provincias.map((pg) => {
                      const provKey = `${cg.ccaa}|${pg.prov}`;
                      const provOpen = openProvs.has(provKey) || busqueda.length > 0;
                      return (
                        <div
                          key={pg.prov}
                          className="overflow-hidden rounded-xl border border-border bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleProv(provKey)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {provOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                              )}
                              <MapPin className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-sm font-semibold text-foreground">
                                {pg.prov}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                ({pg.items.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {pg.activos} act.
                              </span>
                              {pg.items.length - pg.activos > 0 && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                  {pg.items.length - pg.activos} inac.
                                </span>
                              )}
                            </div>
                          </button>
                          {provOpen && (
                            <div className="border-t border-border bg-white">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Recurso</th>
                                    <th className="px-3 py-2 text-left">Tipo</th>
                                    <th className="px-3 py-2 text-left">Localidad</th>
                                    <th className="px-3 py-2 text-left">Contacto</th>
                                    <th className="px-3 py-2 text-left">Precio</th>
                                    <th className="px-3 py-2 text-left">Estado</th>
                                    <th className="px-3 py-2 text-right">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pg.items.map((r) => (
                                    <tr key={r.id} className="border-t border-border/60 hover:bg-amber-50/30 align-top">
                                      <td className="px-3 py-2">
                                        <div className="flex items-start gap-2">
                                          {r.fotoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={r.fotoUrl}
                                              alt={r.nombre}
                                              className="h-10 w-10 rounded object-cover shrink-0"
                                            />
                                          ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-50 text-amber-300 shrink-0">
                                              <Landmark className="h-4 w-4" />
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1">
                                              <span className="font-medium text-foreground">{r.nombre}</span>
                                              {r.imprescindible && (
                                                <span
                                                  className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900"
                                                  title={
                                                    r.ratingVerificado?.rating
                                                      ? `Imprescindible · Google ${r.ratingVerificado.rating.toFixed(1)}★ (${r.ratingVerificado.reviews ?? 0} reseñas)`
                                                      : 'Imprescindible · Google ≥ 4,7★'
                                                  }
                                                >
                                                  ⭐ Imprescindible
                                                </span>
                                              )}
                                            </div>
                                            {r.precargadoFuente && (
                                              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                {extraerRating(r.precargadoFuente)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-xs text-muted-foreground capitalize">
                                        {(r.tipo ?? '—').replace(/_/g, ' ').toLowerCase()}
                                      </td>
                                      <td className="px-3 py-2 text-xs text-muted-foreground">
                                        {r.localidad ?? '—'}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        <ContactoCelda telefono={r.telefono} email={r.email} web={r.web} />
                                      </td>
                                      <td className="px-3 py-2 text-xs text-muted-foreground">
                                        {formatPrecio(r.precioCents)}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span
                                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            r.activo
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {r.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <Link
                                            href={`/gestion/asociacion/club/rrtt-asociacion/${r.id}/editar`}
                                            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50"
                                            title="Editar todos los datos"
                                          >
                                            <Pencil className="h-3 w-3" />
                                            Editar
                                          </Link>
                                          <button
                                            type="button"
                                            disabled={busyId === r.id}
                                            onClick={() => togglePublicar(r)}
                                            className={
                                              r.activo
                                                ? 'inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60'
                                                : 'inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60'
                                            }
                                            title={
                                              r.activo
                                                ? 'Quitar de la web pública'
                                                : 'Activar y publicar en la web'
                                            }
                                          >
                                            {busyId === r.id ? '…' : r.activo ? 'Desactivar' : 'Activar'}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={busyId === r.id}
                                            onClick={() => borrar(r)}
                                            className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                            title="Borrar definitivamente"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactoCelda({
  telefono,
  email,
  web,
}: {
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
}) {
  if (!telefono && !email && !web) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
      {telefono && (
        <span className="inline-flex items-center gap-1" title={telefono}>
          <Phone className="h-3 w-3 text-amber-600" />
          <span className="truncate">{telefono}</span>
        </span>
      )}
      {email && (
        <span className="inline-flex items-center gap-1" title={email}>
          <Mail className="h-3 w-3 text-amber-600" />
          <span className="truncate max-w-[160px]">{email}</span>
        </span>
      )}
      {web && (
        <span className="inline-flex items-center gap-1" title={web}>
          <Globe className="h-3 w-3 text-amber-600" />
          <a
            href={web}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate max-w-[160px] text-amber-700 hover:underline"
          >
            {web.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        </span>
      )}
    </div>
  );
}

function formatPrecio(cents: number | null | undefined): string {
  if (cents == null) return '—';
  if (cents === 0) return 'Gratis';
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

/**
 * Lee `precargadoFuente` y devuelve un texto humano con la nota verificada.
 * Mismas marcas que en `RecursosAsociacionClient`:
 *  - "google-places[X/Y]" → ★ X · Y reseñas
 *  - "perplexity-only[X]:google-api-error=STATUS" → ★ X (Google API caída · STATUS)
 *  - "perplexity-only[X]" → ★ X (solo Perplexity)
 *  - "no-verifier[X]" → ★ X (sin verificar · falta API key)
 */
function extraerRating(fuente: string): string {
  const m = fuente.match(/google-places\[([\d.]+)\/(\d+)\]/);
  if (m) return `★ ${m[1]} · ${m[2]} reseñas`;
  const mErr = fuente.match(/perplexity-only\[([\d.]+)\]:google-api-error=([A-Z_]+)/);
  if (mErr) return `★ ${mErr[1]} (Google API caída · ${mErr[2]})`;
  const m2 = fuente.match(/perplexity-only\[([\d.]+)\]/);
  if (m2) return `★ ${m2[1]} (solo Perplexity)`;
  const m3 = fuente.match(/no-verifier\[([\d.?]+)\]/);
  if (m3) return `★ ${m3[1]} (sin verificar · falta API key)`;
  return '';
}
