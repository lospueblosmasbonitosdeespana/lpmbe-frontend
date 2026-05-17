import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Calendar, Plane, Hotel, Languages, Phone, BedDouble, Images, UtensilsCrossed, ExternalLink } from 'lucide-react';
import { getGranEventoBySlug, pickI18n } from '@/lib/grandes-eventos';
import type { GranEventoRestaurante, GranEventoPueblo } from '@/lib/grandes-eventos';
import GranEventoBannerAvisos from './GranEventoBannerAvisos';
import GranEventoPueblos from './GranEventoPueblos';
import GranEventoMapa from './GranEventoMapa';
import GranEventoAlojamientos from './GranEventoAlojamientos';
import GranEventoConcierge from './GranEventoConcierge';
import GranEventoPdfButton from './GranEventoPdfButton';
import GranEventoRestaurantes from './GranEventoRestaurantes';
import ProgramaDiaMeteo from './ProgramaDiaMeteo';
import type { MeteoSlot } from './ProgramaDiaMeteo';

/**
 * Página pública de un Gran Evento (asambleas, encuentros internacionales).
 * Lee toda la información de la BD por slug, soporta i18n automático con
 * fallback al español, y muestra:
 * - Banner de avisos urgentes (con polling y botón WhatsApp).
 * - Hero con logo, título, fechas e intro.
 * - Programa por días.
 * - Tarjetas de pueblos del recorrido.
 * - Mapa interactivo siguiendo carreteras.
 * - Galería de fotos en vivo (si hay).
 * - Logística y contacto urgente.
 */
export default async function GranEventoPage({ slug, albumHref }: { slug: string; albumHref?: string }) {
  const evento = await getGranEventoBySlug(slug);
  if (!evento) notFound();

  const locale = (await getLocale()) || 'es';
  const t = await getTranslations('granEvento');

  const heroKicker = pickI18n(evento.heroKicker_es, evento.heroKicker_i18n, locale);
  const heroTitulo = pickI18n(evento.heroTitulo_es, evento.heroTitulo_i18n, locale);
  const heroSubtitulo = pickI18n(evento.heroSubtitulo_es, evento.heroSubtitulo_i18n, locale);
  const heroIntro = pickI18n(evento.heroIntro_es, evento.heroIntro_i18n, locale);
  const heroFederacion = pickI18n(evento.heroFederacion_es, evento.heroFederacion_i18n, locale);

  const villagesIntro = pickI18n(evento.villagesIntro_es, evento.villagesIntro_i18n, locale);
  const mapIntro = pickI18n(evento.mapIntro_es, evento.mapIntro_i18n, locale);

  const logoUrl = evento.logoUrl && evento.logoUrl.trim() ? evento.logoUrl : null;
  const totalParadasMapa = evento.pueblos.length + (evento.paradas?.length ?? 0);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <GranEventoBannerAvisos slug={evento.slug} eventoTitulo={heroTitulo || evento.nombre} />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-stone-50 to-emerald-50/40" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #854d0e 0%, transparent 50%), radial-gradient(circle at 80% 70%, #15803d 0%, transparent 50%)',
          }}
        />
      </div>

      {/* HERO */}
      <header className="relative px-6 pt-16 pb-10 sm:pt-20 sm:pb-14">
        <div className="mx-auto max-w-5xl">
          {logoUrl ? (
            <div className="mb-8 flex justify-center">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32">
                <Image
                  src={logoUrl}
                  alt={heroFederacion || evento.nombre}
                  fill
                  priority
                  sizes="(max-width: 640px) 112px, 128px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          ) : null}

          {heroKicker ? (
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-700">
              {heroKicker}
            </p>
          ) : null}
          {heroFederacion ? (
            <p className="mt-3 text-center text-sm font-medium text-stone-500 sm:text-base">
              {heroFederacion}
            </p>
          ) : null}

          {heroTitulo ? (
            <h1 className="mx-auto mt-5 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
              {heroTitulo}
            </h1>
          ) : null}

          {heroSubtitulo ? (
            <p className="mt-5 text-center text-base font-medium text-amber-800 sm:text-lg">
              {heroSubtitulo}
            </p>
          ) : null}

          {heroIntro ? (
            <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-stone-600 sm:text-base">
              {heroIntro}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {evento.dias.length > 0 ? (
              <a
                href="#programa"
                className="inline-flex items-center gap-2 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-md ring-1 ring-amber-900/10 transition hover:bg-amber-900 hover:shadow-lg"
              >
                <Calendar className="h-4 w-4" />
                {t('actions.viewProgram')}
              </a>
            ) : null}
            {evento.pdfUrl ? <GranEventoPdfButton pdfUrl={evento.pdfUrl} /> : null}
            {(evento.alojamientos?.length ?? 0) > 0 ? (
              <a
                href="#alojamientos"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-700 hover:text-amber-800 hover:shadow-md"
              >
                <BedDouble className="h-4 w-4" />
                {t('actions.viewAlojamientos')}
              </a>
            ) : null}
            <a
              href="#restaurantes"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-700 hover:text-amber-800 hover:shadow-md"
            >
              <UtensilsCrossed className="h-4 w-4" />
              {t('actions.viewRestaurantes')}
            </a>
            {albumHref ? (
              <Link
                href={albumHref}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-700 hover:text-amber-800 hover:shadow-md"
              >
                <Images className="h-4 w-4" />
                {t('actions.viewAlbum')}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* PROGRAMA */}
      {evento.dias.length > 0 ? (
        <section id="programa" className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
                {t('sections.program')}
              </p>
              <div className="mt-3 inline-flex h-1 w-12 rounded-full bg-amber-700" />
            </div>
            <ProgramaTimeline
              dias={evento.dias}
              locale={locale}
              fechaInicio={evento.fechaInicio}
              restaurantes={evento.restaurantes ?? []}
              pueblos={evento.pueblos}
            />
          </div>
        </section>
      ) : null}

      {/* PUEBLOS */}
      {evento.pueblos.length > 0 ? (
        <section className="border-t border-stone-100 bg-stone-50/50 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
                {t('sections.villages')}
              </p>
              <div className="mt-3 mb-4 inline-flex h-1 w-12 rounded-full bg-amber-700" />
              {villagesIntro ? (
                <p className="text-[15px] leading-relaxed text-stone-600 sm:text-base">{villagesIntro}</p>
              ) : null}
            </div>
            <GranEventoPueblos pueblos={evento.pueblos} locale={locale} />
          </div>
        </section>
      ) : null}

      {/* MAPA */}
      {totalParadasMapa >= 2 ? (
        <section className="border-t border-stone-100 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
                {t('sections.map')}
              </p>
              <div className="mt-3 mb-4 inline-flex h-1 w-12 rounded-full bg-amber-700" />
              {mapIntro ? (
                <p className="text-[15px] leading-relaxed text-stone-600 sm:text-base">{mapIntro}</p>
              ) : null}
            </div>
            <GranEventoMapa pueblos={evento.pueblos} paradas={evento.paradas ?? []} />
          </div>
        </section>
      ) : null}

      {/* ALOJAMIENTOS */}
      {(evento.alojamientos?.length ?? 0) > 0 ? (
        <GranEventoAlojamientos alojamientos={evento.alojamientos} />
      ) : null}

      {/* RESTAURANTES — siempre visible; la sección muestra "próximamente" si está vacía */}
      <GranEventoRestaurantes restaurantes={evento.restaurantes ?? []} />

      {/* LOGÍSTICA */}
      <LogisticaSection evento={evento} locale={locale} />

      {/* FOOTER */}
      {logoUrl || heroFederacion || heroKicker ? (
        <footer className="border-t border-stone-100 px-6 py-12">
          <div className="mx-auto max-w-4xl text-center">
            {logoUrl ? (
              <div className="mx-auto mb-5 h-16 w-16 opacity-80">
                <Image src={logoUrl} alt="" width={64} height={64} style={{ objectFit: 'contain' }} />
              </div>
            ) : null}
            {heroFederacion ? (
              <p className="text-sm font-semibold text-stone-700">{heroFederacion}</p>
            ) : null}
            {heroKicker ? (
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">{heroKicker}</p>
            ) : null}
          </div>
        </footer>
      ) : null}

      {/* CONCIERGE IA */}
      {evento.conciergeActivo ? <GranEventoConcierge slug={evento.slug} /> : null}
    </main>
  );
}

/**
 * Analiza los actos del día para asignar pueblos concretos a tres franjas:
 *   - Mañana (12h): último pueblo mencionado en actos antes de las 15:00.
 *   - Tarde  (18h): último pueblo mencionado en actos entre 15:00 y 20:59.
 *   - Noche  (0h del día siguiente): pueblo donde duermen (último del día
 *     o el mencionado en "traslado al hotel / alojamiento").
 *
 * Caso especial hardcodeado: Benamahoma no es pueblo de la red → se mapea
 * a Grazalema para obtener la temperatura.
 */
function buildMeteoSlots(
  dia: import('@/lib/grandes-eventos').GranEventoDia,
  pueblos: GranEventoPueblo[],
  _diaFecha: string,
): MeteoSlot[] {
  if (pueblos.length === 0) return [];

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const toPuebloRef = (pid: number) => {
    const ep = pueblos.find((p) => p.pueblo.id === pid);
    return ep ? { id: ep.pueblo.id, slug: ep.pueblo.slug, nombre: ep.pueblo.nombre } : null;
  };

  const BENAMAHOMA_ALIAS_ID = pueblos.find(
    (p) => normalize(p.pueblo.nombre) === 'grazalema',
  )?.pueblo.id;

  const actosOrdenados = [...dia.actos].sort((a, b) => a.orden - b.orden);

  function findPuebloInText(text: string): number | null {
    const norm = normalize(text);
    if (norm.includes('benamahoma') && BENAMAHOMA_ALIAS_ID) return BENAMAHOMA_ALIAS_ID;
    for (const ep of pueblos) {
      if (norm.includes(normalize(ep.pueblo.nombre))) return ep.pueblo.id;
    }
    return null;
  }

  function parseHour(hora: string | null): number {
    if (!hora) return 12;
    const match = hora.match(/^(\d{1,2})/);
    return match ? parseInt(match[1], 10) : 12;
  }

  let morningPueblo: number | null = null;
  let afternoonPueblo: number | null = null;
  let nightPueblo: number | null = null;

  for (const acto of actosOrdenados) {
    const h = parseHour(acto.hora);
    const pid = findPuebloInText(acto.texto_es ?? '');
    if (!pid) continue;
    if (h < 15) morningPueblo = pid;
    else if (h < 21) afternoonPueblo = pid;
    else nightPueblo = pid;
  }

  // Also check the day title for fallback
  const titlePueblos: number[] = [];
  const tituloNorm = normalize(dia.titulo_es ?? '');
  for (const ep of pueblos) {
    if (tituloNorm.includes(normalize(ep.pueblo.nombre))) titlePueblos.push(ep.pueblo.id);
  }

  if (!morningPueblo) morningPueblo = titlePueblos[0] ?? null;
  if (!afternoonPueblo && titlePueblos.length > 1) afternoonPueblo = titlePueblos[titlePueblos.length - 1];
  if (!afternoonPueblo) afternoonPueblo = morningPueblo;

  // Night = where they sleep = last pueblo mentioned, or afternoon pueblo
  if (!nightPueblo) nightPueblo = afternoonPueblo ?? morningPueblo;

  const slots: MeteoSlot[] = [];
  if (morningPueblo) {
    const ref = toPuebloRef(morningPueblo);
    if (ref) slots.push({ pueblo: ref, period: 'morning' });
  }
  if (afternoonPueblo) {
    const ref = toPuebloRef(afternoonPueblo);
    if (ref) slots.push({ pueblo: ref, period: 'afternoon' });
  }
  if (nightPueblo) {
    const ref = toPuebloRef(nightPueblo);
    if (ref) slots.push({ pueblo: ref, period: 'night' });
  }

  return slots;
}

/** Detecta si un texto de acto hace referencia a una comida o cena. */
function detectTipoComida(texto: string): 'comida' | 'cena' | null {
  const t = texto.toLowerCase();
  if (/\b(almuerzo|comida|lunch|pranzo|almoço|mittagessen|déjeuner|dinar)\b/.test(t)) return 'comida';
  if (/\b(cena|dîner|abendessen|dinner|jantar|sopar)\b/.test(t)) return 'cena';
  return null;
}

function ProgramaTimeline({
  dias,
  locale,
  fechaInicio,
  restaurantes,
  pueblos,
}: {
  dias: import('@/lib/grandes-eventos').GranEventoDia[];
  locale: string;
  fechaInicio?: string | null;
  restaurantes: GranEventoRestaurante[];
  pueblos: GranEventoPueblo[];
}) {
  const diasOrdenados = [...dias].sort((a, b) => a.orden - b.orden);
  const diaFechas = new Map<number, string>();
  if (fechaInicio) {
    const base = new Date(fechaInicio);
    diasOrdenados.forEach((dia, idx) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + idx);
      diaFechas.set(dia.id, d.toISOString().slice(0, 10));
    });
  }

  const restPorFechaTipo = new Map<string, GranEventoRestaurante>();
  for (const r of restaurantes) {
    if (r.fecha && r.tipo) {
      restPorFechaTipo.set(`${r.fecha.slice(0, 10)}-${r.tipo}`, r);
    }
  }

  return (
    <div className="space-y-12">
      {diasOrdenados.map((dia) => {
        const label = pickI18n(dia.label_es, dia.label_i18n, locale);
        const titulo = pickI18n(dia.titulo_es, dia.titulo_i18n, locale);
        const diaFecha = diaFechas.get(dia.id);

        const meteoSlots = diaFecha
          ? buildMeteoSlots(dia, pueblos, diaFecha)
          : [];

        return (
          <div key={dia.id} className="relative">
            <div className="mb-6 border-b border-stone-200 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">{label}</p>
                  <h3 className="mt-1.5 text-xl font-bold text-stone-900 sm:text-2xl">{titulo}</h3>
                </div>
                {diaFecha && meteoSlots.length > 0 && (
                  <ProgramaDiaMeteo slots={meteoSlots} targetDate={diaFecha} />
                )}
              </div>
            </div>
            <ol className="relative space-y-5 border-l-2 border-amber-200/70 pl-6">
              {dia.actos.map((acto) => {
                const texto = pickI18n(acto.texto_es, acto.texto_i18n, locale);
                // Buscar restaurante vinculado a este acto
                const tipoComida = detectTipoComida(acto.texto_es);
                const restauranteVinculado = diaFecha && tipoComida
                  ? restPorFechaTipo.get(`${diaFecha}-${tipoComida}`)
                  : undefined;

                return (
                  <li key={acto.id} className="relative">
                    <span
                      className="absolute -left-[33px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-amber-700 shadow-sm"
                      aria-hidden
                    >
                      <span className="block h-1.5 w-1.5 rounded-full bg-amber-700" />
                    </span>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                      <p className="shrink-0 text-sm font-bold tabular-nums text-amber-800 sm:w-28">
                        {acto.hora}
                      </p>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="text-[15px] leading-relaxed text-stone-700">{texto}</p>
                        {restauranteVinculado && (
                          <a
                            href={`#restaurante-${restauranteVinculado.id}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100 hover:ring-amber-400"
                          >
                            <UtensilsCrossed className="h-3 w-3" />
                            {restauranteVinculado.nombre}
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

function LogisticaSection({
  evento,
  locale,
}: {
  evento: import('@/lib/grandes-eventos').GranEvento;
  locale: string;
}) {
  const t = (es: string | null, i18n: Record<string, string> | null) => pickI18n(es, i18n, locale);

  const airportTitle = t(evento.logisticaAirportTitulo_es, evento.logisticaAirportTitulo_i18n);
  const airportText = t(evento.logisticaAirportTexto_es, evento.logisticaAirportTexto_i18n);
  const hotelTitle = t(evento.logisticaHotelTitulo_es, evento.logisticaHotelTitulo_i18n);
  const hotelText = t(evento.logisticaHotelTexto_es, evento.logisticaHotelTexto_i18n);
  const idiomasTitle = t(evento.logisticaIdiomasTitulo_es, evento.logisticaIdiomasTitulo_i18n);
  const idiomasText = t(evento.logisticaIdiomasTexto_es, evento.logisticaIdiomasTexto_i18n);
  const contactTitle = t(evento.contactoTitulo_es, evento.contactoTitulo_i18n);
  const contactText = t(evento.contactoTexto_es, evento.contactoTexto_i18n);

  const hasAny = [airportTitle, hotelTitle, idiomasTitle, evento.contactoTelefono].some(Boolean);
  if (!hasAny) return null;

  return (
    <section className="border-t border-stone-100 bg-stone-50/50 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {airportTitle ? (
            <InfoCard icon={<Plane className="h-5 w-5" />} title={airportTitle} text={airportText} />
          ) : null}
          {hotelTitle ? (
            <InfoCard icon={<Hotel className="h-5 w-5" />} title={hotelTitle} text={hotelText} />
          ) : null}
          {idiomasTitle ? (
            <InfoCard icon={<Languages className="h-5 w-5" />} title={idiomasTitle} text={idiomasText} />
          ) : null}
          {evento.contactoTelefono ? (
            <ContactCard
              title={contactTitle}
              text={contactText}
              name={evento.contactoNombre ?? ''}
              phone={evento.contactoTelefono}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/10 text-amber-800">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p>
    </div>
  );
}

function ContactCard({
  title,
  text,
  name,
  phone,
}: {
  title: string;
  text: string;
  name: string;
  phone: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/10 text-amber-800">
        <Phone className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {text ? <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p> : null}
      <div className="mt-3 space-y-1">
        {name ? <p className="text-sm font-semibold text-stone-800">{name}</p> : null}
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-2 text-base font-bold text-amber-800 hover:text-amber-900 hover:underline"
        >
          {phone}
        </a>
      </div>
    </div>
  );
}
