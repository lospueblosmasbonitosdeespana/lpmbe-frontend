type Foto = {
  id: number;
  url: string;
  alt: string | null;
  orden: number | null;
  puebloId: number;
};

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  lat: number | null;
  lng: number | null;
  categoria: string | null;
  orden: number | null;
  puebloId: number;
};

type Multiexperiencia = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  slug: string;
  categoria: string | null;
  tipo: string;
  programa: string | null;
  qr: string | null;
  puntos: number | null;
  activo: boolean;
};

type PuebloMultiexperiencia = {
  puebloId: number;
  multiexperienciaId: number;
  orden: number | null;
  multiexperiencia: Multiexperiencia;
};

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number | null;
  lng: number | null;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto_destacada: string | null;
  puntosVisita?: number | null;
  boldestMapId?: string | null;
  fotos: Foto[];
  pois: Poi[];
  multiexperiencias: PuebloMultiexperiencia[];
  eventos: any[];
  noticias: any[];
};

// 🔒 Forzamos render dinámico (no SSG)
export const dynamic = "force-dynamic";

// 🌍 Base de la API (Railway o local backend)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

async function getPuebloBySlug(slug: string): Promise<Pueblo> {
  // 1️⃣ Listado de pueblos DESDE LA API
  const listRes = await fetch(`${API_BASE}/pueblos`, {
    cache: "no-store",
  });

  if (!listRes.ok) {
    throw new Error("No se pudo cargar el listado de pueblos");
  }

  const pueblos: Pueblo[] = await listRes.json();

  // 2️⃣ Buscar por slug
  const pueblo = pueblos.find((p) => p.slug === slug);

  if (!pueblo) {
    throw new Error("Pueblo no encontrado");
  }

  // 3️⃣ Detalle por ID
  const res = await fetch(`${API_BASE}/pueblos/${pueblo.id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando el pueblo");
  }

  return res.json();
}

export default async function PuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);

  // Separar POIs por categoría
  const poisPOI = pueblo.pois.filter((poi) => poi.categoria === "POI");
  const poisMultiexperiencia = pueblo.pois.filter(
    (poi) => poi.categoria === "MULTIEXPERIENCIA"
  );
  const poisOtros = pueblo.pois.filter(
    (poi) => poi.categoria !== "POI" && poi.categoria !== "MULTIEXPERIENCIA"
  );

  const heroImage = pueblo.foto_destacada ?? pueblo.fotos[0]?.url ?? null;

  // Filtrar fotos para galería: excluir la foto usada en hero si viene de fotos[]
  const fotoHeroUrl =
    heroImage && !pueblo.foto_destacada ? heroImage : null;
  const fotosParaGalería = fotoHeroUrl
    ? pueblo.fotos.filter((f) => f.url !== fotoHeroUrl)
    : pueblo.fotos;

  // Limitar a 24 fotos (sin orden adicional, tal cual viene del backend)
  const fotosGalería = fotosParaGalería.slice(0, 24);

  return (
    <main>
      {/* HERO */}
      <section>
        <h1>{pueblo.nombre}</h1>
        <p>
          {pueblo.provincia} · {pueblo.comunidad}
        </p>
        {heroImage && (
          <img
            src={heroImage}
            alt={pueblo.nombre}
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
          />
        )}
      </section>

      {/* TEXTO */}
      <section style={{ marginTop: "32px" }}>
        {pueblo.descripcion_corta || pueblo.descripcion_larga ? (
          <>
            {pueblo.descripcion_corta && <p>{pueblo.descripcion_corta}</p>}
            {pueblo.descripcion_larga && <p>{pueblo.descripcion_larga}</p>}
          </>
        ) : (
          <p>Descripción próximamente.</p>
        )}
      </section>

      {/* GALERÍA */}
      {fotosGalería.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Galería</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {fotosGalería.map((foto, index) => (
              <img
                key={foto.id}
                src={foto.url}
                alt={foto.alt ?? `${pueblo.nombre} - Foto ${index + 1}`}
                loading="lazy"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
              />
            ))}
          </div>
        </section>
      )}

      {/* POIs - Puntos de interés */}
      {poisPOI.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Puntos de interés</h2>
          <ul>
            {poisPOI.map((poi) => (
              <li key={poi.id}>{poi.nombre}</li>
            ))}
          </ul>
        </section>
      )}

      {/* POIs - Paradas de la experiencia */}
      {poisMultiexperiencia.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Paradas de la experiencia</h2>
          <ul>
            {poisMultiexperiencia.map((poi) => (
              <li key={poi.id}>{poi.nombre}</li>
            ))}
          </ul>
        </section>
      )}

      {/* POIs - Otros */}
      {poisOtros.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Otros</h2>
          <ul>
            {poisOtros.map((poi) => (
              <li key={poi.id}>{poi.nombre}</li>
            ))}
          </ul>
        </section>
      )}

      {/* MULTIEXPERIENCIAS */}
      {pueblo.multiexperiencias.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2>Multiexperiencias</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {pueblo.multiexperiencias.map((mx) => (
              <div
                key={mx.multiexperiencia.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                {mx.multiexperiencia.foto && (
                  <img
                    src={mx.multiexperiencia.foto}
                    alt={mx.multiexperiencia.titulo}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: "4px",
                      marginBottom: "12px",
                    }}
                  />
                )}
                <h3 style={{ margin: "0 0 8px 0" }}>
                  {mx.multiexperiencia.titulo}
                </h3>
                {mx.multiexperiencia.descripcion && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
                    {mx.multiexperiencia.descripcion.length > 150
                      ? mx.multiexperiencia.descripcion.substring(0, 150) +
                        "..."
                      : mx.multiexperiencia.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MAPA */}
      <section style={{ marginTop: "32px" }}>
        <h2>Mapa</h2>
        {pueblo.lat && pueblo.lng ? (
          <a
            href={`https://www.google.com/maps?q=${pueblo.lat},${pueblo.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: "16px" }}
          >
            Ver en Google Maps
          </a>
        ) : (
          <p style={{ marginTop: "16px" }}>Mapa próximamente</p>
        )}
      </section>

      {/* EVENTOS */}
      <section style={{ marginTop: "32px" }}>
        <h2>Eventos</h2>
        {pueblo.eventos.length > 0 ? (
          <p>Eventos próximamente.</p>
        ) : (
          <p>No hay eventos publicados</p>
        )}
      </section>

      {/* NOTICIAS */}
      <section style={{ marginTop: "32px" }}>
        <h2>Noticias</h2>
        {pueblo.noticias.length > 0 ? (
          <p>Noticias próximamente.</p>
        ) : (
          <p>No hay noticias publicadas</p>
        )}
      </section>
    </main>
  );
}