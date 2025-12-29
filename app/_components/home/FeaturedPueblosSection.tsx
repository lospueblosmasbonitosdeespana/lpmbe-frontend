import Link from "next/link";
import { PuebloCard } from "./PuebloCard";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  fotoDestacada?: string | null;
  foto_destacada?: string | null; // tolerante por si viene legacy
};

async function getFeaturedPueblos(): Promise<Pueblo[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const res = await fetch(`${base}/pueblos`, {
    // HOME: preferimos cache corta (ajusta si quieres)
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Pueblo[];
  if (!Array.isArray(data)) return [];

  // MVP: primeros 8 (estable y rápido)
  return data.slice(0, 8);
}

export async function FeaturedPueblosSection() {
  const pueblos = await getFeaturedPueblos();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Pueblos destacados</h2>
          <p className="mt-2 text-sm text-gray-600">
            Una selección para empezar a explorar.
          </p>
        </div>

        <Link href="/pueblos" className="text-sm font-medium hover:underline">
          Ver todos →
        </Link>
      </div>

      {pueblos.length === 0 ? (
        <div className="bg-gray-100 px-6 py-10 text-sm text-gray-600">
          No hay pueblos disponibles ahora mismo.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {pueblos.map((p) => (
            <PuebloCard
              key={p.id}
              slug={p.slug}
              nombre={p.nombre}
              provincia={p.provincia}
              foto={p.fotoDestacada ?? p.foto_destacada ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}



