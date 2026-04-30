'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Gift,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Title, Caption } from '@/app/components/ui/typography';

type Canje = {
  id: number;
  estado: string;
  codigo: string | null;
  puntosUsados: number;
  canjeadoAt: string;
  usadoAt: string | null;
  expiresAt: string | null;
  canceladoAt: string | null;
  motivoCancelacion: string | null;
  recompensa: {
    id: number;
    nombre: string;
    descripcion: string;
    tipo: string;
    categoria: string | null;
    imagen: string | null;
    instrucciones: string | null;
  };
};

const ESTADO_CONFIG: Record<
  string,
  { label: string; tone: 'amber' | 'emerald' | 'rose' | 'zinc' }
> = {
  CANJEADO: { label: 'Activo · listo para usar', tone: 'amber' },
  USADO: { label: 'Usado', tone: 'emerald' },
  CADUCADO: { label: 'Caducado', tone: 'zinc' },
  CANCELADO: { label: 'Cancelado', tone: 'rose' },
  REEMBOLSADO: { label: 'Reembolsado · puntos devueltos', tone: 'emerald' },
};

const TONE_CLASSES: Record<string, string> = {
  amber:
    'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
  emerald:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
  rose:
    'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
  zinc:
    'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
};

export default function MisCanjesPage() {
  const [items, setItems] = useState<Canje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/club/mis-canjes', { cache: 'no-store' });
      if (r.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!r.ok) throw new Error('No se pudieron cargar tus canjes');
      const data = (await r.json()) as Canje[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const activos = items.filter((c) => c.estado === 'CANJEADO');
  const historial = items.filter((c) => c.estado !== 'CANJEADO');

  return (
    <Section>
      <Container>
        <div className="mb-4">
          <Link
            href="/mi-cuenta/club"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} aria-hidden />
            Volver al Club
          </Link>
        </div>

        <div className="mb-6">
          <Title size="xl">Mis cupones</Title>
          <Caption>Todos tus canjes del Club: los activos y los pasados.</Caption>
        </div>

        {loading && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Cargando…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Gift size={28} className="mx-auto mb-3 text-muted-foreground" aria-hidden />
            <Title size="lg" className="mb-1">
              Aún no has canjeado nada
            </Title>
            <Caption>
              Visita la sección de premios para empezar a usar tus puntos.
            </Caption>
            <Link
              href="/mi-cuenta/club/recompensas"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Gift size={14} aria-hidden /> Ver premios
            </Link>
          </div>
        )}

        {activos.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Cupones activos ({activos.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activos.map((c) => (
                <CanjeCard key={c.id} canje={c} />
              ))}
            </div>
          </section>
        )}

        {historial.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico ({historial.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {historial.map((c) => (
                <CanjeCard key={c.id} canje={c} compact />
              ))}
            </div>
          </section>
        )}
      </Container>
    </Section>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CanjeCard({ canje, compact = false }: { canje: Canje; compact?: boolean }) {
  const cfg = ESTADO_CONFIG[canje.estado] ?? {
    label: canje.estado,
    tone: 'zinc' as const,
  };
  const isCancelado = ['CANCELADO', 'REEMBOLSADO'].includes(canje.estado);
  const isCaducado = canje.estado === 'CADUCADO';

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          {isCancelado ? (
            <XCircle size={22} aria-hidden />
          ) : isCaducado ? (
            <AlertTriangle size={22} aria-hidden />
          ) : canje.estado === 'USADO' ? (
            <CheckCircle2 size={22} aria-hidden />
          ) : (
            <Gift size={22} aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {canje.recompensa.nombre}
            </h3>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[cfg.tone]}`}
            >
              {cfg.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Coins size={12} aria-hidden /> {canje.puntosUsados} pts
            </span>
            <span>·</span>
            <span>Canjeado el {formatDate(canje.canjeadoAt)}</span>
            {canje.expiresAt && canje.estado === 'CANJEADO' && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden /> Caduca el {formatDate(canje.expiresAt)}
                </span>
              </>
            )}
          </div>

          {canje.codigo && canje.estado === 'CANJEADO' && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
              <p className="text-xs uppercase tracking-wide text-amber-900/80 dark:text-amber-200/70">
                Código del cupón
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold tracking-widest text-amber-900 dark:text-amber-100">
                {canje.codigo}
              </p>
              {canje.recompensa.instrucciones && (
                <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">
                  {canje.recompensa.instrucciones}
                </p>
              )}
            </div>
          )}

          {!compact && canje.motivoCancelacion && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Motivo: {canje.motivoCancelacion}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
