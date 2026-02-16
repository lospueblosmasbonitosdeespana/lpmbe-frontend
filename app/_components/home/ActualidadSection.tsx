import Link from "next/link";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { ActualidadItem } from "./ActualidadItem";

type Notificacion = {
  id: number;
  titulo: string;
  tipo?: string;
  fecha?: string;
  href?: string;
  contenidoSlug?: string;
  contenidoUrl?: string;
};

async function getActualidad(limit: number, locale?: string): Promise<Notificacion[]> {
  const base = getApiUrl();
  const qs = locale ? `&lang=${encodeURIComponent(locale)}` : "";
  const res = await fetch(`${base}/public/notificaciones/feed?limit=${limit}&tipos=NOTICIA,EVENTO${qs}`, {
    next: { revalidate: 120 },
    cache: "no-store",
    headers: locale ? { "Accept-Language": locale } : undefined,
  });

  if (!res.ok) return [];
  const json = await res.json();
  // CRÍTICO: el backend devuelve { items: [...] }
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return Array.isArray(items) ? items.slice(0, limit) : [];
}

type ActualidadSectionProps = {
  limit?: number;
};

export async function ActualidadSection({ limit = 4 }: ActualidadSectionProps) {
  const locale = await getLocale();
  const items = await getActualidad(limit, locale);

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
          {items.map((n) => {
            // Prioridad: contenidoSlug -> contenidoUrl -> href -> fallback
            const itemHref = n.contenidoSlug
              ? `/c/${n.contenidoSlug}`
              : n.contenidoUrl
              ? n.contenidoUrl
              : n.href ?? '/notificaciones';

            return (
              <ActualidadItem
                key={n.id}
                titulo={n.titulo}
                fecha={n.fecha}
                tipo={n.tipo}
                href={itemHref}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}



