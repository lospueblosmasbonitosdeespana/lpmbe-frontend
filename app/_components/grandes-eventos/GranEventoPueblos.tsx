import Image from 'next/image';
import Link from 'next/link';
import type { GranEventoPueblo } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';

export default function GranEventoPueblos({
  pueblos,
  locale,
}: {
  pueblos: GranEventoPueblo[];
  locale: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {pueblos.map((p, idx) => {
        const tagline = pickI18n(p.tagline_es, p.tagline_i18n, locale);
        const foto = p.fotoUrl ?? p.pueblo.foto_destacada ?? null;
        return (
          <Link
            key={p.id}
            href={`/pueblos/${p.pueblo.slug}`}
            className="group relative block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-stone-200/80 transition hover:shadow-xl hover:ring-amber-200"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
              {foto ? (
                <Image
                  src={foto}
                  alt={p.pueblo.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className="transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-700/30 via-stone-300 to-emerald-700/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
              <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-800 text-sm font-bold text-white shadow-lg">
                {idx + 1}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {p.pueblo.provincia}
                </p>
                <h3 className="text-xl font-bold text-white drop-shadow">{p.pueblo.nombre}</h3>
              </div>
            </div>
            {tagline ? (
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-stone-600">{tagline}</p>
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
