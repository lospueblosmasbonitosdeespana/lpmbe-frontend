import { getTranslations } from 'next-intl/server';

const DAYS = ['wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type Item = { time: string; text: string };

export default async function ProgramaTimeline() {
  const t = await getTranslations('rencontres2026');

  return (
    <div className="flex flex-col gap-12">
      {DAYS.map((dayKey, idx) => {
        const items = (t.raw(`days.${dayKey}.items`) as Item[]) ?? [];
        return (
          <article
            key={dayKey}
            className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white/80 shadow-sm ring-1 ring-stone-100 backdrop-blur"
          >
            <div className="border-b border-stone-100 bg-gradient-to-br from-stone-50 to-white px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
                    {t(`days.${dayKey}.label`)}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold leading-tight text-stone-900 sm:text-2xl">
                    {t(`days.${dayKey}.title`)}
                  </h3>
                </div>
                <span
                  className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white shadow-sm sm:inline-flex"
                  aria-hidden
                >
                  {idx + 1}
                </span>
              </div>
            </div>

            <ol className="relative px-6 py-6 sm:px-8 sm:py-8">
              <div
                className="absolute left-[5.25rem] top-8 bottom-8 w-px bg-gradient-to-b from-amber-300 via-amber-200 to-transparent sm:left-[6rem]"
                aria-hidden
              />
              {items.map((item, i) => (
                <li
                  key={`${dayKey}-${i}`}
                  className="relative flex gap-4 py-3 sm:gap-6"
                >
                  <time className="w-16 shrink-0 pt-0.5 text-right font-mono text-[13px] font-semibold tabular-nums text-stone-600 sm:w-20 sm:text-sm">
                    {item.time}
                  </time>
                  <span
                    className="relative mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-700 ring-4 ring-amber-700/10"
                    aria-hidden
                  />
                  <p className="flex-1 pt-0 text-[15px] leading-relaxed text-stone-700 sm:text-base">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
          </article>
        );
      })}
    </div>
  );
}
