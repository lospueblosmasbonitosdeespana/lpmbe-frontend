import Link from "next/link";
import { headers } from "next/headers";
import { PuebloCard } from "./PuebloCard";

export const dynamic = "force-dynamic";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  fotoPrincipalUrl?: string | null;
  fotoDestacada?: string | null;
  foto_destacada?: string | null; // tolerante por si viene legacy
  fotoPortada?: string | null;
  imagenPrincipal?: string | null;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getFeaturedPueblos(): Promise<Pueblo[]> {
  // Construir URL robusta para Server Component
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  
  const res = await fetch(`${base}/api/pueblos`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Pueblo[];
  if (!Array.isArray(data)) return [];

  // Random + primeros 8
  const selected = shuffle(data).slice(0, 8);
  
  // Enriquecer con foto principal de cada pueblo
  const enriched = await Promise.all(
    selected.map(async (pueblo) => {
      try {
        // Obtener pueblo individual que incluye fotosPueblo
        const puebloRes = await fetch(`${API_BASE}/pueblos/${pueblo.slug}`, {
          cache: "no-store",
        });
        
        if (puebloRes.ok) {
          const puebloCompleto = await puebloRes.json();
          const fotos = puebloCompleto.fotosPueblo;
          
          // Buscar foto con orden=1 (principal)
          const principal = Array.isArray(fotos)
            ? fotos.find((f: any) => f.orden === 1)
            : null;
          
          return {
            ...pueblo,
            fotoPrincipalUrl: principal?.url ?? fotos?.[0]?.url ?? null,
          };
        }
      } catch (err) {
        console.error(`Error cargando fotos para pueblo ${pueblo.slug}:`, err);
      }
      
      return pueblo;
    })
  );
  
  return enriched;
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
          {pueblos.map((p) => {
            // Priorizar fotoPrincipalUrl con fallbacks
            const img =
              p.fotoPrincipalUrl ??
              p.fotoDestacada ??
              p.foto_destacada ??
              p.fotoPortada ??
              p.imagenPrincipal ??
              null;
            
            return (
              <PuebloCard
                key={p.id}
                slug={p.slug}
                nombre={p.nombre}
                provincia={p.provincia}
                foto={img}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}



