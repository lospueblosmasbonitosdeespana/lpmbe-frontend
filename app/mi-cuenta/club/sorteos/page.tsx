'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Gift,
  Hourglass,
  Trophy,
  Calendar,
  Users,
  MapPin,
  Cake,
  Ticket,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';

type SorteoMember = {
  id: number;
  slug: string;
  titulo: string;
  descripcion: string;
  premio: string;
  imagenUrl: string | null;
  basesLegales: string;
  organizador: string;
  provinciaFiltro: string | null;
  interesesFiltro: string[];
  edadMinima: number | null;
  tiposSuscripcion: string[];
  validacionesMinimas: number;
  inicioAt: string;
  finAt: string;
  estado: 'PUBLICADO' | 'CERRADO' | 'RESUELTO';
  participantesCount: number;
  numGanadores: number;
  inscrito: boolean;
};

export default function ClubSorteosPage() {
  const t = useTranslations('clubSorteos');
  const locale = useLocale();
  const [sorteos, setSorteos] = useState<SorteoMember[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [openBases, setOpenBases] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/me/sorteos', { cache: 'no-store' });
      if (res.ok) {
        setSorteos(await res.json());
      } else if (res.status === 401) {
        setError(t('needLogin'));
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e?.message ?? t('loadError'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleInscribirme(s: SorteoMember) {
    setActionId(s.id);
    try {
      const res = await fetch(`/api/club/me/sorteos/${s.id}/inscribirme`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message ?? t('couldNotEnroll'));
      } else {
        await load();
      }
    } finally {
      setActionId(null);
    }
  }

  async function handleCancelar(s: SorteoMember) {
    if (!confirm(t('confirmCancel'))) return;
    setActionId(s.id);
    try {
      const res = await fetch(`/api/club/me/sorteos/${s.id}/inscripcion`, { method: 'DELETE' });
      if (res.ok) await load();
    } finally {
      setActionId(null);
    }
  }

  const abiertos = (sorteos ?? []).filter((s) => s.estado === 'PUBLICADO');
  const resueltos = (sorteos ?? []).filter((s) => s.estado === 'RESUELTO');
  const cerrados = (sorteos ?? []).filter((s) => s.estado === 'CERRADO');

  return (
    <Section>
      <Container>
        <Link
          href="/mi-cuenta/club"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900"
        >
          <ChevronLeft size={16} aria-hidden /> {t('back')}
        </Link>
        <Headline>{t('title')}</Headline>
        <Caption className="mb-8 mt-2 block">
          {t('subtitle')}
        </Caption>

        {loading ? (
          <p>{t('loading')}</p>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        ) : (
          <div className="space-y-10">
            <Block
              title={t('sectionOpen')}
              titleIcon={<Gift size={20} className="text-amber-600" aria-hidden />}
              empty={t('noOpen')}
              sorteos={abiertos}
              t={t}
              locale={locale}
              renderAction={(s) =>
                s.inscrito ? (
                  <button
                    onClick={() => handleCancelar(s)}
                    disabled={actionId === s.id}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-muted/40"
                  >
                    {actionId === s.id ? t('btnCancelling') : t('btnCancel')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleInscribirme(s)}
                    disabled={actionId === s.id}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {actionId === s.id ? t('btnEnrolling') : t('btnEnroll')}
                  </button>
                )
              }
              openBases={openBases}
              setOpenBases={setOpenBases}
            />
            <Block
              title={t('sectionClosed')}
              titleIcon={<Hourglass size={20} className="text-sky-600" aria-hidden />}
              empty={t('emptyDash')}
              sorteos={cerrados}
              hideEmpty
              t={t}
              locale={locale}
              openBases={openBases}
              setOpenBases={setOpenBases}
            />
            <Block
              title={t('sectionResolved')}
              titleIcon={<Trophy size={20} className="text-violet-600" aria-hidden />}
              empty={t('emptyDash')}
              sorteos={resueltos}
              hideEmpty
              t={t}
              locale={locale}
              openBases={openBases}
              setOpenBases={setOpenBases}
            />
          </div>
        )}
      </Container>
    </Section>
  );
}

function Block({
  title,
  titleIcon,
  sorteos,
  empty,
  hideEmpty,
  renderAction,
  openBases,
  setOpenBases,
  t,
  locale,
}: {
  title: string;
  titleIcon?: React.ReactNode;
  sorteos: SorteoMember[];
  empty: string;
  hideEmpty?: boolean;
  renderAction?: (s: SorteoMember) => React.ReactNode;
  openBases: number | null;
  setOpenBases: (id: number | null) => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  if (sorteos.length === 0 && hideEmpty) return null;
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        {titleIcon}
        <Title size="lg">{title}</Title>
      </div>
      {sorteos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorteos.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              {s.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imagenUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="h-3 w-full bg-gradient-to-r from-amber-400 via-rose-300 to-emerald-400" />
              )}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">{s.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.descripcion}</p>
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <strong>{t('prizeLabel')}</strong> {s.premio}
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                  <li className="flex items-center gap-1.5">
                    <Calendar size={14} aria-hidden /> {t('endsOn', { fecha: new Date(s.finAt).toLocaleDateString(locale) })}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Users size={14} aria-hidden /> {t('participants', { n: s.participantesCount })}
                  </li>
                  {s.numGanadores > 1 && (
                    <li className="flex items-center gap-1.5">
                      <Trophy size={14} aria-hidden /> {t('winners', { n: s.numGanadores })}
                    </li>
                  )}
                  {s.provinciaFiltro && (
                    <li className="flex items-center gap-1.5">
                      <MapPin size={14} aria-hidden /> {t('onlyProvince', { provincia: s.provinciaFiltro })}
                    </li>
                  )}
                  {s.edadMinima != null && (
                    <li className="flex items-center gap-1.5">
                      <Cake size={14} aria-hidden /> {t('minAge', { n: s.edadMinima })}
                    </li>
                  )}
                  {s.validacionesMinimas > 0 && (
                    <li className="flex items-center gap-1.5">
                      <Ticket size={14} aria-hidden /> {t('minValidations', { n: s.validacionesMinimas })}
                    </li>
                  )}
                </ul>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {renderAction?.(s)}
                  <button
                    type="button"
                    onClick={() => setOpenBases(openBases === s.id ? null : s.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {openBases === s.id ? t('hideBases') : t('viewBases')}
                  </button>
                  {s.inscrito && s.estado === 'PUBLICADO' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <Check size={12} aria-hidden /> {t('enrolled')}
                    </span>
                  )}
                </div>

                {openBases === s.id && (
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-sans text-xs text-gray-800">
                    {s.basesLegales}
                  </pre>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
