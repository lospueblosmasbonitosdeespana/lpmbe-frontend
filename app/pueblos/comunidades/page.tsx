import Link from "next/link";
import Image from "next/image";
import { getApiUrl } from "@/lib/api";
import { CCAA, norm } from "../../_components/pueblos/ccaa.config";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  comunidad?: string | null;
};

async function getPueblos(): Promise<Pueblo[]> {
  const res = await fetch(`${getApiUrl()}/pueblos`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function ComunidadesPage() {
  const pueblos = await getPueblos();

  // Cuenta pueblos por comunidad (según nombre del backend)
  const countByComunidad = new Map<string, number>();
  for (const p of pueblos) {
    const c = (p.comunidad ?? "").trim();
    if (!c) continue;
    countByComunidad.set(c, (countByComunidad.get(c) ?? 0) + 1);
  }

  // Mostrar: CCAA con pueblos + Murcia aunque 0
  const visible = CCAA.filter((c) => {
    if (c.slug === "murcia") return true;
    const total =
      Array.from(countByComunidad.entries()).find(([name]) => norm(name) === norm(c.name))?.[1] ?? 0;
    return total > 0;
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Comunidades autónomas</h1>
        <p className="mt-2 text-sm text-black/60 font-sans">
          Elige una comunidad autónoma para ver provincias y pueblos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const total =
            Array.from(countByComunidad.entries()).find(([name]) => norm(name) === norm(c.name))?.[1] ?? 0;

          return (
              <Link
                key={c.slug}
                href={`/pueblos/comunidades/${c.slug}`}
                className="group rounded-2xl border border-black/10 bg-neutral-50 p-4 shadow-sm transition-colors hover:bg-neutral-100"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                    {c.flagSrc ? (
                      <Image
                        src={c.flagSrc}
                        alt={`Bandera de ${c.name}`}
                        fill
                        className="object-cover"
                        sizes="56px"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-black/50">
                        (sin bandera)
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="mt-1 text-sm text-black/60">
                      {total > 0 ? `${total} pueblo${total === 1 ? "" : "s"}` : "Todavía sin pueblos"}
                    </div>
                  </div>

                  <div className="ml-auto text-sm text-black/40 transition-transform group-hover:translate-x-1">→</div>
                </div>
              </Link>
          );
        })}
      </div>
    </main>
  );
}
