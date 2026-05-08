import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Camera, CalendarDays } from 'lucide-react';
import { getGranEventoBySlug, getGranEventoAlbumFotos, pickI18n } from '@/lib/grandes-eventos';
import type { GranEventoFoto } from '@/lib/grandes-eventos';
import GranEventoAlbumCliente from './GranEventoAlbumCliente';

/** Agrupa fotos por día (YYYY-MM-DD). Usa fechaFoto si existe, si no createdAt. */
function agruparPorDia(fotos: GranEventoFoto[]): { dia: string; fotos: GranEventoFoto[] }[] {
  const map = new Map<string, GranEventoFoto[]>();
  for (const f of fotos) {
    const raw = f.fechaFoto ?? f.createdAt;
    const dia = raw.slice(0, 10); // YYYY-MM-DD
    if (!map.has(dia)) map.set(dia, []);
    map.get(dia)!.push(f);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, fotos]) => ({ dia, fotos }));
}

function formatDia(dia: string, locale: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  return d.toLocaleDateString(locale === 'ca' ? 'ca' : locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function GranEventoAlbumPage({
  slug,
  backHref,
}: {
  slug: string;
  backHref: string;
}) {
  const evento = await getGranEventoBySlug(slug);
  if (!evento) notFound();

  const locale = (await getLocale()) || 'es';
  const t = await getTranslations('granEvento.album');

  const fotos = await getGranEventoAlbumFotos(slug);
  const grupos = agruparPorDia(fotos);

  const heroTitulo = pickI18n(evento.heroTitulo_es, evento.heroTitulo_i18n, locale);
  const heroKicker = pickI18n(evento.heroKicker_es, evento.heroKicker_i18n, locale);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      {/* Header compacto */}
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-400 hover:bg-amber-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('volver')}
          </Link>
          <div className="min-w-0 flex-1">
            {heroKicker ? (
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                {heroKicker}
              </p>
            ) : null}
            <h1 className="truncate text-sm font-bold text-stone-900">{heroTitulo}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Camera className="h-3.5 w-3.5" />
            <span>{fotos.length} {t('fotos')}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {fotos.length === 0 ? (
          <div className="py-24 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-stone-300" />
            <p className="text-stone-500">{t('vacio')}</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grupos.map(({ dia, fotos: fotosDelDia }) => (
              <section key={dia}>
                {/* Cabecera del día */}
                <div className="mb-6 flex items-center gap-3 border-b border-amber-200/60 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700/10">
                    <CalendarDays className="h-5 w-5 text-amber-800" />
                  </div>
                  <div>
                    <p className="text-lg font-bold capitalize text-stone-900">{formatDia(dia, locale)}</p>
                    <p className="text-xs text-stone-500">
                      {fotosDelDia.length} {fotosDelDia.length === 1 ? t('foto') : t('fotos')}
                    </p>
                  </div>
                </div>

                {/* Grid de fotos del día — cliente para lightbox */}
                <GranEventoAlbumCliente fotos={fotosDelDia} locale={locale} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
