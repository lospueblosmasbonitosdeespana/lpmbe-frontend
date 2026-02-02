"use client";

import { useEffect, useMemo, useState } from "react";
import PhotoManager from "@/app/components/PhotoManager";
import RotatedImage from "@/app/components/RotatedImage";

type PoiRow = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  foto?: string | null;
  rotation?: number | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
  categoriaTematica?: string | null;
};

// Categorías temáticas disponibles
const CATEGORIAS_TEMATICAS = [
  { value: '', label: 'Sin categoría' },
  { value: 'GASTRONOMIA', label: 'Gastronomía' },
  { value: 'NATURALEZA', label: 'Naturaleza' },
  { value: 'CULTURA', label: 'Cultura' },
  { value: 'PATRIMONIO', label: 'Patrimonio' },
  { value: 'EN_FAMILIA', label: 'En familia' },
  { value: 'PETFRIENDLY', label: 'Petfriendly' },
];

// Helpers para comparar coordenadas con tolerancia (~5m)
const EPS = 0.00005;

function nearlyEqual(a: number | null | undefined, b: number | null | undefined, eps = EPS) {
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= eps;
}

function isSameCoordsAsPueblo(
  poiLat: number | null | undefined,
  poiLng: number | null | undefined,
  puebloLat: number | null | undefined,
  puebloLng: number | null | undefined
) {
  return nearlyEqual(poiLat, puebloLat) && nearlyEqual(poiLng, puebloLng);
}

export default function PoisPuebloClient({ slug }: { slug: string }) {
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [puebloLat, setPuebloLat] = useState<number | null>(null);
  const [puebloLng, setPuebloLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<PoiRow[]>([]);

  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editLat, setEditLat] = useState<number | "">("");
  const [editLng, setEditLng] = useState<number | "">("");
  const [editCategoriaTematica, setEditCategoriaTematica] = useState("");

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createNombre, setCreateNombre] = useState("");
  const [createDescripcion, setCreateDescripcion] = useState("");
  const [createLat, setCreateLat] = useState<number | "">("");
  const [createLng, setCreateLng] = useState<number | "">("");
  const [createCategoriaTematica, setCreateCategoriaTematica] = useState("");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (a.orden ?? 999999) - (b.orden ?? 999999));
    return copy;
  }, [rows]);

  async function fetchPuebloId() {
    const r = await fetch(`/api/pueblos/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (r.status === 401) {
      window.location.href = "/entrar";
      return null;
    }
    if (!r.ok) throw new Error(`Error cargando pueblo (${r.status})`);
    const data = await r.json();
    if (!data?.id) throw new Error("Pueblo sin id");
    
    // Guardar coordenadas del pueblo para comparación
    setPuebloLat(data.lat ?? null);
    setPuebloLng(data.lng ?? null);
    
    return Number(data.id);
  }

  async function fetchPois(pid: number) {
    const r = await fetch(`/api/admin/pueblos/${pid}/pois`, { cache: "no-store" });
    if (r.status === 401) {
      window.location.href = "/entrar";
      return [];
    }
    if (r.status === 403) throw new Error("No autorizado (403)");
    if (!r.ok) throw new Error(`Error cargando POIs (${r.status})`);
    return (await r.json()) as PoiRow[];
  }

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const pid = puebloId ?? (await fetchPuebloId());
      if (!pid) return;
      if (!puebloId) setPuebloId(pid);
      const pois = await fetchPois(pid);
      setRows(pois);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function startEdit(row: PoiRow) {
    setEditId(row.id);
    setEditNombre(row.nombre ?? "");
    setEditDescripcion(row.descripcion ?? "");
    setEditLat(row.lat ?? "");
    setEditLng(row.lng ?? "");
    setEditCategoriaTematica(row.categoriaTematica ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditNombre("");
    setEditDescripcion("");
    setEditLat("");
    setEditLng("");
    setEditCategoriaTematica("");
  }

  async function saveEdit() {
    if (editId == null) return;
    setErr(null);

    const payload: any = {
      nombre: editNombre.trim() || undefined,
      descripcion: editDescripcion.trim() || null,
      lat: typeof editLat === "number" ? editLat : null,
      lng: typeof editLng === "number" ? editLng : null,
      categoriaTematica: editCategoriaTematica.trim() || null,
    };

    const r = await fetch(`/api/admin/pois/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (r.status === 401) {
      window.location.href = "/entrar";
      return;
    }

    const text = await r.text();
    if (!r.ok) {
      alert(`Error ${r.status}: ${text}`);
      return;
    }

    cancelEdit();
    await refresh();
  }

  async function deletePoi(id: number) {
    if (!confirm("¿Eliminar este POI?")) return;
    setErr(null);

    const r = await fetch(`/api/admin/pois/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (r.status === 401) {
      window.location.href = "/entrar";
      return;
    }

    const text = await r.text();
    if (!r.ok) {
      alert(`Error ${r.status}: ${text}`);
      return;
    }

    await refresh();
  }

  async function createPoi() {
    if (!puebloId) return;
    if (!createNombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    setErr(null);

    const latStr = String(createLat ?? "").trim();
    const lngStr = String(createLng ?? "").trim();

    const latVal = latStr === "" ? null : Number(latStr.replace(",", "."));
    const lngVal = lngStr === "" ? null : Number(lngStr.replace(",", "."));

    const payload = {
      nombre: createNombre.trim(),
      descripcion: createDescripcion.trim() || null,
      lat: latVal ?? null,
      lng: lngVal ?? null,
      categoriaTematica: createCategoriaTematica.trim() || null,
    };

    const r = await fetch(`/api/admin/pueblos/${puebloId}/pois`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (r.status === 401) {
      window.location.href = "/entrar";
      return;
    }

    const text = await r.text();
    if (!r.ok) {
      alert(`Error ${r.status}: ${text}`);
      return;
    }

    // Limpiar formulario
    setCreateNombre("");
    setCreateDescripcion("");
    setCreateLat("");
    setCreateLng("");
    setCreateCategoriaTematica("");
    setShowCreateForm(false);

    await refresh();
  }

  async function swapOrden(curr: PoiRow, other: PoiRow) {
    if (!puebloId) return;
    setErr(null);

    const r = await fetch(`/api/admin/pueblos/${puebloId}/pois/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ aId: Number(curr.id), bId: Number(other.id) }),
    });

    if (r.status === 401) {
      window.location.href = "/entrar";
      return;
    }

    const text = await r.text();
    if (!r.ok) {
      alert(`Error ${r.status}: ${text}`);
      return;
    }

    await refresh();
  }

  async function moveUp(index: number) {
    if (index <= 0) return;
    await swapOrden(sorted[index], sorted[index - 1]);
  }

  async function moveDown(index: number) {
    if (index >= sorted.length - 1) return;
    await swapOrden(sorted[index], sorted[index + 1]);
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando POIs...</div>;
  if (err) return <div style={{ padding: 24, color: "#d32f2f" }}>Error: {err}</div>;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Gestión de POIs</h1>
      <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
        Pueblo: <strong>{slug}</strong>
      </p>

      {/* Botón añadir */}
      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "10px 16px",
            fontSize: 14,
            backgroundColor: showCreateForm ? "#ccc" : "#1976d2",
            color: showCreateForm ? "#000" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {showCreateForm ? "Cancelar" : "Añadir POI"}
        </button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 6,
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Nuevo POI</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                Nombre *
              </label>
              <input
                type="text"
                value={createNombre}
                onChange={(e) => setCreateNombre(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  fontSize: 14,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={createLat}
                  onChange={(e) => setCreateLat(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="Opcional"
                  style={{
                    width: "100%",
                    padding: 8,
                    fontSize: 14,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={createLng}
                  onChange={(e) => setCreateLng(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="Opcional"
                  style={{
                    width: "100%",
                    padding: 8,
                    fontSize: 14,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
            
            {/* Aviso: coordenadas vacías → usará las del pueblo */}
            {(String(createLat ?? "").trim() === "" && String(createLng ?? "").trim() === "") && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  backgroundColor: "#ffecec",
                  color: "#9b1c1c",
                  borderRadius: 6,
                  fontSize: 13,
                  border: "1px solid #f5c2c2",
                }}
              >
                ℹ️ Si dejas la latitud y longitud en blanco, se usarán las coordenadas del pueblo.
              </div>
            )}
            
            <div>
              <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                Descripción
              </label>
              <textarea
                value={createDescripcion}
                onChange={(e) => setCreateDescripcion(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: 8,
                  fontSize: 14,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  fontFamily: "inherit",
                }}
              />
            </div>
            
            {/* Categoría temática */}
            <div>
              <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                Categoría temática
              </label>
              <select
                value={createCategoriaTematica}
                onChange={(e) => setCreateCategoriaTematica(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  fontSize: 14,
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  backgroundColor: "#fff",
                }}
              >
                {CATEGORIAS_TEMATICAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                Clasifica este POI para que aparezca en &quot;Qué hacer&quot; → categoría seleccionada.
              </p>
            </div>
            
            {/* Info sobre fotos */}
            <div
              style={{
                marginTop: 20,
                padding: 12,
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 6,
                fontSize: 13,
                color: "#0c4a6e",
              }}
            >
              💡 Después de crear el POI podrás subir fotos desde el editor.
            </div>
            
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={createPoi}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateNombre("");
                  setCreateDescripcion("");
                  setCreateLat("");
                  setCreateLng("");
                  setCreateCategoriaTematica("");
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  backgroundColor: "#ccc",
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de POIs */}
      <div style={{ marginTop: 24 }}>
        {sorted.length === 0 ? (
          <p style={{ fontSize: 14, color: "#666" }}>No hay POIs aún.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sorted.map((row, idx) => {
              const isEditing = editId === row.id;

              return (
                <div
                  key={row.id}
                  style={{
                    padding: 16,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    backgroundColor: isEditing ? "#fff8e1" : "#fff",
                  }}
                >
                  {isEditing ? (
                    // Modo edición
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            fontSize: 14,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                            Latitud
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editLat}
                            onChange={(e) =>
                              setEditLat(e.target.value ? parseFloat(e.target.value) : "")
                            }
                            style={{
                              width: "100%",
                              padding: 8,
                              fontSize: 14,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                            Longitud
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editLng}
                            onChange={(e) =>
                              setEditLng(e.target.value ? parseFloat(e.target.value) : "")
                            }
                            style={{
                              width: "100%",
                              padding: 8,
                              fontSize: 14,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Aviso: Este POI usa coordenadas del pueblo */}
                      {(() => {
                        const editLatNum = typeof editLat === "number" ? editLat : null;
                        const editLngNum = typeof editLng === "number" ? editLng : null;
                        return puebloLat != null && puebloLng != null && isSameCoordsAsPueblo(editLatNum, editLngNum, puebloLat, puebloLng) && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 10px",
                              backgroundColor: "#ffecec",
                              color: "#9b1c1c",
                              borderRadius: 6,
                              fontSize: 13,
                              border: "1px solid #f5c2c2",
                            }}
                          >
                            ℹ️ Este POI está usando las coordenadas del pueblo.
                          </div>
                        );
                      })()}
                      
                      <div>
                        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                          Descripción
                        </label>
                        <textarea
                          value={editDescripcion}
                          onChange={(e) => setEditDescripcion(e.target.value)}
                          rows={4}
                          style={{
                            width: "100%",
                            padding: 8,
                            fontSize: 14,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                      
                      {/* Categoría temática */}
                      <div>
                        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
                          Categoría temática
                        </label>
                        <select
                          value={editCategoriaTematica}
                          onChange={(e) => setEditCategoriaTematica(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            fontSize: 14,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            backgroundColor: "#fff",
                          }}
                        >
                          {CATEGORIAS_TEMATICAS.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          Clasifica este POI para que aparezca en &quot;Qué hacer&quot; → categoría seleccionada.
                        </p>
                      </div>
                      
                      {/* Fotos */}
                      {editId ? (
                        <div style={{ marginTop: 20 }}>
                          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                            Fotos
                          </h4>
                          <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                            La primera foto (orden #1) es la principal.
                          </p>
                          <PhotoManager entity="poi" entityId={editId} />
                        </div>
                      ) : (
                        <div
                          style={{
                            marginTop: 20,
                            padding: 12,
                            backgroundColor: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 14,
                            color: "#6b7280",
                          }}
                        >
                          Guarda el POI para poder subir fotos.
                        </div>
                      )}
                      
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={saveEdit}
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            backgroundColor: "#4caf50",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            backgroundColor: "#ccc",
                            color: "#000",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo vista
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span
                              style={{
                                display: "inline-block",
                                minWidth: 28,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#666",
                                backgroundColor: "#f0f0f0",
                                borderRadius: 4,
                                textAlign: "center",
                              }}
                            >
                              #{idx + 1}
                            </span>
                            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                              {row.nombre}
                            </h3>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                            <div style={{ fontSize: 13, color: "#666" }}>
                              Coordenadas: {row.lat ?? "—"}, {row.lng ?? "—"}
                            </div>
                            {puebloLat != null && puebloLng != null && isSameCoordsAsPueblo(row.lat, row.lng, puebloLat, puebloLng) && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#9b1c1c",
                                  backgroundColor: "#ffecec",
                                  border: "1px solid #f5c2c2",
                                  borderRadius: 999,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Coordenadas del pueblo
                              </span>
                            )}
                            {row.categoriaTematica && (
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#0d6efd",
                                  backgroundColor: "#e7f1ff",
                                  border: "1px solid #b6d4fe",
                                  borderRadius: 999,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {CATEGORIAS_TEMATICAS.find(c => c.value === row.categoriaTematica)?.label || row.categoriaTematica}
                              </span>
                            )}
                          </div>
                          {row.descripcion ? (
                            <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                              <strong style={{ fontSize: 12, color: "#999" }}>Descripción:</strong>
                              <p style={{ marginTop: 4, lineHeight: 1.4 }}>
                                {row.descripcion.length > 120
                                  ? `${row.descripcion.slice(0, 120).trim()}...`
                                  : row.descripcion}
                              </p>
                            </div>
                          ) : (
                            <div style={{ fontSize: 13, color: "#999", marginTop: 8, fontStyle: "italic" }}>
                              Sin descripción
                            </div>
                          )}
                          {row.foto && (
                            <RotatedImage
                              src={row.foto}
                              alt={row.nombre}
                              rotation={row.rotation}
                              height={150}
                              width={200}
                              loading="eager"
                            />
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            style={{
                              padding: "6px 10px",
                              fontSize: 14,
                              backgroundColor: idx === 0 ? "#eee" : "#fff",
                              border: "1px solid #ddd",
                              borderRadius: 4,
                              cursor: idx === 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === sorted.length - 1}
                            style={{
                              padding: "6px 10px",
                              fontSize: 14,
                              backgroundColor: idx === sorted.length - 1 ? "#eee" : "#fff",
                              border: "1px solid #ddd",
                              borderRadius: 4,
                              cursor: idx === sorted.length - 1 ? "not-allowed" : "pointer",
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 14,
                              backgroundColor: "#1976d2",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePoi(row.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 14,
                              backgroundColor: "#d32f2f",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32, fontSize: 14 }}>
        <a href={`/gestion/pueblos/${slug}`} style={{ color: "#1976d2", textDecoration: "none" }}>
          ← Volver a gestión del pueblo
        </a>
      </div>
    </main>
  );
}
