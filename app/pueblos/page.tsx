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
  
  // Si el backend devuelve mainPhotoUrl en el listado, no necesitamos enriquecer
  // Si no, mantener el enriquecimiento como fallback
  const needsEnrichment = pueblos.some((p: any) => !p.mainPhotoUrl);
  
  if (!needsEnrichment) {
    // Backend ya incluye mainPhotoUrl, retornar directamente
    return pueblos;
  }
  
  // Enriquecer solo si es necesario (fallback legacy)
  const enriched = await Promise.all(
    pueblos.map(async (pueblo: any) => {
      // Si ya tiene mainPhotoUrl, no enriquecer
      if (pueblo.mainPhotoUrl) return pueblo;
      
      try {
        // Obtener pueblo completo que incluye fotos/fotosPueblo
        const puebloRes = await fetch(`${API_BASE}/pueblos/${pueblo.slug}`, {
          cache: 'no-store',
        });
        
        if (puebloRes.ok) {
          const puebloCompleto = await puebloRes.json();
          
          // 🔍 Diagnóstico temporal
          console.log(`[Pueblo Enrich] ${pueblo.nombre} (id=${pueblo.id}):`, {
            mainPhotoUrl: puebloCompleto.mainPhotoUrl ?? 'ninguna',
            fotos: puebloCompleto.fotos?.length ?? 0,
            fotosPueblo: puebloCompleto.fotosPueblo?.length ?? 0,
          });
          
          // Conservar mainPhotoUrl, fotos y fotosPueblo
          return {
            ...pueblo,
            mainPhotoUrl: puebloCompleto.mainPhotoUrl,
            fotos: Array.isArray(puebloCompleto.fotos) ? puebloCompleto.fotos : [],
            fotosPueblo: Array.isArray(puebloCompleto.fotosPueblo) ? puebloCompleto.fotosPueblo : [],
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
