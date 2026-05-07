import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import ProgramaTimeline from './_components/ProgramaTimeline';
import PueblosRuta from './_components/PueblosRuta';
import MapaRutaAsamblea from './_components/MapaRutaAsamblea';

export const revalidate = 3600;

export default async function Page() {
  const t = await getTranslations('rencontres2026');

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      {/* Decorative background pattern */}
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
          <div className="mb-8 flex justify-center">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32">
              <Image
                src="/rencontres/logo-federation.png"
                alt="Fédération des Plus Beaux Villages de la Terre"
                fill
                priority
                sizes="(max-width: 640px) 112px, 128px"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-700">
            {t('hero.kicker')}
          </p>
          <p className="mt-3 text-center text-sm font-medium text-stone-500 sm:text-base">
            {t('hero.federation')}
          </p>

          <h1 className="mx-auto mt-5 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
            {t('hero.title')}
          </h1>

          <p className="mt-5 text-center text-base font-medium text-amber-800 sm:text-lg">
            {t('hero.subtitle')}
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-stone-600 sm:text-base">
            {t('hero.intro')}
          </p>

          {/* Action buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#programa"
              className="inline-flex items-center gap-2 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-white shadow-md ring-1 ring-amber-900/10 transition hover:bg-amber-900 hover:shadow-lg"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {t('actions.viewProgram')}
            </a>
            <a
              href="/rencontres/programa-rencontres-2026.pdf"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-amber-700 hover:text-amber-800 hover:shadow-md"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {t('actions.downloadPdf')}
            </a>
          </div>
        </div>
      </header>

      {/* PROGRAMA */}
      <section id="programa" className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              {t('sections.program')}
            </p>
            <div className="mt-3 inline-flex h-1 w-12 rounded-full bg-amber-700" />
          </div>
          <ProgramaTimeline />
        </div>
      </section>

      {/* PUEBLOS */}
      <section className="border-t border-stone-100 bg-stone-50/50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              {t('sections.villages')}
            </p>
            <div className="mt-3 mb-4 inline-flex h-1 w-12 rounded-full bg-amber-700" />
            <p className="text-[15px] leading-relaxed text-stone-600 sm:text-base">
              {t('sections.villagesIntro')}
            </p>
          </div>
          <PueblosRuta />
        </div>
      </section>

      {/* MAPA */}
      <section className="border-t border-stone-100 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              {t('sections.map')}
            </p>
            <div className="mt-3 mb-4 inline-flex h-1 w-12 rounded-full bg-amber-700" />
            <p className="text-[15px] leading-relaxed text-stone-600 sm:text-base">
              {t('sections.mapIntro')}
            </p>
          </div>
          <MapaRutaAsamblea />
        </div>
      </section>

      {/* LOGÍSTICA */}
      <section className="border-t border-stone-100 bg-stone-50/50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              {t('sections.logistics')}
            </p>
            <div className="mt-3 inline-flex h-1 w-12 rounded-full bg-amber-700" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              icon="airport"
              title={t('logistics.airportTitle')}
              text={t('logistics.airportText')}
            />
            <InfoCard
              icon="hotel"
              title={t('logistics.hotelTitle')}
              text={t('logistics.hotelText')}
            />
            <InfoCard
              icon="languages"
              title={t('logistics.languagesTitle')}
              text={t('logistics.languagesText')}
            />
            <ContactCard
              title={t('logistics.contactTitle')}
              text={t('logistics.contactText')}
              name={t('logistics.contactName')}
              phone={t('logistics.contactPhone')}
            />
          </div>
        </div>
      </section>

      {/* FOOTER ESTILIZADO */}
      <footer className="border-t border-stone-100 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 h-16 w-16 opacity-80">
            <Image
              src="/rencontres/logo-federation.png"
              alt=""
              width={64}
              height={64}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className="text-sm font-semibold text-stone-700">
            {t('hero.federation')}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">
            {t('hero.kicker')}
          </p>
        </div>
      </footer>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: 'airport' | 'hotel' | 'languages' | 'contact';
  title: string;
  text: string;
}) {
  const icons: Record<typeof icon, React.ReactNode> = {
    airport: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
    hotel: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
      </svg>
    ),
    languages: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
      </svg>
    ),
    contact: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/10 text-amber-800">
        <div className="h-5 w-5">{icons[icon]}</div>
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
        <div className="h-5 w-5">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z" />
          </svg>
        </div>
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-stone-800">{name}</p>
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
