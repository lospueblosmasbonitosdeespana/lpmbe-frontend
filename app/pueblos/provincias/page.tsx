import Link from "next/link";
import { getApiUrl } from "@/lib/api";

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

function normalize(s: string) {
  return s.trim();
}

export default async function ProvinciasPage() {
  const pueblos = await getPueblos();

  const provincias = Array.from(
    new Set(
      pueblos
        .map((p) => p.provincia)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map(normalize)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Por provincia</h1>
        <p className="mt-2 text-sm text-black/60">
          Elige una provincia para ver sus pueblos.
        </p>
      </div>

      {provincias.length === 0 ? (
        <p className="text-sm text-black/70">No hay provincias disponibles.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {provincias.map((p) => (
            <Link
              key={p}
              href={`/pueblos?provincia=${encodeURIComponent(p)}`}
              className="rounded-xl border border-black/10 bg-white px-4 py-4 shadow-sm hover:bg-black/[0.02]"
            >
              <div className="font-medium">{p}</div>
              <div className="mt-1 text-sm text-black/60">Ver pueblos →</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

