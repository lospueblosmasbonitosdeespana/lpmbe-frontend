"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoManager from "@/app/components/PhotoManager";
import RotatedImage from "@/app/components/RotatedImage";
import MapLocationPicker, { type MapMarker } from "@/app/components/MapLocationPicker";

type PoiRow = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  foto?: string | null;
  rotation?: number | null;
  lat?: number | null;
  lng?: number | null;
  orden?: number | null;
};

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

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createNombre, setCreateNombre] = useState("");
  const [createDescripcion, setCreateDescripcion] = useState("");
  const [createLat, setCreateLat] = useState<number | "">("");
  const [createLng, setCreateLng] = useState<number | "">("");

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (a.orden ?? 999999) - (b.orden ?? 999999));
    return copy;
  }, [rows]);

  // Marcadores existentes para el mapa
  const existingMarkers: MapMarker[] = useMemo(() => {
    return sorted
      .filter((r) => r.lat != null && r.lng != null)
      .map((r, i) => ({
        lat: r.lat!,
        lng: r.lng!,
        label: `#${i + 1} ${r.nombre}`,
        color: editId === r.id ? 'gold' : isSameCoordsAsPueblo(r.lat, r.lng, puebloLat, puebloLng) ? 'grey' : 'blue',
        number: i + 1,
      }));
  }, [sorted, editId, puebloLat, puebloLng]);

  // Posición seleccionada en el mapa (para crear/editar)
  const selectedMapPosition = useMemo(() => {
    if (showCreateForm && typeof createLat === "number" && typeof createLng === "number") {
      return { lat: createLat, lng: createLng };
    }
    if (editId != null && typeof editLat === "number" && typeof editLng === "number") {
      return { lat: editLat, lng: editLng };
    }
    return null;
  }, [showCreateForm, createLat, createLng, editId, editLat, editLng]);

  // Centro del mapa
  const mapCenter: [number, number] = useMemo(() => {
    if (puebloLat != null && puebloLng != null) return [puebloLat, puebloLng];
    return [40.4168, -3.7038]; // Madrid
  }, [puebloLat, puebloLng]);

  // flyTo dinámico (para editar POI desde lista o mapa)
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);

  // Click en marcador existente del mapa → empezar edición
  const handleExistingMarkerClick = useCallback(
    (index: number) => {
      const poi = sorted[index];
      if (!poi) return;
      startEdit(poi);
      // Scroll al formulario de edición (que está en la lista debajo)
      setTimeout(() => {
        const el = document.getElementById(`poi-card-${poi.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorted],
  );

  async function fetchPuebloId() {
    const r = await fetch(`/api/pueblos/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (r.status === 401) {
      window.location.href = "/entrar";
      return null;
    }
    if (!r.ok) throw new Error(`Error cargando pueblo (${r.status})`);
    const data = await r.json();
    if (!data?.id) throw new Error("Pueblo sin id");
    
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

  // Callback del mapa
  function handleMapLocationSelect(lat: number, lng: number, name?: string) {
    // Si lat=0, lng=0 → quitar marcador
    if (lat === 0 && lng === 0) {
      if (showCreateForm) {
        setCreateLat("");
        setCreateLng("");
      } else if (editId != null) {
        setEditLat("");
        setEditLng("");
      }
      return;
    }

    if (showCreateForm) {
      setCreateLat(Math.round(lat * 1000000) / 1000000);
      setCreateLng(Math.round(lng * 1000000) / 1000000);
      // Si viene nombre del buscador y no hay nombre puesto, sugerirlo
      if (name && !createNombre.trim()) {
        setCreateNombre(name.split(',')[0]);
      }
    } else if (editId != null) {
      setEditLat(Math.round(lat * 1000000) / 1000000);
      setEditLng(Math.round(lng * 1000000) / 1000000);
    }
  }

  function startEdit(row: PoiRow) {
    setEditId(row.id);
    setEditNombre(row.nombre ?? "");
    setEditDescripcion(row.descripcion ?? "");
    setEditLat(row.lat ?? "");
    setEditLng(row.lng ?? "");
    setShowCreateForm(false);
    // Fly al POI en el mapa si tiene coordenadas propias (no Madrid)
    if (row.lat != null && row.lng != null) {
      setFlyToPos([row.lat, row.lng]);
    }
    // Scroll al mapa
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function cancelEdit() {
    setEditId(null);
    setEditNombre("");
    setEditDescripcion("");
    setEditLat("");
    setEditLng("");
    setFlyToPos(null);
  }

  async function saveEdit() {
    if (editId == null) return;
    setErr(null);

    // Parsear lat/lng: aceptar número, string con punto o coma
    const parsedLat =
      typeof editLat === "number"
        ? editLat
        : typeof editLat === "string" && editLat.trim() !== ""
          ? parseFloat(editLat.replace(",", "."))
          : null;
    const parsedLng =
      typeof editLng === "number"
        ? editLng
        : typeof editLng === "string" && editLng.trim() !== ""
          ? parseFloat(editLng.replace(",", "."))
          : null;

    const payload: any = {
      nombre: editNombre.trim() || undefined,
      descripcion: editDescripcion.trim() || undefined,
      lat: parsedLat != null && !isNaN(parsedLat) ? parsedLat : null,
      lng: parsedLng != null && !isNaN(parsedLng) ? parsedLng : null,
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

    const payload = {
      nombre: createNombre.trim(),
      descripcion: createDescripcion.trim() || null,
      lat: typeof createLat === "number" ? createLat : null,
      lng: typeof createLng === "number" ? createLng : null,
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

    setCreateNombre("");
    setCreateDescripcion("");
    setCreateLat("");
    setCreateLng("");
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

  if (loading) return <div className="p-6">Cargando POIs...</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Gestión de POIs</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{slug}</strong>
      </p>

      {/* MAPA */}
      <div className="mt-6" ref={mapSectionRef}>
        <h2 className="mb-2 text-lg font-semibold">Mapa de POIs</h2>
        <MapLocationPicker
          center={mapCenter}
          zoom={15}
          existingMarkers={existingMarkers}
          selectedPosition={selectedMapPosition}
          onLocationSelect={(showCreateForm || editId != null) ? handleMapLocationSelect : undefined}
          onExistingMarkerClick={handleExistingMarkerClick}
          height="420px"
          searchPlaceholder="Buscar lugar (ej: Catedral de Albarracín)..."
          activeHint={
            showCreateForm
              ? "Creando POI: haz clic en el mapa o busca un lugar para ubicarlo. Las coordenadas se rellenarán automáticamente."
              : editId != null
                ? `Editando POI "${editNombre}": haz clic en el mapa o busca para cambiar su ubicación.`
                : undefined
          }
          flyTo={flyToPos}
        />

        {/* Leyenda */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-600" /> POI con coordenadas propias
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-400" /> POI con coordenadas del pueblo (Madrid = error)
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" /> POI en edición
          </div>
          {selectedMapPosition && (
            <div className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-red-600" /> Posición seleccionada (arrastrable)
            </div>
          )}
        </div>
      </div>

      {/* Botón añadir */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) cancelEdit();
          }}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            showCreateForm
              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {showCreateForm ? "Cancelar" : "+ Añadir POI"}
        </button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-4">
          <h3 className="text-base font-semibold">Nuevo POI</h3>
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <input
              type="text"
              value={createNombre}
              onChange={(e) => setCreateNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ej: Castillo de Ainsa"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Latitud</label>
              <input
                type="number"
                step="any"
                value={createLat}
                onChange={(e) => setCreateLat(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="Haz clic en el mapa ↑"
                className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Longitud</label>
              <input
                type="number"
                step="any"
                value={createLng}
                onChange={(e) => setCreateLng(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="Haz clic en el mapa ↑"
                className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              ↑ Ir al mapa para ubicar
            </button>
            <span className="text-xs text-gray-400">
              {typeof createLat === "number" ? `Coordenadas: ${createLat}, ${createLng}` : "Haz clic en el mapa o busca un lugar"}
            </span>
          </div>
          
          {(String(createLat ?? "").trim() === "" && String(createLng ?? "").trim() === "") && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              Haz clic en el mapa arriba o usa el buscador para situar el POI. Si dejas las coordenadas vacías, se usarán las del pueblo.
            </div>
          )}
          
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea
              value={createDescripcion}
              onChange={(e) => setCreateDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            Después de crear el POI podrás subir fotos desde el editor.
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createPoi}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Crear POI
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setCreateNombre("");
                setCreateDescripcion("");
                setCreateLat("");
                setCreateLng("");
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de POIs */}
      <div className="mt-6 space-y-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">No hay POIs aún.</p>
        ) : (
          sorted.map((row, idx) => {
            const isEditing = editId === row.id;

            return (
              <div
                key={row.id}
                id={`poi-card-${row.id}`}
                className={`rounded-lg border p-4 ${
                  isEditing ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-white"
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Nombre</label>
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Latitud</label>
                        <input
                          type="number"
                          step="any"
                          value={editLat}
                          onChange={(e) =>
                            setEditLat(e.target.value ? parseFloat(e.target.value) : "")
                          }
                          className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm font-mono"
                          placeholder="Haz clic en el mapa ↑"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Longitud</label>
                        <input
                          type="number"
                          step="any"
                          value={editLng}
                          onChange={(e) =>
                            setEditLng(e.target.value ? parseFloat(e.target.value) : "")
                          }
                          className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm font-mono"
                          placeholder="Haz clic en el mapa ↑"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        ↑ Ir al mapa para ubicar
                      </button>
                      <span className="text-xs text-gray-400">Haz clic en el mapa o busca un lugar</span>
                    </div>
                    
                    {(() => {
                      const editLatNum = typeof editLat === "number" ? editLat : null;
                      const editLngNum = typeof editLng === "number" ? editLng : null;
                      return puebloLat != null && puebloLng != null && isSameCoordsAsPueblo(editLatNum, editLngNum, puebloLat, puebloLng) && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 font-medium">
                          ⚠ Este POI está usando las coordenadas del pueblo (posiblemente Madrid). ¡Usa el mapa arriba para ubicarlo correctamente!
                        </div>
                      );
                    })()}
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium">Descripción</label>
                      <textarea
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    
                    {editId && (
                      <div className="mt-4">
                        <h4 className="text-base font-semibold mb-2">Fotos</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          La primera foto (orden #1) es la principal.
                        </p>
                        <PhotoManager entity="poi" entityId={editId} />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block min-w-[28px] rounded bg-gray-100 px-2 py-0.5 text-center text-xs font-semibold text-gray-600">
                            #{idx + 1}
                          </span>
                          <h3 className="text-base font-semibold">{row.nombre}</h3>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">
                            Coordenadas: {row.lat?.toFixed(5) ?? "—"}, {row.lng?.toFixed(5) ?? "—"}
                          </span>
                          {puebloLat != null && puebloLng != null && isSameCoordsAsPueblo(row.lat, row.lng, puebloLat, puebloLng) && (
                            <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                              ⚠ Sin ubicar — Coordenadas del pueblo
                            </span>
                          )}
                        </div>
                        {row.descripcion ? (
                          <p className="text-sm text-gray-600 line-clamp-2">{row.descripcion}</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin descripción</p>
                        )}
                        {row.foto && (
                          <RotatedImage
                            src={row.foto}
                            alt={row.nombre}
                            rotation={row.rotation}
                            height={120}
                            width={160}
                            loading="eager"
                          />
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={idx === sorted.length - 1}
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePoi(row.id)}
                          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <a href={`/gestion/pueblos/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Volver a gestión del pueblo
        </a>
      </div>
    </main>
  );
}
