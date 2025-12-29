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
  initialComunidad?: string;
  initialProvincia?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

export default function PueblosList({
  pueblos: initialPueblos,
  initialComunidad = "",
  initialProvincia = "",
}: PueblosListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const comunidadNorm = initialComunidad ? norm(initialComunidad) : "";
  const provinciaNorm = initialProvincia ? norm(initialProvincia) : "";

  // Ordenar alfabéticamente por nombre
  const pueblosOrdenados = useMemo(() => {
    return [...initialPueblos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [initialPueblos]);

  // Filtrar por comunidad, provincia y búsqueda (case-insensitive)
  const pueblosFiltrados = useMemo(() => {
    let filtered = pueblosOrdenados;

    // Filtro por comunidad
    if (comunidadNorm) {
      filtered = filtered.filter(
        (p) => norm(p.comunidad ?? "") === comunidadNorm
      );
    }

    // Filtro por provincia
    if (provinciaNorm) {
      filtered = filtered.filter(
        (p) => norm(p.provincia ?? "") === provinciaNorm
      );
    }

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pueblo) =>
          pueblo.nombre.toLowerCase().includes(term) ||
          pueblo.provincia.toLowerCase().includes(term) ||
          pueblo.comunidad.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [pueblosOrdenados, comunidadNorm, provinciaNorm, searchTerm]);

  const hasActiveFilters = comunidadNorm || provinciaNorm;

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Pueblos</h1>

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Filtros activos:</span>
          {comunidadNorm && (
            <span style={{ fontSize: "14px", color: "#555" }}>
              Comunidad: <strong>{initialComunidad}</strong>
            </span>
          )}
          {provinciaNorm && (
            <span style={{ fontSize: "14px", color: "#555" }}>
              Provincia: <strong>{initialProvincia}</strong>
            </span>
          )}
          <Link
            href="/pueblos"
            style={{
              fontSize: "14px",
              color: "#0066cc",
              textDecoration: "underline",
              marginLeft: "auto",
            }}
          >
            Quitar filtros
          </Link>
        </div>
      )}

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

