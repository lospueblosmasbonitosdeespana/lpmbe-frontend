'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  MapPin,
  Mountain,
  QrCode,
  Route,
  Search,
  Sparkles,
  Store,
} from 'lucide-react';


type ScopeFilter =
  | 'todos'
  | 'PUEBLO_QR'
  | 'PUEBLO_NAT'
  | 'ASOC_QR'
  | 'ASOC_NAT'
  | 'NEGOCIO'
  | 'POI'
  | 'MULTIEXP'
  | 'MULTIEXP_PARADA'
  | 'EVENTO';

type Recurso = {
  id: number;
  kind: 'RECURSO' | 'POI' | 'MULTIEXP' | 'MULTIEXP_PARADA' | 'EVENTO';
  supportsLimits?: boolean;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: 'PUEBLO' | 'ASOCIACION' | 'NEGOCIO';
  pueblo: { id: number; nombre: string; slug: string } | null;
  planNegocio: string | null;
  validacionTipo: string;
  puntosCustom: number | null;
  puntosGenericos: number;
  reglaGenerica: string;
  puntosEfectivos: number;
  cooldownDiasCustom: number | null;
  cooldownDiasGenerico: number;
  cooldownDiasEfectivo: number;
  maxValidacionesPeriodoCustom: number | null;
  maxValidacionesPeriodoGenerico: number | null;
  maxValidacionesPeriodoEfectivo: number | null;
  periodoDiasCustom: number | null;
  periodoDiasGenerico: number | null;
  periodoDiasEfectivo: number | null;
  esSelection: boolean;
};

type Resp = {
  total: number;
  conCustom: number;
  sinCustom: number;
  items: Recurso[];
};

const PLAN_LABEL: Record<string, string> = {
  FREE: 'Gratuito',
  RECOMENDADO: 'Recomendado',
  PREMIUM: 'Premium',
  SELECTION: 'Selection',
};

function isNatural(r: Recurso) {
  return r.kind === 'RECURSO' && (r.validacionTipo === 'GEO' || r.validacionTipo === 'AMBOS');
}

// ─── Badge de validación ────────────────────────────────────────────────────
const PLAN_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  FREE:        { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Negocio Free' },
  RECOMENDADO: { bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Recomendado' },
  PREMIUM:     { bg: 'bg-purple-100',  text: 'text-purple-800',  label: 'Premium' },
  SELECTION:   { bg: 'bg-amber-100',   text: 'text-amber-800',   label: 'Selection' },
};

function ValidacionBadge({ r }: { r: Recurso }) {
  if (r.kind === 'MULTIEXP') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
        <Route className="h-3 w-3" />
        Bonus completa
      </span>
    );
  }
  if (r.kind === 'MULTIEXP_PARADA') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
        <MapPin className="h-3 w-3" />
        Parada custom
      </span>
    );
  }
  if (r.kind === 'EVENTO') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
        <CalendarDays className="h-3 w-3" />
        Evento Club
      </span>
    );
  }
  if (r.kind === 'POI') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-800">
        <MapPin className="h-3 w-3" />
        POI
      </span>
    );
  }
  // Negocios: badge con el plan
  if (r.scope === 'NEGOCIO') {
    const plan = r.planNegocio ?? 'FREE';
    const style = PLAN_BADGE[plan] ?? PLAN_BADGE.FREE;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
        <Store className="h-3 w-3" />
        {style.label}
      </span>
    );
  }
  // Recursos naturales (GPS)
  if (r.validacionTipo === 'GEO') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        <Mountain className="h-3 w-3" />
        Natural GPS
      </span>
    );
  }
  // QR + GPS
  if (r.validacionTipo === 'AMBOS') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
        <QrCode className="h-3 w-3" />
        <MapPin className="h-3 w-3" />
        QR + GPS
      </span>
    );
  }
  // QR normal
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
      <QrCode className="h-3 w-3" />
      QR
    </span>
  );
}

// ─── Tooltip pequeño ────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-block align-middle">
      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 hover:text-muted-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-64 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-[11px] leading-snug text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

// ─── Agrupación por pueblo ───────────────────────────────────────────────────
function groupByPueblo(
  items: Recurso[],
): Array<{ nombre: string; items: Recurso[] }> {
  const map = new Map<string, { nombre: string; items: Recurso[] }>();
  for (const r of items) {
    const key = r.pueblo?.nombre ?? 'Sin pueblo asignado';
    if (!map.has(key)) map.set(key, { nombre: key, items: [] });
    map.get(key)!.items.push(r);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  );
}

// ─── Formato de tope ─────────────────────────────────────────────────────────
function formatTope(
  max: number | null,
  periodo: number | null,
  cooldown: number,
): string {
  if (max != null && periodo != null) return `${max}/${periodo}d`;
  if (cooldown >= 365) return '1/año';
  if (cooldown >= 30) return `1/${Math.round(cooldown / 30)}m`;
  if (cooldown > 1) return `1/${cooldown}d`;
  return '∞';
}

export default function PuntosRecursosClient() {
  const itemKey = (r: Recurso) => `${r.kind}:${r.id}`;
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('todos');
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCooldown, setEditCooldown] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editPeriodo, setEditPeriodo] = useState('');
  const [saving, setSaving] = useState(false);
  // Pueblos colapsados (por nombre de pueblo)
  const [collapsedPueblos, setCollapsedPueblos] = useState<Set<string>>(
    new Set(),
  );
  const [glosarioOpen, setGlosarioOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/club/admin/recursos-puntos', {
        cache: 'no-store',
      });
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

    switch (scopeFilter) {
      case 'PUEBLO_QR':
        items = items.filter((r) => r.scope === 'PUEBLO' && !isNatural(r));
        break;
      case 'PUEBLO_NAT':
        items = items.filter((r) => r.scope === 'PUEBLO' && isNatural(r));
        break;
      case 'ASOC_QR':
        items = items.filter(
          (r) => r.scope === 'ASOCIACION' && !isNatural(r),
        );
        break;
      case 'ASOC_NAT':
        items = items.filter(
          (r) => r.scope === 'ASOCIACION' && isNatural(r),
        );
        break;
      case 'NEGOCIO':
        items = items.filter((r) => r.scope === 'NEGOCIO');
        break;
      case 'POI':
        items = items.filter((r) => r.kind === 'POI');
        break;
      case 'MULTIEXP':
        items = items.filter((r) => r.kind === 'MULTIEXP');
        break;
      case 'MULTIEXP_PARADA':
        items = items.filter((r) => r.kind === 'MULTIEXP_PARADA');
        break;
      case 'EVENTO':
        items = items.filter((r) => r.kind === 'EVENTO');
        break;
      default:
        break;
    }

    const q = search.toLowerCase().trim();
    if (q) {
      items = items.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.pueblo?.nombre.toLowerCase().includes(q) ||
          r.tipo.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, search, scopeFilter]);

  // Conteos para los tabs
  const counts = useMemo(() => {
    if (!data) return {} as Record<ScopeFilter, number>;
    const all = data.items;
    return {
      todos: all.length,
      PUEBLO_QR: all.filter((r) => r.scope === 'PUEBLO' && !isNatural(r))
        .length,
      PUEBLO_NAT: all.filter((r) => r.scope === 'PUEBLO' && isNatural(r))
        .length,
      ASOC_QR: all.filter((r) => r.scope === 'ASOCIACION' && !isNatural(r))
        .length,
      ASOC_NAT: all.filter(
        (r) => r.scope === 'ASOCIACION' && isNatural(r),
      ).length,
      NEGOCIO: all.filter((r) => r.scope === 'NEGOCIO').length,
      POI: all.filter((r) => r.kind === 'POI').length,
      MULTIEXP: all.filter((r) => r.kind === 'MULTIEXP').length,
      MULTIEXP_PARADA: all.filter((r) => r.kind === 'MULTIEXP_PARADA').length,
      EVENTO: all.filter((r) => r.kind === 'EVENTO').length,
    } as Record<ScopeFilter, number>;
  }, [data]);

  const agrupados = useMemo(() => {
    const agrupar = scopeFilter === 'PUEBLO_QR' || scopeFilter === 'PUEBLO_NAT';
    return agrupar ? groupByPueblo(filtered) : null;
  }, [filtered, scopeFilter]);

  function togglePueblo(nombre: string) {
    setCollapsedPueblos((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  }

  function startEdit(r: Recurso) {
    setEditingKey(itemKey(r));
    setEditValue(r.puntosCustom != null ? String(r.puntosCustom) : '');
    setEditCooldown(
      r.cooldownDiasCustom != null ? String(r.cooldownDiasCustom) : '',
    );
    setEditMax(
      r.maxValidacionesPeriodoCustom != null
        ? String(r.maxValidacionesPeriodoCustom)
        : '',
    );
    setEditPeriodo(
      r.periodoDiasCustom != null ? String(r.periodoDiasCustom) : '',
    );
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
    setEditCooldown('');
    setEditMax('');
    setEditPeriodo('');
  }

  async function saveEdit(r: Recurso) {
    const target = data?.items.find((it) => it.id === r.id && it.kind === r.kind);
    if (!target) {
      alert('No se encontró el elemento a editar.');
      return;
    }
    const parseNullableInt = (
      raw: string,
      name: string,
    ): number | null | false => {
      const t = raw.trim();
      if (t === '') return null;
      const v = parseInt(t, 10);
      if (Number.isNaN(v) || v < 0) {
        alert(`${name}: introduce un entero ≥ 0, o vacío para usar el genérico.`);
        return false;
      }
      return v;
    };

    const puntosCustom = parseNullableInt(editValue, 'Puntos');
    if (puntosCustom === false) return;

    const cooldownDiasCustom = target.supportsLimits
      ? parseNullableInt(editCooldown, 'Cooldown')
      : null;
    if (cooldownDiasCustom === false) return;
    const maxValidacionesPeriodoCustom = target.supportsLimits
      ? parseNullableInt(editMax, 'Máx. en periodo')
      : null;
    if (maxValidacionesPeriodoCustom === false) return;
    const periodoDiasCustom = target.supportsLimits
      ? parseNullableInt(editPeriodo, 'Periodo')
      : null;
    if (periodoDiasCustom === false) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/club/admin/recursos/${target.id}/puntos?kind=${encodeURIComponent(target.kind)}`,
        {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puntosCustom,
          ...(target.supportsLimits
            ? {
                cooldownDiasCustom,
                maxValidacionesPeriodoCustom,
                periodoDiasCustom,
              }
            : {}),
        }),
        },
      );
      if (!res.ok) throw new Error('Error guardando');
      await load();
      cancelEdit();
    } catch {
      alert('Error al guardar los ajustes del recurso.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-muted-foreground">Cargando recursos…</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
        {error ?? 'Error desconocido'}
      </div>
    );
  }

  const ALL_TABS: Array<{ key: ScopeFilter; label: string; desc: string }> = [
    { key: 'todos', label: 'Todos', desc: '' },
    {
      key: 'PUEBLO_QR',
      label: 'RRTT pueblos · QR',
      desc: 'Recursos turísticos de los pueblos que se validan escaneando un código QR en el lugar',
    },
    {
      key: 'PUEBLO_NAT',
      label: 'RRTT pueblos · Natural',
      desc: 'Recursos naturales de los pueblos (cascadas, miradores, parajes…) que se validan por GPS',
    },
    {
      key: 'ASOC_QR',
      label: 'RRTT asociación · QR',
      desc: 'Recursos de la asociación (no vinculados a un pueblo concreto) con validación QR',
    },
    {
      key: 'ASOC_NAT',
      label: 'RRTT asociación · Natural',
      desc: 'Recursos naturales de la asociación con validación por GPS',
    },
    { key: 'NEGOCIO', label: 'Negocios', desc: 'Negocios adheridos al Club (hoteles, restaurantes, tiendas…)' },
    {
      key: 'POI',
      label: 'POIs',
      desc: 'Puntos de interés turísticos por pueblo (gamificación individual por POI).',
    },
    {
      key: 'MULTIEXP',
      label: 'Multiexperiencias',
      desc: 'Bonus de puntos por completar cada multiexperiencia.',
    },
    {
      key: 'MULTIEXP_PARADA',
      label: 'Paradas multi',
      desc: 'Puntos por parada custom de multiexperiencias.',
    },
    {
      key: 'EVENTO',
      label: 'Eventos Club',
      desc: 'Puntos por validación de asistencia en eventos del Club.',
    },
  ];
  const TABS = ALL_TABS.filter(
    (t) => t.key === 'todos' || (counts[t.key as ScopeFilter] ?? 0) > 0,
  );

  const visibleCount = filtered.length;

  // ─── Fila de recurso ────────────────────────────────────────────────────
  function buildRows(items: Recurso[]) {
    return items.flatMap((r) => {
      const isEditing = editingKey === itemKey(r);
      const isSelectionSinPuntos = r.esSelection && r.puntosCustom == null;
      const tieneOverride =
        r.puntosCustom != null ||
        r.cooldownDiasCustom != null ||
        r.maxValidacionesPeriodoCustom != null ||
        r.periodoDiasCustom != null;

      const rows: React.ReactNode[] = [
        <tr
          key={r.id}
          className={`border-b border-border transition-colors ${
            isEditing
              ? 'bg-blue-50/60 dark:bg-blue-950/30'
              : isSelectionSinPuntos
              ? 'bg-amber-50/40 dark:bg-amber-950/20'
              : 'hover:bg-muted/30'
          }`}
        >
          {/* Recurso */}
          <td className="px-3 py-2.5">
            <div className="flex items-start gap-2">
              {/* Icono scope */}
              <div className="mt-0.5 shrink-0">
                {r.kind === 'MULTIEXP' ? (
                  <Route className="h-4 w-4 text-violet-600" />
                ) : r.kind === 'MULTIEXP_PARADA' ? (
                  <MapPin className="h-4 w-4 text-indigo-600" />
                ) : r.kind === 'EVENTO' ? (
                  <CalendarDays className="h-4 w-4 text-orange-600" />
                ) : r.kind === 'POI' ? (
                  <MapPin className="h-4 w-4 text-cyan-600" />
                ) : r.esSelection ? (
                  <Sparkles className="h-4 w-4 text-amber-600" />
                ) : isNatural(r) ? (
                  <Mountain className="h-4 w-4 text-teal-600" />
                ) : r.scope === 'NEGOCIO' ? (
                  <Store className="h-4 w-4 text-emerald-600" />
                ) : r.scope === 'ASOCIACION' ? (
                  <Building2 className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Award className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                {/* Badge de tipo de validación — arriba del nombre */}
                <div className="mb-1">
                  <ValidacionBadge r={r} />
                </div>
                <div className="font-medium leading-snug text-foreground">
                  {r.nombre}
                </div>
                {r.scope === 'NEGOCIO' && r.planNegocio && (
                  <div
                    className={`mt-0.5 text-xs ${
                      r.esSelection
                        ? 'font-semibold text-amber-700'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {PLAN_LABEL[r.planNegocio] ?? r.planNegocio}
                  </div>
                )}
              </div>
            </div>
          </td>

          {/* Pueblo / Tipo */}
          <td className="px-3 py-2.5">
            <div className="text-sm font-medium text-foreground">
              {r.pueblo?.nombre ?? (
                <span className="italic text-indigo-700">Asociación</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{r.tipo}</div>
          </td>

          {/* Puntos */}
          <td className="px-3 py-2.5 text-right tabular-nums">
            <div className="text-base font-bold text-foreground">
              {r.puntosEfectivos > 0 ? (
                r.puntosEfectivos
              ) : (
                <span className="text-red-500">0</span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              gen: {r.puntosGenericos}
              {r.puntosCustom != null && (
                <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800">
                  custom
                </span>
              )}
            </div>
          </td>

          {/* Tope / Cooldown */}
          <td className="px-3 py-2.5 text-right tabular-nums text-sm">
            {r.supportsLimits ? (
              <>
                <div className="font-semibold text-foreground">
                  {formatTope(
                    r.maxValidacionesPeriodoEfectivo,
                    r.periodoDiasEfectivo,
                    r.cooldownDiasEfectivo,
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  espera: {r.cooldownDiasEfectivo}d
                  {(r.cooldownDiasCustom != null ||
                    r.maxValidacionesPeriodoCustom != null ||
                    r.periodoDiasCustom != null) && (
                    <span className="ml-1 rounded bg-amber-100 px-1 text-amber-800">
                      custom
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No aplica</div>
            )}
          </td>

          {/* Acción */}
          <td className="px-3 py-2.5 text-center">
            <button
              onClick={() => (isEditing ? cancelEdit() : startEdit(r))}
              className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                isEditing
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-border bg-card text-muted-foreground hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {isEditing ? 'Cerrar' : tieneOverride ? 'Editar' : 'Personalizar'}
            </button>
          </td>
        </tr>,
      ];

      if (isEditing) {
        rows.push(
          <tr
            key={`${itemKey(r)}-editor`}
            className="border-b border-border bg-blue-50/40 dark:bg-blue-950/20"
          >
            <td colSpan={5} className="px-4 py-4">
              <div
                className={`grid grid-cols-1 gap-4 ${
                  r.supportsLimits ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-2'
                }`}
              >
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    Puntos que gana el socio
                    <Tooltip text="Cuántos puntos del Club recibe el socio cuando valida una visita a este recurso. Vacío = se usa el valor genérico de la regla de gamificación." />
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder={`Genérico: ${r.puntosGenericos} pts`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-blue-400 bg-white px-3 py-1.5 text-sm dark:bg-card"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Vacío = usa el genérico ({r.puntosGenericos} pts)
                  </p>
                </div>

                {r.supportsLimits && (
                  <>
                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        Espera entre visitas (días)
                        <Tooltip text="Mínimo de días que deben pasar para que el mismo socio pueda volver a ganar puntos en este recurso. Ejemplo: 365 = solo pueden ganar puntos una vez al año." />
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={`Genérico: ${r.cooldownDiasGenerico} días`}
                        value={editCooldown}
                        onChange={(e) => setEditCooldown(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-blue-400 bg-white px-3 py-1.5 text-sm dark:bg-card"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Vacío = usa el genérico ({r.cooldownDiasGenerico}d)
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        Máx. visitas en el periodo
                        <Tooltip text="Número máximo de veces que el mismo socio puede ganar puntos dentro del periodo indicado. Ejemplo: 3 = máximo 3 veces en el periodo. Úsalo junto al campo 'Días del periodo'." />
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={
                          r.maxValidacionesPeriodoGenerico != null
                            ? `Genérico: ${r.maxValidacionesPeriodoGenerico}`
                            : 'Sin límite'
                        }
                        value={editMax}
                        onChange={(e) => setEditMax(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-blue-400 bg-white px-3 py-1.5 text-sm dark:bg-card"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Vacío = sin tope por periodo
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
                        Días del periodo
                        <Tooltip text="Número de días que forma la ventana del máximo de visitas. Ejemplo: 30 = el límite se cuenta en una ventana de 30 días. Se usa junto a 'Máx. visitas en el periodo'." />
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={
                          r.periodoDiasGenerico != null
                            ? `Genérico: ${r.periodoDiasGenerico}d`
                            : 'Sin periodo'
                        }
                        value={editPeriodo}
                        onChange={(e) => setEditPeriodo(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-blue-400 bg-white px-3 py-1.5 text-sm dark:bg-card"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Ejemplo: máx 5 en 30d = un hotel habitual
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="max-w-md text-[11px] text-muted-foreground">
                  Deja vacío cualquier campo para volver al valor genérico de la
                  regla de gamificación.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/30"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => saveEdit(r)}
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </div>
            </td>
          </tr>,
        );
      }

      return rows;
    });
  }

  // ─── Tabla con agrupación por pueblo ────────────────────────────────────
  function renderTableBody() {
    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
            Sin resultados
          </td>
        </tr>
      );
    }

    if (agrupados) {
      return agrupados.map((grupo) => {
        const collapsed = collapsedPueblos.has(grupo.nombre);
        return (
          <>
            {/* Cabecera de pueblo */}
            <tr key={`grupo-${grupo.nombre}`} className="bg-muted/60">
              <td
                colSpan={5}
                className="cursor-pointer px-3 py-2 select-none"
                onClick={() => togglePueblo(grupo.nombre)}
              >
                <div className="flex items-center gap-2">
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {grupo.nombre}
                  </span>
                  <span className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {grupo.items.length}{' '}
                    {grupo.items.length === 1 ? 'recurso' : 'recursos'}
                  </span>
                </div>
              </td>
            </tr>
            {!collapsed && buildRows(grupo.items)}
          </>
        );
      });
    }

    return buildRows(filtered);
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total recursos</p>
          <p className="mt-1 text-2xl font-bold">{data.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Con puntos personalizados</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.conCustom}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Usan valor genérico</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{data.sinCustom}</p>
        </div>
      </div>

      {/* Glosario colapsable */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <button
          onClick={() => setGlosarioOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            ¿Qué significa cada columna?
          </div>
          {glosarioOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {glosarioOpen && (
          <div className="border-t border-border px-4 py-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <GlosarioItem
                titulo="Puntos"
                desc="Cuántos puntos del Club gana el socio al validar una visita a este recurso. «Gen» es el valor de la regla general (igual para todos los recursos del mismo tipo). «Custom» significa que este recurso tiene un valor propio distinto al genérico."
              />
              <GlosarioItem
                titulo="Tope / Frecuencia"
                desc="Con qué frecuencia puede el mismo socio volver a ganar puntos. «1/365d» = una vez al año. «1/30d» = una vez al mes. «∞» = sin límite (cada visita suma)."
              />
              <GlosarioItem
                titulo="Espera (Cooldown)"
                desc="Días mínimos que deben pasar entre dos validaciones del mismo socio en el mismo recurso. Sirve para evitar que alguien escanee el QR 10 veces seguidas."
              />
              <GlosarioItem
                titulo="QR"
                desc="El recurso se valida escaneando un código QR físico que está en el lugar (cartel, folleto, etc.)."
              />
              <GlosarioItem
                titulo="Natural GPS"
                desc="El recurso se valida por geolocalización: el socio debe estar físicamente dentro de un radio del punto. No hay QR; la app comprueba las coordenadas GPS del móvil."
              />
              <GlosarioItem
                titulo="QR + GPS"
                desc="El recurso acepta ambos métodos: tanto QR como geolocalización."
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtros / Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setScopeFilter(tab.key)}
              title={tab.desc}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                scopeFilter === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">
                ({counts[tab.key] ?? 0})
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, pueblo o tipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Descripción del tab activo */}
      {scopeFilter !== 'todos' && (
        <p className="text-xs text-muted-foreground">
          {TABS.find((t) => t.key === scopeFilter)?.desc}
          {(scopeFilter === 'PUEBLO_QR' || scopeFilter === 'PUEBLO_NAT') && (
            <span className="ml-2 font-medium text-foreground">
              — Haz clic en el nombre de un pueblo para expandir / colapsar sus
              recursos.
            </span>
          )}
        </p>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                Recurso
              </th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                Pueblo / Tipo
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                <span className="flex items-center justify-end gap-1">
                  Puntos
                  <Tooltip text="Puntos del Club que gana el socio al validar. Gen = genérico (regla general). Custom = personalizado para este recurso." />
                </span>
              </th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                <span className="flex items-center justify-end gap-1">
                  Frecuencia / Espera
                  <Tooltip text="Con qué frecuencia puede el mismo socio volver a ganar puntos. 'Espera' son los días mínimos entre validaciones del mismo socio." />
                </span>
              </th>
              <th className="w-36 px-3 py-3 text-center font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {visibleCount} de {data.total} elementos gamificables del Club.
      </p>
    </div>
  );
}

function GlosarioItem({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-xs font-semibold text-foreground">{titulo}</p>
      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{desc}</p>
    </div>
  );
}
