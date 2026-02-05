import Link from 'next/link';
import { Title, Caption } from '@/app/components/ui/typography';
import { Star } from 'lucide-react';

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  comunidad?: string | null;
  foto_destacada?: string | null;
};

type Item = {
  puebloId: number;
  pueblo: Pueblo;
  rating: number | null;
};

export default function DashboardFavoritos({ items }: { items: Item[] }) {
  const favoritos = items.filter((it) => (it.rating ?? 0) === 5);

  if (favoritos.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Title size="lg">Pueblos favoritos</Title>
        <Caption className="mt-2 block">
          Aún no tienes favoritos. Valora con 5 estrellas tus pueblos preferidos y aparecerán aquí.
        </Caption>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Title size="lg">Pueblos favoritos</Title>
      <Caption className="mt-2 block">
        Tus pueblos con valoración de 5 estrellas.
      </Caption>

      <div className="mt-6 space-y-1 divide-y divide-border">
        {favoritos.map((it) => (
          <Link
            key={it.puebloId}
            href={`/pueblos/${it.pueblo.slug}`}
            className="flex items-center justify-between gap-4 py-4 transition-colors first:pt-0 hover:text-primary"
          >
            <div>
              <span className="font-medium">{it.pueblo.nombre}</span>
              <Caption className="mt-0.5 block">
                {(it.pueblo.provincia ?? '').trim()}
                {it.pueblo.provincia && it.pueblo.comunidad ? ' / ' : ''}
                {(it.pueblo.comunidad ?? '').trim()}
              </Caption>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              <Caption className="ml-1 text-muted-foreground">(5)</Caption>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}























