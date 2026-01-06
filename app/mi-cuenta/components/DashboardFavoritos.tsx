import Link from 'next/link';

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
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pueblos favoritos</h2>
        <p className="mt-2 text-sm text-gray-600">
          Aún no tienes favoritos. Valora con 5 estrellas tus pueblos preferidos y aparecerán aquí.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Pueblos favoritos</h2>
      <p className="mt-2 text-sm text-gray-600">
        Tus pueblos con valoración de 5 estrellas.
      </p>

      <div className="mt-4 space-y-4">
        {favoritos.map((it) => (
          <div key={it.puebloId} className="border-b pb-4">
            <div className="text-lg font-semibold">
              <Link className="underline" href={`/pueblos/${it.pueblo.slug}`}>
                {it.pueblo.nombre}
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              {(it.pueblo.provincia ?? '').trim()}
              {it.pueblo.provincia && it.pueblo.comunidad ? ' / ' : ''}
              {(it.pueblo.comunidad ?? '').trim()}
            </div>
            <div className="mt-2 text-sm">
              {'★★★★★'} <span className="text-gray-600">(5)</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}



