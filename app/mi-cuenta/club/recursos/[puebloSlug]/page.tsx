'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Globe,
  Clock,
  Mail,
  Gift,
  Tag,
  Camera,
  Landmark,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import {
  useRecursosDisponibles,
  type RecursoDisponible,
} from '../../_components/useRecursosDisponibles';
import { useValidacionesClub } from '../../_components/useValidacionesClub';
import { useGamificacionConfig } from '../../_components/useGamificacionConfig';

function formatearHorariosSemana(
  horariosSemana: NonNullable<RecursoDisponible['horariosSemana']>,
  diasCortos: string[],
  fallbackDiaTpl: string,
  cerradoLabel: string,
  abiertoLabel: string,
): string[] {
  return horariosSemana
    .slice()
    .sort((a, b) => a.diaSemana - b.diaSemana)
    .map((h) => {
      const dia = diasCortos[h.diaSemana] ?? fallbackDiaTpl.replace('{n}', String(h.diaSemana));
      if (!h.abierto) return `${dia}: ${cerradoLabel}`;
      const abre = h.horaAbre ?? '';
      const cierra = h.horaCierra ?? '';
      const rango = abre && cierra ? `${abre}–${cierra}` : abre || cierra || abiertoLabel;
      return `${dia}: ${rango}`;
    });
}

function esRecursoVisitado(
  validaciones: any[],
  recursoId: number,
): { visitado: boolean; hoy: boolean } {
  const validacionesOk = validaciones.filter(
    (v) => v.resultado === 'OK' && v.recursoId === recursoId,
  );
  if (validacionesOk.length === 0) return { visitado: false, hoy: false };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const visitadoHoy = validacionesOk.some((v) => {
    const fecha = new Date(v.scannedAt);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime() === hoy.getTime();
  });

  return { visitado: true, hoy: visitadoHoy };
}

function buildMapsLink(r: RecursoDisponible): string | null {
  if (typeof r.lat === 'number' && typeof r.lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
  }
  const parts = [r.nombre, r.puebloNombre, r.provincia, r.comunidad, 'España']
    .filter((x) => typeof x === 'string' && x.trim() !== '')
    .join(', ');
  return parts ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts)}` : null;
}

function buildEmbedSrc(r: RecursoDisponible): string | null {
  if (typeof r.lat === 'number' && typeof r.lng === 'number') {
    const bbox = 0.005;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${
      r.lng - bbox
    }%2C${r.lat - bbox}%2C${r.lng + bbox}%2C${
      r.lat + bbox
    }&layer=mapnik&marker=${r.lat}%2C${r.lng}`;
  }
  return null;
}

export default function RecursosPuebloPage() {
  const t = useTranslations('club');
  const tPueblo = useTranslations('clubRecursosPueblo');
  const tDet = useTranslations('clubRecursoDetalle');
  const tAccount = useTranslations('myAccount');
  const params = useParams();
  const puebloSlug = decodeURIComponent(String(params?.puebloSlug ?? ''));
  const {
    loading: loadingRecursos,
    error: errorRecursos,
    data: recursos,
  } = useRecursosDisponibles();
  const { loading: loadingValidaciones, data: validaciones } =
    useValidacionesClub();
  const { getPuntos } = useGamificacionConfig();
  const puntosPorVisita = getPuntos('RECURSO_VISITADO');

  // Filtrar por slug del pueblo. Compatibilidad: si llegan ids antiguos, filtramos por id.
  const recursosDelPueblo = useMemo<RecursoDisponible[]>(() => {
    if (!puebloSlug) return [];
    if (/^\d+$/.test(puebloSlug)) {
      const id = Number(puebloSlug);
      return recursos.filter((r) => r.puebloId === id);
    }
    return recursos.filter((r) => r.puebloSlug === puebloSlug);
  }, [recursos, puebloSlug]);

  if (loadingRecursos || loadingValidaciones) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-foreground">{tAccount('loading')}</div>
      </div>
    );
  }

  if (errorRecursos) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-red-500">{errorRecursos}</div>
        <div className="mt-4">
          <Link
            href="/mi-cuenta/club/recursos"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ChevronLeft size={16} aria-hidden /> {t('backToTownList')}
          </Link>
        </div>
      </div>
    );
  }

  const puebloNombre =
    recursosDelPueblo[0]?.puebloNombre ?? puebloSlug.replace(/-/g, ' ');

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <Link
          href="/mi-cuenta/club/recursos"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} aria-hidden /> {t('backToTownList')}
        </Link>
        <h1 className="text-2xl font-bold capitalize text-foreground">
          {t('touristResources')} — {puebloNombre}
        </h1>
        {recursosDelPueblo.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {recursosDelPueblo.length === 1
              ? tPueblo('headerSubtitleSingular', { n: 1 })
              : tPueblo('headerSubtitlePlural', { n: recursosDelPueblo.length })}
          </p>
        )}
      </div>

      {recursosDelPueblo.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {t('townNoResources')}
        </p>
      ) : (
        <div className="grid gap-6">
          {recursosDelPueblo.map((r) => {
            const { visitado, hoy } = esRecursoVisitado(validaciones, r.id);
            return (
              <RecursoCard
                key={r.id}
                r={r}
                visitado={visitado}
                visitadoHoy={hoy}
                puntosPorVisita={puntosPorVisita}
                tDet={tDet}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecursoCard({
  r,
  visitado,
  visitadoHoy,
  puntosPorVisita,
  tDet,
}: {
  r: RecursoDisponible;
  visitado: boolean;
  visitadoHoy: boolean;
  puntosPorVisita: number;
  tDet: ReturnType<typeof useTranslations>;
}) {
  const diasCortos = [
    tDet('diaLun'),
    tDet('diaMar'),
    tDet('diaMie'),
    tDet('diaJue'),
    tDet('diaVie'),
    tDet('diaSab'),
    tDet('diaDom'),
  ];

  const fotos = useMemo<{ url: string; alt: string | null }[]>(() => {
    const principal = r.fotoUrl ? [{ url: r.fotoUrl, alt: r.nombre }] : [];
    const extras = (r.imagenes ?? []).map((i) => ({ url: i.url, alt: i.alt ?? null }));
    const seen = new Set<string>();
    return [...principal, ...extras].filter((f) => {
      if (!f.url || seen.has(f.url)) return false;
      seen.add(f.url);
      return true;
    });
  }, [r]);

  const mapsLink = buildMapsLink(r);
  const embedSrc = buildEmbedSrc(r);

  const precioFinal =
    r.precioCents != null && r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0
      ? Math.round(r.precioCents * (1 - r.descuentoPorcentaje / 100))
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Galería */}
      {fotos.length > 0 ? (
        <div
          className={
            fotos.length > 1
              ? 'grid grid-cols-2 gap-1 sm:grid-cols-4'
              : 'grid grid-cols-1'
          }
        >
          {fotos.slice(0, 4).map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${f.url}-${i}`}
              src={f.url}
              alt={f.alt ?? r.nombre}
              className={`w-full object-cover ${
                i === 0 && fotos.length > 1
                  ? 'col-span-2 row-span-2 h-64 sm:h-80'
                  : 'h-32 sm:h-40'
              }`}
              loading="lazy"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-amber-50 text-amber-300">
          <Camera size={36} aria-hidden />
        </div>
      )}

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-3">
        {/* Info principal */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Landmark size={18} className="text-amber-700" aria-hidden />
                {r.nombre}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.tipo}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {visitado && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    visitadoHoy
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <CheckCircle2 size={12} aria-hidden />
                  {visitadoHoy ? tDet('visitedToday') : tDet('visited')}
                </span>
              )}
              {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Tag size={12} aria-hidden />{tDet('discountSocios', { n: r.descuentoPorcentaje })}
                </span>
              )}
              {r.regaloActivo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Gift size={12} aria-hidden /> {tDet('giftBadge')}
                </span>
              )}
              {puntosPorVisita > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white"
                  title={tDet('pointsTooltip', { n: puntosPorVisita })}
                >
                  <Sparkles size={12} aria-hidden />{tDet('pointsBadge', { n: puntosPorVisita })}
                </span>
              )}
            </div>
          </div>

          {r.descripcion && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {r.descripcion}
            </p>
          )}

          {/* Precio */}
          {r.precioCents != null && (
            <div className="mt-3 flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium text-foreground">{tDet('priceLabel')}</span>
              {precioFinal != null ? (
                <>
                  <span className="text-muted-foreground line-through">
                    {(r.precioCents / 100).toFixed(2)} €
                  </span>
                  <span className="text-base font-bold text-green-700">
                    {(precioFinal / 100).toFixed(2)} €
                  </span>
                </>
              ) : (
                <span className="text-base font-semibold text-foreground">
                  {(r.precioCents / 100).toFixed(2)} €
                </span>
              )}
            </div>
          )}

          {/* Aforo */}
          {r.maxAdultos != null && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <CalendarCheck size={12} aria-hidden />
              {r.maxAdultos === 1 && (r.maxMenores ?? 0) === 0
                ? tDet('onlyHolder')
                : `${
                    r.maxAdultos === 1
                      ? tDet('upToAdults', { n: r.maxAdultos })
                      : tDet('upToAdultsPlural', { n: r.maxAdultos })
                  }${
                    (r.maxMenores ?? 0) > 0
                      ? (r.maxMenores === 1
                          ? tDet('plusMinor', { n: r.maxMenores })
                          : tDet('plusMinors', { n: r.maxMenores ?? 0 }))
                      : ''
                  }${(r.maxMenores ?? 0) > 0 ? tDet('minorsAge', { n: r.edadMaxMenor ?? 12 }) : ''}`}
            </div>
          )}

          {/* Horarios por día (si los hay) */}
          {(r.horariosSemana?.length ?? 0) > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground/90">
                <Clock size={16} className="text-muted-foreground" aria-hidden />
                {tDet('scheduleHeading')}
              </div>
              <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-foreground/90 sm:grid-cols-2">
                {formatearHorariosSemana(
                  r.horariosSemana ?? [],
                  diasCortos,
                  tDet('fallbackDia'),
                  tDet('cerrado'),
                  tDet('abierto'),
                ).map((linea, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 tabular-nums">
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Datos prácticos */}
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
            {r.horarios && (
              <li className="flex items-start gap-2">
                <Clock size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="whitespace-pre-line">{r.horarios}</span>
              </li>
            )}
            {(r.lat != null && r.lng != null) || r.provincia ? (
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {r.puebloNombre ? `${r.puebloNombre}` : ''}
                  {r.provincia ? `, ${r.provincia}` : ''}
                </span>
              </li>
            ) : null}
            {r.telefono && (
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <a href={`tel:${r.telefono}`} className="text-primary hover:underline">
                  {r.telefono}
                </a>
              </li>
            )}
            {r.whatsapp && (
              <li className="flex items-start gap-2">
                <MessageCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {tDet('whatsapp')}
                </a>
              </li>
            )}
            {r.email && (
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                  {r.email}
                </a>
              </li>
            )}
            {r.web && (
              <li className="flex items-start gap-2">
                <Globe size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={r.web}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {r.web.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
          </ul>

          {/* Regalo (detalle) */}
          {r.regaloActivo && (r.regaloTitulo || r.regaloDescripcion) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <Gift size={16} aria-hidden /> {r.regaloTitulo ?? tDet('giftDefault')}
              </div>
              {r.regaloDescripcion && (
                <p className="mt-1 whitespace-pre-line text-amber-900/90">
                  {r.regaloDescripcion}
                </p>
              )}
              {r.regaloCondiciones && (
                <p className="mt-2 text-xs text-amber-800/80">
                  {r.regaloCondiciones}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Mapa + cómo llegar */}
        <aside className="space-y-3">
          {embedSrc ? (
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              <iframe
                title={tDet('mapTitle', { nombre: r.nombre })}
                src={embedSrc}
                loading="lazy"
                className="h-48 w-full border-0"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
              {tDet('approxLocation')}
            </div>
          )}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
            >
              <Navigation size={16} aria-hidden /> {tDet('howToGetThere')}
            </a>
          )}
          {r.bookingUrl && (
            <a
              href={r.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              {tDet('bookOrBuy')}
            </a>
          )}
        </aside>
      </div>
    </article>
  );
}
