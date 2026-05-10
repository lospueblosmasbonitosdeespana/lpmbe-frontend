'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type {
  SubvencionEstado,
  SubvencionListResponse,
  SubvencionRelevancia,
  SubvencionRow,
} from './_types';

const RELEVANCIA_LABEL: Record<SubvencionRelevancia, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
  NO_RELEVANTE: 'No relevante',
  PENDIENTE_ANALISIS: 'Pendiente análisis',
};

const RELEVANCIA_TONO: Record<SubvencionRelevancia, string> = {
  ALTA: 'border-rose-300 bg-rose-50 text-rose-900',
  MEDIA: 'border-amber-300 bg-amber-50 text-amber-900',
  BAJA: 'border-slate-300 bg-slate-50 text-slate-700',
  NO_RELEVANTE: 'border-slate-200 bg-slate-50 text-slate-500',
  PENDIENTE_ANALISIS: 'border-violet-300 bg-violet-50 text-violet-800',
};

const ESTADO_LABEL: Record<SubvencionEstado, string> = {
  DETECTADA: 'Detectada',
  EN_REVISION: 'En revisión',
  EN_PREPARACION: 'En preparación',
  SOLICITADA: 'Solicitada',
  DESCARTADA: 'Descartada',
  CONCEDIDA: 'Concedida',
  DENEGADA: 'Denegada',
};

const ESTADOS_TODOS: SubvencionEstado[] = [
  'DETECTADA',
  'EN_REVISION',
  'EN_PREPARACION',
  'SOLICITADA',
  'CONCEDIDA',
  'DENEGADA',
  'DESCARTADA',
];

const RELEVANCIAS_FILTRO: { id: SubvencionRelevancia | 'TODAS'; label: string }[] = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'ALTA', label: 'Alta' },
  { id: 'MEDIA', label: 'Media' },
  { id: 'BAJA', label: 'Baja' },
  { id: 'NO_RELEVANTE', label: 'No relevantes' },
  { id: 'PENDIENTE_ANALISIS', label: 'Sin analizar' },
];

export function SubvencionesClient({
  initial,
}: {
  initial: SubvencionListResponse;
}) {
  const [data, setData] = useState<SubvencionListResponse>(initial);
  const [relevancia, setRelevancia] = useState<SubvencionRelevancia | 'TODAS'>('ALTA');
  const [estado, setEstado] = useState<SubvencionEstado | 'TODOS'>('TODOS');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<SubvencionRow | null>(null);

  // Cargar al cambiar filtros (debounce simple para `q`).
  useEffect(() => {
    const t = setTimeout(() => recargar(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevancia, estado, q]);

  async function recargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (relevancia !== 'TODAS') params.set('relevancia', relevancia);
      if (estado !== 'TODOS') params.set('estado', estado);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/subvenciones?${params}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json: SubvencionListResponse = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <KpiBar kpis={data.kpis} />

      <section className="mt-6 rounded-xl border border-border/60 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Relevancia
          </span>
          {RELEVANCIAS_FILTRO.map((r) => (
            <button
              key={r.id}
              onClick={() => setRelevancia(r.id)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                relevancia === r.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/60 bg-background hover:bg-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tramitación
          </span>
          <button
            onClick={() => setEstado('TODOS')}
            className={`rounded-full border px-3 py-1 text-sm ${
              estado === 'TODOS'
                ? 'border-foreground bg-foreground text-background'
                : 'border-border/60 bg-background hover:bg-muted'
            }`}
          >
            Todos
          </button>
          {ESTADOS_TODOS.map((e) => (
            <button
              key={e}
              onClick={() => setEstado(e)}
              className={`rounded-full border px-3 py-1 text-sm ${
                estado === e
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/60 bg-background hover:bg-muted'
              }`}
            >
              {ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por descripción, ministerio, categoría…"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {loading ? 'Cargando…' : `${data.total} convocatoria${data.total === 1 ? '' : 's'}`}
          </h2>
        </div>

        {data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            {data.kpis.total === 0
              ? 'Sin datos todavía. Ejecuta el agente sabueso-subvenciones desde el panel de Agentes IA para hacer la primera barrida (últimos 60 días).'
              : 'No hay subvenciones con estos filtros.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {data.items.map((s) => (
              <SubvencionCard key={s.id} s={s} onOpen={() => setOpen(s)} />
            ))}
          </ul>
        )}
      </section>

      {open ? (
        <DetalleModal
          s={open}
          onClose={() => setOpen(null)}
          onUpdated={(actualizada) => {
            setOpen(actualizada);
            // Refrescar listado en segundo plano
            recargar();
          }}
        />
      ) : null}
    </>
  );
}

function KpiBar({ kpis }: { kpis: SubvencionListResponse['kpis'] }) {
  const cards = [
    { label: 'Total detectadas', value: kpis.total, tone: 'bg-slate-50 text-slate-900' },
    { label: 'Relevancia alta', value: kpis.alta, tone: 'bg-rose-50 text-rose-900' },
    { label: 'Relevancia media', value: kpis.media, tone: 'bg-amber-50 text-amber-900' },
    {
      label: 'En preparación',
      value: kpis.enPreparacion,
      tone: 'bg-violet-50 text-violet-900',
    },
    {
      label: 'Solicitadas',
      value: kpis.solicitadas,
      tone: 'bg-emerald-50 text-emerald-900',
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border border-border/60 p-4 ${c.tone}`}
        >
          <div className="text-3xl font-bold tabular-nums">{c.value}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide opacity-80">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubvencionCard({
  s,
  onOpen,
}: {
  s: SubvencionRow;
  onOpen: () => void;
}) {
  const importe = s.presupuestoTotalEur
    ? `${Number(s.presupuestoTotalEur).toLocaleString('es-ES')} €`
    : null;
  const plazo = s.textoPlazoFin || s.textoPlazoInicio;
  const fecha = new Date(s.fechaRecepcion);
  const fechaTxt = fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <li className="rounded-xl border border-border/60 bg-white p-5 shadow-sm transition hover:border-amber-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${RELEVANCIA_TONO[s.relevanciaIa]}`}
            >
              {RELEVANCIA_LABEL[s.relevanciaIa]}
            </span>
            {s.categoriaIa ? (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
                {s.categoriaIa}
              </span>
            ) : null}
            {s.mrr ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                MRR / Next Generation
              </span>
            ) : null}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
              {ESTADO_LABEL[s.estadoTramitacion]}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">
            {s.descripcion}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[s.nivel1, s.nivel2, s.nivel3].filter(Boolean).join(' · ')}
          </p>
          {s.motivoIa ? (
            <p className="mt-2 text-sm italic text-slate-600">
              <span className="font-medium not-italic">IA:</span> "{s.motivoIa}"
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <Field label="Publicada">{fechaTxt}</Field>
        <Field label="Importe">{importe ?? '—'}</Field>
        <Field label="Plazo">{plazo ?? '—'}</Field>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {s.urlBdns ? (
          <a
            href={s.urlBdns}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 font-medium text-violet-800 hover:bg-violet-100"
          >
            Ver en BDNS →
          </a>
        ) : null}
        {s.urlBasesReguladoras ? (
          <a
            href={s.urlBasesReguladoras}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            Bases reguladoras (BOE)
          </a>
        ) : null}
        <button
          onClick={onOpen}
          className="ml-auto rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100"
        >
          Tramitación / Notas
        </button>
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function DetalleModal({
  s,
  onClose,
  onUpdated,
}: {
  s: SubvencionRow;
  onClose: () => void;
  onUpdated: (s: SubvencionRow) => void;
}) {
  const [estado, setEstado] = useState<SubvencionEstado>(s.estadoTramitacion);
  const [notas, setNotas] = useState<string>(s.notas ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cambiado = useMemo(
    () => estado !== s.estadoTramitacion || (notas ?? '') !== (s.notas ?? ''),
    [estado, notas, s],
  );

  async function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/subvenciones/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoTramitacion: estado,
          notas: notas.trim() || null,
        }),
      });
      if (!res.ok) {
        setError('No se pudo guardar. Revisa los permisos.');
        return;
      }
      const actualizada: SubvencionRow = await res.json();
      onUpdated(actualizada);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Tramitación interna
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{s.descripcion}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[s.nivel1, s.nivel2, s.nivel3].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estado de tramitación
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as SubvencionEstado)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {ESTADOS_TODOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notas internas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={5}
              placeholder="A quién hemos pasado el expediente, deadlines internos, qué partes faltan…"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={!cambiado || pending}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
