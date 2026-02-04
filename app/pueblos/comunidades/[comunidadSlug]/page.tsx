import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { findCcaaBySlug, norm } from "../../../_components/pueblos/ccaa.config";

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

export default async function ComunidadDetallePage({
  params,
}: {
  params: Promise<{ comunidadSlug: string }>;
}) {
  const { comunidadSlug } = await params;
  const ccaa = findCcaaBySlug(comunidadSlug);
  if (!ccaa) return notFound();

  const pueblos = await getPueblos();

  const dentro = pueblos.filter((p) => norm(p.comunidad ?? "") === norm(ccaa.name));

  // Murcia (o cualquier CCAA sin pueblos): mensaje "todavía no hay…"
  if (dentro.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-black/10 bg-black/5">
            {ccaa.flagSrc ? (
              <Image
                src={ccaa.flagSrc}
                alt={`Bandera de ${ccaa.name}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : null}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{ccaa.name}</h1>
            <p className="mt-1 text-sm text-black/60">0 pueblos</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-black/70">
            Todavía no hay pueblos de la Asociación en esta región.
          </p>
          <div className="mt-4">
            <Link className="text-sm font-medium underline" href="/pueblos/comunidades">
              Volver a comunidades
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Agrupar por provincia
  const map = new Map<string, Pueblo[]>();
  for (const p of dentro) {
    const prov = (p.provincia ?? "Sin provincia").trim() || "Sin provincia";
    if (!map.has(prov)) map.set(prov, []);
    map.get(prov)!.push(p);
  }

  const provincias = Array.from(map.entries())
    .map(([provincia, items]) => ({
      provincia,
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }))
    .sort((a, b) => a.provincia.localeCompare(b.provincia, "es"));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-black/10 bg-black/5">
          {ccaa.flagSrc ? (
            <Image
              src={ccaa.flagSrc}
              alt={`Bandera de ${ccaa.name}`}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{ccaa.name}</h1>
          <p className="mt-1 text-sm text-black/60">{dentro.length} pueblos</p>
        </div>

        <div className="ml-auto">
          <Link className="text-sm font-medium underline" href="/pueblos/comunidades">
            Cambiar comunidad
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {provincias.map(({ provincia, items }) => (
          <section key={provincia}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">{provincia}</h2>
              <span className="text-sm text-black/60">
                {items.length} pueblo{items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/pueblos/${p.slug}`}
                  className="rounded-xl border border-black/10 bg-white px-4 py-4 shadow-sm hover:bg-black/[0.02]"
                >
                  <div className="font-medium">{p.nombre}</div>
                  <div className="mt-1 text-sm text-black/60">Ver ficha →</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

