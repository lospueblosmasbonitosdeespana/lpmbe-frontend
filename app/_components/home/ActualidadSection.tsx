import Link from "next/link";
import { ActualidadItem } from "./ActualidadItem";

type Notificacion = {
  id: number;
  titulo: string;
  tipo?: string;
  fecha?: string;
  href?: string;
};

async function getActualidad(limit: number): Promise<Notificacion[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const res = await fetch(`${base}/notificaciones?limit=${limit}`, {
    next: { revalidate: 120 }, // HOME: cache corta
  });

  if (!res.ok) return [];
  const data = (await res.json()) as Notificacion[];
  return Array.isArray(data) ? data.slice(0, limit) : [];
}

type ActualidadSectionProps = {
  limit?: number;
};

export async function ActualidadSection({ limit = 4 }: ActualidadSectionProps) {
  const items = await getActualidad(limit);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">Actualidad</h2>
          <p className="mt-2 text-sm text-gray-600">
            Noticias y avisos de la Asociación.
          </p>
        </div>
        <Link href="/notificaciones" className="text-sm font-medium hover:underline">
          Ver toda la actualidad →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-100 px-6 py-10 text-sm text-gray-600">
          No hay contenido reciente.
        </div>
      ) : (
        <div className="bg-white">
          {items.map((n) => (
            <ActualidadItem
              key={n.id}
              titulo={n.titulo}
              fecha={n.fecha}
              tipo={n.tipo}
              href={n.href ?? "/notificaciones"}
            />
          ))}
        </div>
      )}
    </section>
  );
}



