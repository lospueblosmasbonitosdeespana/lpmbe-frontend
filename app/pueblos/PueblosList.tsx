"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import SemaforoBadge from "../components/pueblos/SemaforoBadge";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  lat: number | null;
  lng: number | null;
  altitud: number | null;
  foto_destacada: string | null;
  escudo_bandera: string | null;
  boldestMapId: string | null;
  semaforo: any | null;
};

type PueblosListProps = {
  pueblos: Pueblo[];
};

export default function PueblosList({ pueblos: initialPueblos }: PueblosListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Ordenar alfabéticamente por nombre
  const pueblosOrdenados = useMemo(() => {
    return [...initialPueblos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [initialPueblos]);

  // Filtrar por búsqueda (case-insensitive)
  const pueblosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return pueblosOrdenados;
    }
    const term = searchTerm.toLowerCase();
    return pueblosOrdenados.filter(
      (pueblo) =>
        pueblo.nombre.toLowerCase().includes(term) ||
        pueblo.provincia.toLowerCase().includes(term) ||
        pueblo.comunidad.toLowerCase().includes(term)
    );
  }, [pueblosOrdenados, searchTerm]);

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Pueblos</h1>

      {/* Contador */}
      <p style={{ marginTop: "16px", fontSize: "16px", color: "#666" }}>
        {pueblosFiltrados.length} {pueblosFiltrados.length === 1 ? "pueblo" : "pueblos"}
      </p>

      {/* Buscador */}
      <div style={{ marginTop: "24px", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Buscar por nombre, provincia o comunidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        />
      </div>

      {/* Listado */}
      {pueblosFiltrados.length > 0 ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          {pueblosFiltrados.map((pueblo) => (
            <Link
              key={pueblo.id}
              href={`/pueblos/${pueblo.slug}`}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0" }}>{pueblo.nombre}</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#555" }}>
                {pueblo.provincia} · {pueblo.comunidad}
              </p>
              <div style={{ marginTop: "8px" }}>
                <SemaforoBadge
                  estado={
                    pueblo.semaforo?.estado ??
                    (typeof pueblo.semaforo === "object" &&
                    pueblo.semaforo !== null &&
                    "estado" in pueblo.semaforo
                      ? (pueblo.semaforo as any).estado
                      : null)
                  }
                  variant="badge"
                />
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <p style={{ marginTop: "24px", color: "#666" }}>
          {searchTerm
            ? "No se encontraron pueblos con ese criterio de búsqueda"
            : "No hay pueblos disponibles"}
        </p>
      )}
    </main>
  );
}

