'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BedDouble,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Sparkles,
  Star,
  Building2,
  Gift,
  Sparkle,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';

type LucideIconType = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;

// ─── Types ────────────────────────────────────────────────────────────────

type Beneficios = {
  descuentoPorcentaje: number | null;
  regalo: boolean;
  regaloTitulo: string | null;
  regaloDescripcion: string | null;
  regaloFotoUrl: string | null;
  regaloCondiciones: string | null;
  ofertasCount: number;
};

type Negocio = {
  id: number;
  slug: string;
  nombre: string;
  tipo: string;
  tipoLabel: string;
  categoria: 'DORMIR' | 'COMER' | 'COMPRAR' | 'ACTIVIDADES' | 'OTROS';
  descripcion: string | null;
  fotoUrl: string | null;
  planNegocio: string;
  puntosClub: number | null;
  esSelection: boolean;
  pueblo: { id: number; nombre: string; slug: string } | null;
  provincia: string | null;
  localidad: string | null;
  telefono: string | null;
  web: string | null;
  whatsapp: string | null;
  bookingUrl: string | null;
  beneficios: Beneficios;
  ofertas: Array<{
    id: number;
    titulo: string;
    descripcion: string | null;
    descuentoPorcentaje: number | null;
    valorFijoCents: number | null;
    condicionTexto: string | null;
  }>;
};

type Categoria = {
  id: 'DORMIR' | 'COMER' | 'COMPRAR' | 'ACTIVIDADES' | 'OTROS' | 'SELECTION';
  label: string;
  count: number;
};

type Data = {
  total: number;
  categorias: Categoria[];
  porCategoria: Record<string, Negocio[]>;
  porPueblo: Array<{ puebloId: number; puebloNombre: string; puebloSlug: string; items: Negocio[] }>;
  selection: Negocio[];
};

type Tab = 'DORMIR' | 'COMER' | 'COMPRAR' | 'ACTIVIDADES' | 'OTROS' | 'SELECTION' | 'POR_PUEBLO';

const TAB_KEYS: Record<Tab, string> = {
  DORMIR: 'tabDormir',
  COMER: 'tabComer',
  COMPRAR: 'tabComprar',
  ACTIVIDADES: 'tabActividades',
  OTROS: 'tabOtros',
  SELECTION: 'tabSelection',
  POR_PUEBLO: 'tabPorPueblo',
};

const TAB_ICONS: Record<Tab, LucideIconType> = {
  DORMIR: BedDouble,
  COMER: UtensilsCrossed,
  COMPRAR: ShoppingBag,
  ACTIVIDADES: Bike,
  OTROS: Sparkles,
  SELECTION: Star,
  POR_PUEBLO: Building2,
};

function TabIcon({ tab, size = 16 }: { tab: Tab; size?: number }) {
  const Icon = TAB_ICONS[tab];
  return <Icon size={size} aria-hidden />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatEuros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function ClubNegociosPage() {
  const t = useTranslations('clubNegociosWeb');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('DORMIR');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/club/negocios-disponibles', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? t('loadError'));
        }
        const json: Data = await res.json();
        setData(json);
        const firstWith =
          json.categorias.find(
            (c) => c.count > 0 && (c.id === 'DORMIR' || c.id === 'COMER' || c.id === 'COMPRAR' || c.id === 'ACTIVIDADES' || c.id === 'OTROS' || c.id === 'SELECTION'),
          )?.id ?? 'DORMIR';
        setTab(firstWith as Tab);
      } catch (e: any) {
        setError(e?.message ?? t('errorGeneric'));
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered: Negocio[] = useMemo(() => {
    if (!data) return [];
    let base: Negocio[] = [];
    if (tab === 'SELECTION') base = data.selection;
    else if (tab === 'POR_PUEBLO') base = data.porPueblo.flatMap((p) => p.items);
    else base = data.porCategoria[tab] ?? [];
    if (!search.trim()) return base;
    const s = search.trim().toLowerCase();
    return base.filter(
      (n) =>
        n.nombre.toLowerCase().includes(s) ||
        n.tipoLabel.toLowerCase().includes(s) ||
        n.pueblo?.nombre.toLowerCase().includes(s),
    );
  }, [data, tab, search]);

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Headline as="h1">{t('title')}</Headline>
            <Caption className="mt-1 block">
              {t('subtitle')}
            </Caption>
          </div>
          <Link
            href="/mi-cuenta/club"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← {t('back')}
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              'DORMIR',
              'COMER',
              'COMPRAR',
              'ACTIVIDADES',
              'OTROS',
              'SELECTION',
              'POR_PUEBLO',
            ] as Tab[]
          ).map((tabId) => {
            const cat = data?.categorias.find((c) => c.id === tabId);
            const count =
              tabId === 'POR_PUEBLO'
                ? data?.porPueblo.length ?? 0
                : cat?.count ?? 0;
            const isActive = tab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <TabIcon tab={tabId} />
                <span>{t(TAB_KEYS[tabId])}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t('loading')}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : tab === 'POR_PUEBLO' ? (
          <PorPuebloList porPueblo={data?.porPueblo ?? []} search={search} t={t} />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} t={t} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n) => (
              <NegocioCard key={n.id} negocio={n} t={t} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

// ─── NegocioCard ──────────────────────────────────────────────────────────

function NegocioCard({ negocio: n, t }: { negocio: Negocio; t: ReturnType<typeof useTranslations> }) {
  const hrefDetalle = n.pueblo
    ? `/pueblos/${n.pueblo.slug}/club/${n.slug}`
    : `/selection/${n.slug}`;

  return (
    <Link
      href={hrefDetalle}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {n.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={n.fotoUrl}
            alt={n.nombre}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            {(() => {
              const cat: Tab =
                n.categoria === 'DORMIR' ||
                n.categoria === 'COMER' ||
                n.categoria === 'COMPRAR' ||
                n.categoria === 'ACTIVIDADES'
                  ? n.categoria
                  : 'OTROS';
              const Icon = TAB_ICONS[cat];
              return <Icon size={40} aria-hidden />;
            })()}
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {n.esSelection && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 shadow-sm backdrop-blur-sm">
              <Star size={12} aria-hidden /> {t('selectionBadge')}
            </span>
          )}
          {n.beneficios.descuentoPorcentaje && n.beneficios.descuentoPorcentaje > 0 && (
            <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {t('discountBadge', { n: n.beneficios.descuentoPorcentaje })}
            </span>
          )}
          {n.beneficios.regalo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              <Gift size={12} aria-hidden /> {t('giftBadge')}
            </span>
          )}
          {n.beneficios.ofertasCount > 0 && (
            <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {n.beneficios.ofertasCount === 1
                ? t('offersOne', { n: n.beneficios.ofertasCount })
                : t('offersMany', { n: n.beneficios.ofertasCount })}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
            {n.nombre}
          </h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {n.tipoLabel}
          {n.pueblo && <> · {n.pueblo.nombre}</>}
          {!n.pueblo && n.localidad && (
            <>
              {' '}
              · {n.localidad}
              {n.provincia && `, ${n.provincia}`}
            </>
          )}
        </div>
        {n.descripcion && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{n.descripcion}</p>
        )}

        {/* Puntos Club */}
        {n.puntosClub != null && (
          <div className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            +{n.puntosClub} pts al validar
          </div>
        )}

        {/* Beneficios destacados */}
        {(n.beneficios.regaloTitulo || n.ofertas.length > 0) && (
          <div className="mt-1 space-y-1.5 border-t border-border/60 pt-2">
            {n.beneficios.regaloTitulo && (
              <div className="flex items-start gap-1.5 text-xs">
                <Gift size={14} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
                <span className="text-foreground">{n.beneficios.regaloTitulo}</span>
              </div>
            )}
            {n.ofertas.slice(0, 1).map((o) => (
              <div key={o.id} className="flex items-start gap-1.5 text-xs text-foreground">
                <Sparkle size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <span>{o.titulo}</span>
                {o.descuentoPorcentaje && o.descuentoPorcentaje > 0 && (
                  <span className="ml-1 font-semibold text-green-700">(-{o.descuentoPorcentaje}%)</span>
                )}
                {o.valorFijoCents != null && (
                  <span className="ml-1 font-semibold text-green-700">({formatEuros(o.valorFijoCents)})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Por Pueblo List ──────────────────────────────────────────────────────

function PorPuebloList({
  porPueblo,
  search,
  t,
}: {
  porPueblo: Array<{ puebloId: number; puebloNombre: string; puebloSlug: string; items: Negocio[] }>;
  search: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return porPueblo;
    const s = search.trim().toLowerCase();
    return porPueblo
      .map((p) => ({
        ...p,
        items: p.items.filter(
          (n) =>
            n.nombre.toLowerCase().includes(s) ||
            n.tipoLabel.toLowerCase().includes(s) ||
            p.puebloNombre.toLowerCase().includes(s),
        ),
      }))
      .filter((p) => p.items.length > 0);
  }, [porPueblo, search]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('puebloNoMatch')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filtered.map((p) => (
        <section key={p.puebloId}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <Title size="lg">{p.puebloNombre}</Title>
            <Caption>
              {p.items.length === 1
                ? t('puebloCountSingular', { n: p.items.length })
                : t('puebloCountPlural', { n: p.items.length })}
            </Caption>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.items.map((n) => (
              <NegocioCard key={n.id} negocio={n} t={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ tab, t }: { tab: Tab; t: ReturnType<typeof useTranslations> }) {
  const text = t('emptyTabText');
  const lines = text.split('\n');
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <div className="mb-2 flex justify-center text-muted-foreground/60">
        <TabIcon tab={tab} size={40} />
      </div>
      <p className="text-sm text-muted-foreground">
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </div>
  );
}
