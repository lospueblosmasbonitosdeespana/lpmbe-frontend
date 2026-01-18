import { getApiUrl } from "@/lib/api";
import PueblosList from "./PueblosList";

// 🔒 Evita SSG / paths raros
export const dynamic = "force-dynamic";

type SearchParams = {
  comunidad?: string;
  provincia?: string;
};

async function getPueblos() {
  const API_BASE = getApiUrl();
  
  const res = await fetch(`${API_BASE}/pueblos`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error("Error cargando pueblos");
  }

  const pueblos = await res.json();
  
  if (!Array.isArray(pueblos)) {
    return [];
  }
  
  // Enriquecer con foto principal de cada pueblo
  const enriched = await Promise.all(
    pueblos.map(async (pueblo: any) => {
      try {
        const puebloRes = await fetch(`${API_BASE}/pueblos/${pueblo.slug}`, {
          cache: 'no-store',
        });
        
        if (puebloRes.ok) {
          const puebloCompleto = await puebloRes.json();
          const fotos = puebloCompleto.fotosPueblo;
          
          // Buscar foto con orden=1 (principal) o la primera disponible
          const principal = Array.isArray(fotos)
            ? fotos.find((f: any) => f.orden === 1)
            : null;
          
          return {
            ...pueblo,
            fotoPrincipalUrl: principal?.url ?? fotos?.[0]?.url ?? null,
          };
        }
      } catch (err) {
        console.error(`Error cargando foto para pueblo ${pueblo.slug}:`, err);
      }
      
      return pueblo;
    })
  );
  
  return enriched;
}

export default async function PueblosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = searchParams ? await searchParams : ({} as SearchParams);

  const comunidad = (sp.comunidad ?? "").trim();
  const provincia = (sp.provincia ?? "").trim();

  try {
    const pueblos = await getPueblos();
    return (
      <PueblosList
        pueblos={pueblos}
        initialComunidad={comunidad}
        initialProvincia={provincia}
      />
    );
  } catch {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Pueblos</h1>
        <p style={{ marginTop: "24px", color: "#d32f2f" }}>
          Error al cargar los pueblos. Por favor, intenta de nuevo más tarde.
        </p>
      </main>
    );
  }
}
