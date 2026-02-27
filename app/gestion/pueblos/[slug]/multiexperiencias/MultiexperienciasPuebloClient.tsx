"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import R2ImageUploader from "@/app/components/R2ImageUploader";
import MapLocationPicker, { type MapMarker } from "@/app/components/MapLocationPicker";

type Multiexperiencia = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  slug: string;
  activo: boolean;
  legacyId?: number | null;
};

type Parada = {
  kind: "LEGACY" | "CUSTOM";
  legacyLugarId: number | null;
  customId?: number | null;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  lat: number | null;
  lng: number | null;
  orden: number | null;
};

export default function MultiexperienciasPuebloClient({ slug }: { slug: string }) {
  const [pueblo, setPueblo] = useState<any>(null);
  const [multiexperiencias, setMultiexperiencias] = useState<Multiexperiencia[]>([]);
  const [expandedMxId, setExpandedMxId] = useState<number | null>(null);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear multiexperiencia
  const [showCreateMx, setShowCreateMx] = useState(false);
  const [createMxTitulo, setCreateMxTitulo] = useState("");
  const [createMxDescripcion, setCreateMxDescripcion] = useState("");

  // Crear parada nueva (custom)
  const [showCreateParada, setShowCreateParada] = useState(false);
  const [createParadaTitulo, setCreateParadaTitulo] = useState("");
  const [createParadaDescripcion, setCreateParadaDescripcion] = useState("");
  const [createParadaLat, setCreateParadaLat] = useState("");
  const [createParadaLng, setCreateParadaLng] = useState("");
  const [createParadaFoto, setCreateParadaFoto] = useState("");

  // Editar parada inline (legacy o custom)
  const [editParadaIdx, setEditParadaIdx] = useState<number | null>(null);
  const [editParadaTitulo, setEditParadaTitulo] = useState("");
  const [editParadaDescripcion, setEditParadaDescripcion] = useState("");
  const [editParadaLat, setEditParadaLat] = useState("");
  const [editParadaLng, setEditParadaLng] = useState("");
  const [editParadaFoto, setEditParadaFoto] = useState("");

  // Editar foto de multiexperiencia
  const [editingMxFoto, setEditingMxFoto] = useState<number | null>(null);
  const [editMxFotoValue, setEditMxFotoValue] = useState("");

  // Editar titulo/descripcion de multiexperiencia
  const [editingMxMetaId, setEditingMxMetaId] = useState<number | null>(null);
  const [editMxTitulo, setEditMxTitulo] = useState("");
  const [editMxDescripcion, setEditMxDescripcion] = useState("");

  // flyTo para el mapa
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);

  // Ref para scroll al mapa
  const mapSectionRef = useRef<HTMLDivElement>(null);

  /* ── Carga de datos ──────────────────────────── */

  useEffect(() => {
    async function loadPueblo() {
      try {
        const res = await fetch(`/api/pueblos/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Error cargando pueblo");
        const data = await res.json();
        setPueblo(data);
      } catch (err: any) {
        console.error("Error loading pueblo:", err);
        setError(err.message ?? "Error desconocido");
      }
    }
    loadPueblo();
  }, [slug]);

  useEffect(() => {
    if (!pueblo?.id) return;
    async function loadMultiexperiencias() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Error cargando multiexperiencias");
        const data = await res.json();
        setMultiexperiencias(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Error loading multiexperiencias:", err);
        setError(err.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    loadMultiexperiencias();
  }, [pueblo]);

  async function loadParadas(mxId: number) {
    try {
      const res = await fetch(`/api/admin/multiexperiencias/${mxId}/paradas`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Error desconocido");
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      setParadas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error loading paradas:", err);
      const msg = err?.message?.includes("500")
        ? "No se pudieron cargar las paradas. Se mostrarán las paradas creadas en el sistema (si hay)."
        : `Error cargando paradas: ${err.message}`;
      alert(msg);
      setParadas([]);
    }
  }

  function toggleExpand(mxId: number) {
    if (expandedMxId === mxId) {
      setExpandedMxId(null);
      setParadas([]);
      resetCreateParada();
      cancelEditParada();
    } else {
      setExpandedMxId(mxId);
      loadParadas(mxId);
      resetCreateParada();
      cancelEditParada();
    }
  }

  /* ── Crear multiexperiencia ──────────────────── */

  async function handleCreateMx() {
    if (!createMxTitulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    try {
      const res = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: createMxTitulo,
          descripcion: createMxDescripcion || null,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Error creando multiexperiencia");
      }
      const refreshRes = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, {
        cache: "no-store",
      });
      const refreshData = await refreshRes.json();
      setMultiexperiencias(Array.isArray(refreshData) ? refreshData : []);
      setCreateMxTitulo("");
      setCreateMxDescripcion("");
      setShowCreateMx(false);
      alert("Multiexperiencia creada correctamente");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  /* ── Actualizar titulo/descripcion multiexperiencia ───────────────── */

  async function handleUpdateMultiexperiencia(mx: Multiexperiencia) {
    const tituloTrim = editMxTitulo.trim();
    if (!tituloTrim) {
      alert("El título no puede estar vacío");
      return;
    }
    try {
      const res = await fetch(`/api/admin/multiexperiencias/${mx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tituloTrim, descripcion: editMxDescripcion.trim() || null }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      if (pueblo?.id) {
        const resRefresh = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, { cache: "no-store" });
        if (resRefresh.ok) {
          const data = await resRefresh.json();
          setMultiexperiencias(Array.isArray(data) ? data : []);
        }
      }
      setEditingMxMetaId(null);
      setEditMxTitulo("");
      setEditMxDescripcion("");
      alert("Multiexperiencia actualizada");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  /* ── Eliminar multiexperiencia ───────────────── */

  async function handleDeleteMultiexperiencia(mx: Multiexperiencia) {
    if (!confirm(`¿Eliminar la multiexperiencia "${mx.titulo}"?`)) return;
    const res = await fetch(`/api/admin/multiexperiencias/${mx.id}`, { method: "DELETE" });
    const text = await res.text();
    if (!res.ok) {
      alert(`Error ${res.status}: ${text}`);
      return;
    }
    setMultiexperiencias((prev) => prev.filter((x) => x.id !== mx.id));
    if (expandedMxId === mx.id) setExpandedMxId(null);
    alert("Multiexperiencia eliminada correctamente");
  }

  /* ── Crear parada (custom nueva) ─────────────── */

  function resetCreateParada() {
    setCreateParadaTitulo("");
    setCreateParadaDescripcion("");
    setCreateParadaFoto("");
    setCreateParadaLat("");
    setCreateParadaLng("");
    setShowCreateParada(false);
  }

  async function handleCreateParada() {
    if (!createParadaTitulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const latStr = createParadaLat.trim();
    const lngStr = createParadaLng.trim();
    if ((latStr && !lngStr) || (!latStr && lngStr)) {
      alert("Debes proporcionar AMBAS coordenadas o dejar ambas vacías");
      return;
    }
    let lat: number | null = null;
    let lng: number | null = null;
    if (latStr && lngStr) {
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert("Las coordenadas deben ser números válidos");
        return;
      }
    }
    try {
      const payload: any = { titulo: createParadaTitulo.trim() };
      if (createParadaDescripcion?.trim()) payload.descripcion = createParadaDescripcion.trim();
      if (createParadaFoto?.trim()) payload.foto = createParadaFoto.trim();
      if (latStr && lngStr) {
        payload.lat = lat!;
        payload.lng = lng!;
      }
      const res = await fetch(`/api/admin/multiexperiencias/${expandedMxId}/paradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }
      await loadParadas(expandedMxId!);
      resetCreateParada();
      alert("Parada creada correctamente");
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    }
  }

  /* ── Editar parada inline (legacy o custom) ──── */

  function startEditParada(idx: number) {
    const p = paradas[idx];
    if (!p) return;
    setEditParadaIdx(idx);
    setEditParadaTitulo(p.titulo);
    setEditParadaDescripcion(p.descripcion ?? "");
    setEditParadaFoto(p.foto ?? "");
    setEditParadaLat(p.lat != null ? String(p.lat) : "");
    setEditParadaLng(p.lng != null ? String(p.lng) : "");
    setShowCreateParada(false);
    // Fly al punto en el mapa
    if (p.lat != null && p.lng != null) {
      setFlyToPos([p.lat, p.lng]);
    }
    // Scroll al mapa
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function cancelEditParada() {
    setEditParadaIdx(null);
    setEditParadaTitulo("");
    setEditParadaDescripcion("");
    setEditParadaFoto("");
    setEditParadaLat("");
    setEditParadaLng("");
    setFlyToPos(null);
  }

  async function saveEditParada() {
    if (editParadaIdx == null || !expandedMxId) return;
    const p = paradas[editParadaIdx];
    if (!p) return;

    if (!editParadaTitulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    const latStr = editParadaLat.trim();
    const lngStr = editParadaLng.trim();
    if ((latStr && !lngStr) || (!latStr && lngStr)) {
      alert("Debes proporcionar AMBAS coordenadas o dejar ambas vacías");
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;
    if (latStr && lngStr) {
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert("Las coordenadas deben ser números válidos");
        return;
      }
    }

    try {
      const payload: any = {
        titulo: editParadaTitulo.trim(),
      };
      if (editParadaDescripcion?.trim()) {
        payload.descripcion = editParadaDescripcion.trim();
      } else {
        payload.descripcion = null;
      }
      if (editParadaFoto?.trim()) {
        payload.foto = editParadaFoto.trim();
      }
      if (latStr && lngStr) {
        payload.lat = lat!;
        payload.lng = lng!;
      }

      if (p.kind === "LEGACY" && p.legacyLugarId) {
        payload.legacyLugarId = p.legacyLugarId;
      } else if (p.kind === "CUSTOM" && p.customId) {
        payload.customId = p.customId;
      }

      const res = await fetch(`/api/admin/multiexperiencias/${expandedMxId}/paradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }

      await loadParadas(expandedMxId);
      cancelEditParada();
      alert("Parada actualizada correctamente");
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    }
  }

  /* ── Reordenar paradas (swap universal) ──────── */

  async function handleSwapParada(direction: "up" | "down", currentIndex: number) {
    if (!expandedMxId) return;
    const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (neighborIndex < 0 || neighborIndex >= paradas.length) return;

    const currentParada = paradas[currentIndex];
    const neighborParada = paradas[neighborIndex];

    const a = {
      kind: currentParada.kind,
      ...(currentParada.kind === "LEGACY"
        ? { legacyLugarId: currentParada.legacyLugarId }
        : { customId: currentParada.customId }),
    };
    const b = {
      kind: neighborParada.kind,
      ...(neighborParada.kind === "LEGACY"
        ? { legacyLugarId: neighborParada.legacyLugarId }
        : { customId: neighborParada.customId }),
    };

    try {
      const res = await fetch(`/api/admin/multiexperiencias/${expandedMxId}/paradas/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a, b }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }
      await loadParadas(expandedMxId);
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    }
  }

  /* ── Eliminar parada ─────────────────────────── */

  async function handleDeleteParada(parada: Parada) {
    if (!expandedMxId) return;
    const mensaje =
      parada.kind === "LEGACY"
        ? "¿Ocultar esta parada de la multiexperiencia? Se puede volver a mostrar editando."
        : "¿Eliminar esta parada custom?";
    if (!confirm(mensaje)) return;

    try {
      let url = "";
      if (parada.kind === "LEGACY" && parada.legacyLugarId) {
        url = `/api/admin/multiexperiencias/${expandedMxId}/paradas/legacy/${parada.legacyLugarId}`;
      } else if (parada.kind === "CUSTOM" && parada.customId) {
        url = `/api/admin/multiexperiencias/${expandedMxId}/paradas/${parada.customId}`;
      } else {
        alert("Error: no se puede eliminar esta parada");
        return;
      }
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }
      await loadParadas(expandedMxId);
      alert(parada.kind === "LEGACY" ? "Parada ocultada correctamente" : "Parada eliminada correctamente");
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    }
  }

  /* ── Helpers ─────────────────────────────────── */

  function areCoordsPueblo(lat: number | null, lng: number | null): boolean {
    if (lat == null || lng == null || !pueblo?.lat || !pueblo?.lng) return false;
    const EPS = 0.00005;
    return Math.abs(lat - pueblo.lat) < EPS && Math.abs(lng - pueblo.lng) < EPS;
  }

  // Callback del mapa para ubicación
  const handleMapLocationSelect = useCallback(
    (lat: number, lng: number, name?: string) => {
      if (lat === 0 && lng === 0) {
        // Quitar marcador
        if (editParadaIdx != null) {
          setEditParadaLat("");
          setEditParadaLng("");
        } else if (showCreateParada) {
          setCreateParadaLat("");
          setCreateParadaLng("");
        }
        return;
      }
      const roundLat = String(Math.round(lat * 1000000) / 1000000);
      const roundLng = String(Math.round(lng * 1000000) / 1000000);

      if (editParadaIdx != null) {
        setEditParadaLat(roundLat);
        setEditParadaLng(roundLng);
      } else if (showCreateParada) {
        setCreateParadaLat(roundLat);
        setCreateParadaLng(roundLng);
        if (name && !createParadaTitulo.trim()) {
          setCreateParadaTitulo(name.split(",")[0]);
        }
      }
    },
    [editParadaIdx, showCreateParada, createParadaTitulo],
  );

  // Click en marcador existente → iniciar edición
  const handleExistingMarkerClick = useCallback(
    (index: number) => {
      startEditParada(index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paradas],
  );

  /* ── Datos del mapa ──────────────────────────── */

  const mapCenter: [number, number] = useMemo(() => {
    if (pueblo?.lat && pueblo?.lng) return [pueblo.lat, pueblo.lng];
    return [40.4168, -3.7038];
  }, [pueblo]);

  const existingMarkers: MapMarker[] = useMemo(() => {
    return paradas
      .filter((p) => p.lat != null && p.lng != null)
      .map((p, i) => ({
        lat: p.lat!,
        lng: p.lng!,
        label: `#${i + 1} ${p.titulo} (${p.kind})`,
        color:
          editParadaIdx === i
            ? "gold"
            : areCoordsPueblo(p.lat, p.lng)
              ? "grey"
              : p.kind === "LEGACY"
                ? "blue"
                : "green",
        number: i + 1,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paradas, editParadaIdx, pueblo]);

  const selectedMapPosition = useMemo(() => {
    if (editParadaIdx != null && editParadaLat && editParadaLng) {
      const lat = parseFloat(editParadaLat);
      const lng = parseFloat(editParadaLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    if (showCreateParada && createParadaLat && createParadaLng) {
      const lat = parseFloat(createParadaLat);
      const lng = parseFloat(createParadaLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  }, [editParadaIdx, editParadaLat, editParadaLng, showCreateParada, createParadaLat, createParadaLng]);

  const isMapActive = showCreateParada || editParadaIdx != null;

  const activeHint = useMemo(() => {
    if (editParadaIdx != null) {
      const p = paradas[editParadaIdx];
      return `Editando parada "${p?.titulo ?? ""}": haz clic en el mapa o busca para cambiar su ubicación.`;
    }
    if (showCreateParada) {
      return "Creando parada: haz clic en el mapa o busca un lugar. Las coordenadas se rellenarán automáticamente.";
    }
    return undefined;
  }, [editParadaIdx, showCreateParada, paradas]);

  /* ── Render ──────────────────────────────────── */

  if (loading && !pueblo) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p>Cargando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-red-600">Error: {error}</p>
      </main>
    );
  }

  if (!pueblo) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-red-600">Pueblo no encontrado</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Gestión de Multiexperiencias</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{pueblo.nombre}</strong>
      </p>

      <div className="mt-6">
        <Link href={`/gestion/pueblos/${slug}`} className="text-blue-600 hover:underline text-sm">
          ← Volver a gestión del pueblo
        </Link>
      </div>

      {/* Botón crear multiexperiencia */}
      <div className="mt-6">
        {!showCreateMx ? (
          <button
            onClick={() => setShowCreateMx(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Crear Multiexperiencia
          </button>
        ) : (
          <div className="rounded border border-gray-300 bg-gray-50 p-4">
            <h3 className="text-lg font-semibold">Nueva Multiexperiencia</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">
                  Título <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={createMxTitulo}
                  onChange={(e) => setCreateMxTitulo(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea
                  value={createMxDescripcion}
                  onChange={(e) => setCreateMxDescripcion(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateMx}
                  className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Crear
                </button>
                <button
                  onClick={() => {
                    setShowCreateMx(false);
                    setCreateMxTitulo("");
                    setCreateMxDescripcion("");
                  }}
                  className="rounded bg-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de multiexperiencias */}
      <div className="mt-6 space-y-4">
        {multiexperiencias.length === 0 ? (
          <p className="text-sm text-gray-600">No hay multiexperiencias asociadas</p>
        ) : (
          multiexperiencias.map((mx) => (
            <div key={mx.id} className="rounded border border-gray-300 bg-white p-4">
              <div className="flex items-start gap-4">
                {mx.foto && (
                  <img
                    src={mx.foto}
                    alt={mx.titulo ?? "Foto multiexperiencia"}
                    style={{
                      width: 220,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 10,
                      background: "#f2f2f2",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex-1">
                    {editingMxMetaId === mx.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editMxTitulo}
                          onChange={(e) => setEditMxTitulo(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-lg font-semibold"
                          placeholder="Título"
                        />
                        <textarea
                          value={editMxDescripcion}
                          onChange={(e) => setEditMxDescripcion(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                          rows={2}
                          placeholder="Descripción"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{mx.titulo}</h3>
                        {mx.descripcion && (
                          <p className="mt-1 text-sm text-gray-600">{mx.descripcion}</p>
                        )}
                      </>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Slug: {mx.slug} | Activa: {mx.activo ? "Sí" : "No"}
                    </p>
                    {editingMxFoto === mx.id ? (
                      <div className="mt-2 space-y-2">
                        <R2ImageUploader
                          label="Foto de la multiexperiencia"
                          value={editMxFotoValue || null}
                          onChange={(url) => setEditMxFotoValue(url ?? "")}
                          folder="multiexperiencias/portadas"
                          previewHeight="h-24"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const fotoTrimmed = editMxFotoValue.trim();
                                if (!fotoTrimmed) {
                                  alert("Sube una foto o cancela.");
                                  return;
                                }
                                const res = await fetch(`/api/admin/multiexperiencias/${mx.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ foto: fotoTrimmed }),
                                });
                                if (!res.ok) {
                                  const errorText = await res.text();
                                  throw new Error(errorText);
                                }
                                if (pueblo?.id) {
                                  const resRefresh = await fetch(
                                    `/api/admin/pueblos/${pueblo.id}/multiexperiencias`,
                                    { cache: "no-store" },
                                  );
                                  if (resRefresh.ok) {
                                    const data = await resRefresh.json();
                                    setMultiexperiencias(Array.isArray(data) ? data : []);
                                  }
                                }
                                setEditingMxFoto(null);
                                setEditMxFotoValue("");
                                alert("Foto actualizada");
                              } catch (err: any) {
                                alert(`Error: ${err.message}`);
                              }
                            }}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingMxFoto(null);
                              setEditMxFotoValue("");
                            }}
                            className="rounded bg-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingMxFoto(mx.id);
                          setEditMxFotoValue(mx.foto || "");
                        }}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        {mx.foto ? "Editar foto" : "Añadir foto"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleExpand(mx.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      {expandedMxId === mx.id ? "Cerrar" : "Ver paradas"}
                    </button>
                    {editingMxMetaId === mx.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateMultiexperiencia(mx)}
                          className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingMxMetaId(null);
                            setEditMxTitulo("");
                            setEditMxDescripcion("");
                          }}
                          className="rounded bg-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingMxMetaId(mx.id);
                          setEditMxTitulo(mx.titulo ?? "");
                          setEditMxDescripcion(mx.descripcion ?? "");
                        }}
                        className="rounded bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700 whitespace-nowrap"
                      >
                        Editar
                      </button>
                    )}
                    {mx.legacyId == null && (
                      <button
                        onClick={() => handleDeleteMultiexperiencia(mx)}
                        className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 whitespace-nowrap"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Paradas expandidas ── */}
              {expandedMxId === mx.id && (
                <div className="mt-4 rounded bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold">Paradas</h4>
                    {!showCreateParada && editParadaIdx == null && (
                      <button
                        onClick={() => {
                          cancelEditParada();
                          setShowCreateParada(true);
                        }}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                      >
                        + Añadir Parada
                      </button>
                    )}
                  </div>

                  {/* MAPA */}
                  <div className="mt-3" ref={mapSectionRef}>
                    <MapLocationPicker
                      center={mapCenter}
                      zoom={14}
                      existingMarkers={existingMarkers}
                      selectedPosition={selectedMapPosition}
                      onLocationSelect={isMapActive ? handleMapLocationSelect : undefined}
                      onExistingMarkerClick={handleExistingMarkerClick}
                      height="380px"
                      searchPlaceholder="Buscar lugar (ej: Catedral de Albarracín)..."
                      activeHint={activeHint}
                      flyTo={flyToPos}
                    />
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />{" "}
                        Legacy
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />{" "}
                        Custom
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />{" "}
                        Coords del pueblo
                      </div>
                      {editParadaIdx != null && (
                        <div className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />{" "}
                          En edición
                        </div>
                      )}
                      {selectedMapPosition && (
                        <div className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />{" "}
                          Posición seleccionada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulario crear parada nueva (custom) */}
                  {showCreateParada && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                      <h5 className="text-sm font-semibold text-green-800">
                        Nueva Parada (custom)
                      </h5>
                      <div>
                        <label className="block text-sm font-medium">
                          Título <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={createParadaTitulo}
                          onChange={(e) => setCreateParadaTitulo(e.target.value)}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <textarea
                          value={createParadaDescripcion}
                          onChange={(e) => setCreateParadaDescripcion(e.target.value)}
                          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                          rows={2}
                        />
                      </div>
                      <R2ImageUploader
                        label="Foto de la parada"
                        value={createParadaFoto || null}
                        onChange={(url) => setCreateParadaFoto(url ?? "")}
                        folder="multiexperiencias/paradas"
                        previewHeight="h-32"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium">Latitud</label>
                          <input
                            type="text"
                            value={createParadaLat}
                            onChange={(e) => setCreateParadaLat(e.target.value)}
                            className="mt-1 w-full rounded border border-blue-400 bg-blue-50 px-3 py-2 font-mono text-sm"
                            placeholder="Haz clic en el mapa ↑"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Longitud</label>
                          <input
                            type="text"
                            value={createParadaLng}
                            onChange={(e) => setCreateParadaLng(e.target.value)}
                            className="mt-1 w-full rounded border border-blue-400 bg-blue-50 px-3 py-2 font-mono text-sm"
                            placeholder="Haz clic en el mapa ↑"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">
                        {createParadaLat && createParadaLng
                          ? `Coordenadas: ${createParadaLat}, ${createParadaLng}`
                          : "Haz clic en el mapa arriba o usa el buscador para situar la parada."}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateParada}
                          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Crear Parada
                        </button>
                        <button
                          onClick={resetCreateParada}
                          className="rounded bg-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Lista de paradas ── */}
                  <div className="mt-4 space-y-3">
                    {paradas.length === 0 ? (
                      <p className="text-sm text-gray-600">No hay paradas</p>
                    ) : (
                      paradas.map((parada, idx) => {
                        const paradaKey =
                          parada.kind === "LEGACY"
                            ? `L-${parada.legacyLugarId}`
                            : `C-${parada.customId}`;
                        const isEditing = editParadaIdx === idx;

                        return (
                          <div
                            key={paradaKey}
                            id={`parada-card-${idx}`}
                            className={`rounded-lg border p-4 ${
                              isEditing
                                ? "border-yellow-300 bg-yellow-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            {isEditing ? (
                              /* ── Formulario de edición inline ── */
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <span className="inline-block min-w-[28px] rounded bg-yellow-200 px-2 py-0.5 text-center text-xs font-semibold text-yellow-800">
                                    #{idx + 1}
                                  </span>
                                  <h5 className="text-sm font-semibold text-yellow-800">
                                    Editando: {parada.titulo}
                                  </h5>
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                                      parada.kind === "LEGACY"
                                        ? "bg-gray-200 text-gray-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {parada.kind}
                                  </span>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium">
                                    Título <span className="text-red-600">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={editParadaTitulo}
                                    onChange={(e) => setEditParadaTitulo(e.target.value)}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium">Descripción</label>
                                  <textarea
                                    value={editParadaDescripcion}
                                    onChange={(e) => setEditParadaDescripcion(e.target.value)}
                                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                                    rows={3}
                                  />
                                </div>

                                <R2ImageUploader
                                  label="Foto de la parada"
                                  value={editParadaFoto || null}
                                  onChange={(url) => setEditParadaFoto(url ?? "")}
                                  folder="multiexperiencias/paradas"
                                  previewHeight="h-32"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium">Latitud</label>
                                    <input
                                      type="text"
                                      value={editParadaLat}
                                      onChange={(e) => setEditParadaLat(e.target.value)}
                                      className="mt-1 w-full rounded border border-blue-400 bg-blue-50 px-3 py-2 font-mono text-sm"
                                      placeholder="Haz clic en el mapa ↑"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium">Longitud</label>
                                    <input
                                      type="text"
                                      value={editParadaLng}
                                      onChange={(e) => setEditParadaLng(e.target.value)}
                                      className="mt-1 w-full rounded border border-blue-400 bg-blue-50 px-3 py-2 font-mono text-sm"
                                      placeholder="Haz clic en el mapa ↑"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      mapSectionRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      });
                                    }}
                                    className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                                  >
                                    ↑ Ir al mapa para ubicar
                                  </button>
                                  <span className="text-xs text-gray-400">
                                    {editParadaLat && editParadaLng
                                      ? `Coordenadas: ${editParadaLat}, ${editParadaLng}`
                                      : "Haz clic en el mapa o busca un lugar"}
                                  </span>
                                </div>

                                {areCoordsPueblo(
                                  editParadaLat ? parseFloat(editParadaLat) : null,
                                  editParadaLng ? parseFloat(editParadaLng) : null,
                                ) && (
                                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 font-medium">
                                    ⚠ Esta parada está usando las coordenadas del pueblo. ¡Usa el
                                    mapa arriba para ubicarla correctamente!
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEditParada}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                  >
                                    Guardar cambios
                                  </button>
                                  <button
                                    onClick={cancelEditParada}
                                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Vista normal de la parada ── */
                              <div className="flex items-start gap-3">
                                {parada.foto && (
                                  <img
                                    src={parada.foto}
                                    alt={parada.titulo}
                                    style={{
                                      width: 160,
                                      height: 110,
                                      objectFit: "cover",
                                      borderRadius: 8,
                                    }}
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-block min-w-[28px] rounded bg-gray-100 px-2 py-0.5 text-center text-xs font-semibold text-gray-600">
                                      #{idx + 1}
                                    </span>
                                    <h5 className="text-sm font-semibold">{parada.titulo}</h5>
                                    <span
                                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                                        parada.kind === "LEGACY"
                                          ? "bg-gray-200 text-gray-700"
                                          : "bg-purple-100 text-purple-700"
                                      }`}
                                    >
                                      {parada.kind}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {parada.kind === "LEGACY" &&
                                      `legacyLugarId: ${parada.legacyLugarId}`}
                                    {parada.kind === "CUSTOM" && `customId: ${parada.customId}`}
                                  </p>
                                  {parada.descripcion && (
                                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                      {parada.descripcion}
                                    </p>
                                  )}
                                  {parada.lat != null && parada.lng != null && (
                                    <div className="mt-1 flex items-center gap-2">
                                      <p className="text-xs text-gray-500">
                                        Coords: {parada.lat.toFixed(5)}, {parada.lng.toFixed(5)}
                                      </p>
                                      {areCoordsPueblo(parada.lat, parada.lng) && (
                                        <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                                          ⚠ Sin ubicar
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleSwapParada("up", idx)}
                                    disabled={idx === 0}
                                    className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleSwapParada("down", idx)}
                                    disabled={idx === paradas.length - 1}
                                    className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => startEditParada(idx)}
                                    className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteParada(parada)}
                                    className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
