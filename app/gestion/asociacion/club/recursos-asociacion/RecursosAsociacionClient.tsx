'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Search } from 'lucide-react';

type Recurso = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  activo: boolean;
  codigoQr: string;
  scope?: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  provincia?: string | null;
  comunidad?: string | null;
  localidad?: string | null;
  fotoUrl?: string | null;
  precargadoFuente?: string | null;
  precargadoPorIa?: boolean | null;
};

type Grupo = {
  comunidad: string;
  total: number;
  activos: number;
  provincias: {
    provincia: string;
    items: Recurso[];
    activos: number;
  }[];
};

const SIN_CCAA = 'Sin comunidad asignada';
const SIN_PROVINCIA = 'Sin provincia';

export default function RecursosAsociacionClient() {
  const [items, setItems] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>(
    'todos',
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/recursos/asociacion', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Error al cargar los recursos');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
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
          ? `¿Activar y publicar "${r.nombre}" en la web?\n\nSe generarán slug y traducciones a 7 idiomas si faltan.`
          : `¿Desactivar "${r.nombre}"? Dejará de aparecer en la web pública.`,
      )
    ) {
      return;
    }
    setError(null);
    setAviso(null);
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/club/recursos-rurales/${r.id}/publicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: queremosActivar }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Error al publicar');
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

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((r) => {
      if (filtroEstado === 'activos' && !r.activo) return false;
      if (filtroEstado === 'inactivos' && r.activo) return false;
      if (!q) return true;
      const haystack = [
        r.nombre,
        r.tipo,
        r.localidad ?? '',
        r.provincia ?? '',
        r.comunidad ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, busqueda, filtroEstado]);

  const grupos: Grupo[] = useMemo(() => {
    const mapCcaa = new Map<
      string,
      Map<string, Recurso[]>
    >();
    for (const r of itemsFiltrados) {
      const ccaa = r.comunidad?.trim() || SIN_CCAA;
      const prov = r.provincia?.trim() || SIN_PROVINCIA;
      if (!mapCcaa.has(ccaa)) mapCcaa.set(ccaa, new Map());
      const provMap = mapCcaa.get(ccaa)!;
      if (!provMap.has(prov)) provMap.set(prov, []);
      provMap.get(prov)!.push(r);
    }
    const out: Grupo[] = [];
    for (const [ccaa, provMap] of mapCcaa.entries()) {
      const provincias: Grupo['provincias'] = [];
      let total = 0;
      let activos = 0;
      for (const [prov, recs] of provMap.entries()) {
        recs.sort((a, b) => a.nombre.localeCompare(b.nombre));
        const provActivos = recs.filter((r) => r.activo).length;
        total += recs.length;
        activos += provActivos;
        provincias.push({ provincia: prov, items: recs, activos: provActivos });
      }
      provincias.sort((a, b) => a.provincia.localeCompare(b.provincia));
      out.push({ comunidad: ccaa, provincias, total, activos });
    }
    out.sort((a, b) => {
      // CCAA "sin comunidad" siempre al final.
      if (a.comunidad === SIN_CCAA) return 1;
      if (b.comunidad === SIN_CCAA) return -1;
      return a.comunidad.localeCompare(b.comunidad);
    });
    return out;
  }, [itemsFiltrados]);

  const totalActivos = items.filter((r) => r.activo).length;
  const totalInactivos = items.length - totalActivos;

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        Cargando recursos…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, comarca, provincia, comunidad…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus:border-emerald-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`rounded px-2 py-1 ${
              filtroEstado === 'todos'
                ? 'bg-emerald-100 font-semibold text-emerald-800'
                : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('activos')}
            className={`rounded px-2 py-1 ${
              filtroEstado === 'activos'
                ? 'bg-emerald-100 font-semibold text-emerald-800'
                : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            Activos ({totalActivos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('inactivos')}
            className={`rounded px-2 py-1 ${
              filtroEstado === 'inactivos'
                ? 'bg-amber-100 font-semibold text-amber-800'
                : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            Inactivos ({totalInactivos})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {aviso && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {aviso}
        </div>
      )}

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? 'Aún no hay recursos de asociación.'
            : 'Ningún recurso coincide con los filtros.'}
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((g) => (
            <CcaaGrupo
              key={g.comunidad}
              grupo={g}
              busyId={busyId}
              onTogglePublicar={togglePublicar}
              expandirPorDefecto={grupos.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CcaaGrupo({
  grupo,
  busyId,
  onTogglePublicar,
  expandirPorDefecto,
}: {
  grupo: Grupo;
  busyId: number | null;
  onTogglePublicar: (r: Recurso) => void;
  expandirPorDefecto: boolean;
}) {
  const [open, setOpen] = useState(expandirPorDefecto);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-foreground">{grupo.comunidad}</span>
          <span className="text-xs text-muted-foreground">
            · {grupo.provincias.length} provincia
            {grupo.provincias.length !== 1 ? 's' : ''} · {grupo.total} recursos
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
            {grupo.activos} activos
          </span>
          {grupo.total - grupo.activos > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
              {grupo.total - grupo.activos} inactivos
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="border-t border-border bg-muted/10">
          {grupo.provincias.map((p) => (
            <ProvinciaGrupo
              key={p.provincia}
              provincia={p.provincia}
              items={p.items}
              activos={p.activos}
              busyId={busyId}
              onTogglePublicar={onTogglePublicar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProvinciaGrupo({
  provincia,
  items,
  activos,
  busyId,
  onTogglePublicar,
}: {
  provincia: string;
  items: Recurso[];
  activos: number;
  busyId: number | null;
  onTogglePublicar: (r: Recurso) => void;
}) {
  const [open, setOpen] = useState(false);
  const inactivos = items.length - activos;
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-6 py-2 text-left hover:bg-muted/30"
      >
        <div className="flex items-center gap-2 text-sm">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium text-foreground">{provincia}</span>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">
            {activos} act.
          </span>
          {inactivos > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
              {inactivos} inac.
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Recurso</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Comarca / localidad</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {r.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.fotoUrl}
                            alt={r.nombre}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-md bg-muted/40" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {r.nombre}
                          </div>
                          {r.precargadoFuente && r.precargadoPorIa && (
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {extraerRating(r.precargadoFuente)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {(r.tipo ?? '—').toLowerCase().replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {r.localidad ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          r.activo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => onTogglePublicar(r)}
                        className={
                          r.activo
                            ? 'inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60'
                            : 'inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60'
                        }
                        title={
                          r.activo
                            ? 'Quitar de la web pública'
                            : 'Activar y publicar (genera slug y 7 idiomas si faltan)'
                        }
                      >
                        {busyId === r.id
                          ? '…'
                          : r.activo
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
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

/**
 * Extrae el rating verificado del campo `precargadoFuente` que escribe
 * el agente IA. Ej: "perplexity-sonar+google-geocoding+google-places[4.7/1850]"
 * → "★ 4.7 / 1850"
 */
function extraerRating(fuente: string): string {
  const m = fuente.match(/google-places\[([\d.]+)\/(\d+)\]/);
  if (m) return `★ ${m[1]} · ${m[2]} reseñas`;
  const m2 = fuente.match(/perplexity-only\[([\d.]+)\]/);
  if (m2) return `★ ${m2[1]} (solo Perplexity)`;
  return '';
}
