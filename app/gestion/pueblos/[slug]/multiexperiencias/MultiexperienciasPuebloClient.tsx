"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type Parada = {
  kind: 'LEGACY' | 'CUSTOM';
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

  // Estados para crear multiexperiencia
  const [showCreateMx, setShowCreateMx] = useState(false);
  const [createMxTitulo, setCreateMxTitulo] = useState("");
  const [createMxDescripcion, setCreateMxDescripcion] = useState("");

  // Estados para crear/editar parada
  const [showCreateParada, setShowCreateParada] = useState(false);
  const [paradaMode, setParadaMode] = useState<'legacy' | 'nueva'>('nueva');
  const [selectedLegacyId, setSelectedLegacyId] = useState<number | null>(null);
  const [createParadaTitulo, setCreateParadaTitulo] = useState("");
  const [createParadaDescripcion, setCreateParadaDescripcion] = useState("");
  const [createParadaLat, setCreateParadaLat] = useState("");
  const [createParadaLng, setCreateParadaLng] = useState("");
  const [createParadaFoto, setCreateParadaFoto] = useState("");
  
  // Estados para editar foto de multiexperiencia
  const [editingMxFoto, setEditingMxFoto] = useState<number | null>(null);
  const [editMxFotoValue, setEditMxFotoValue] = useState("");

  // Cargar pueblo
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

  // Cargar multiexperiencias
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
        
        // DEBUG: Ver primera multiexperiencia
        console.log("[MX] Primera multiexperiencia:", data?.[0]);
        
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

  // Cargar paradas al expandir
  async function loadParadas(mxId: number) {
    try {
      console.log(`[DEBUG] Cargando paradas para mxId: ${mxId}`);
      const res = await fetch(`/api/admin/multiexperiencias/${mxId}/paradas`, {
        cache: "no-store",
      });
      
      console.log(`[DEBUG] Response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Error desconocido");
        console.error(`[DEBUG] Error response:`, errorText);
        throw new Error(`Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log(`[DEBUG] Paradas recibidas:`, data);
      setParadas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("[DEBUG] Error loading paradas:", err);
      alert(`Error cargando paradas: ${err.message}`);
    }
  }

  function toggleExpand(mxId: number) {
    if (expandedMxId === mxId) {
      setExpandedMxId(null);
      setParadas([]);
      setShowCreateParada(false);
    } else {
      setExpandedMxId(mxId);
      loadParadas(mxId);
      setShowCreateParada(false);
    }
  }

  // Crear multiexperiencia
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

      // Refrescar lista
      const refreshRes = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, {
        cache: "no-store",
      });
      const refreshData = await refreshRes.json();
      setMultiexperiencias(Array.isArray(refreshData) ? refreshData : []);

      // Limpiar formulario
      setCreateMxTitulo("");
      setCreateMxDescripcion("");
      setShowCreateMx(false);
      alert("Multiexperiencia creada correctamente");
    } catch (err: any) {
      console.error("Error creating mx:", err);
      alert(`Error: ${err.message}`);
    }
  }

  // Crear/editar parada (UPSERT)
  async function handleCreateParada() {
    // Validar según el modo
    if (paradaMode === 'legacy') {
      if (!selectedLegacyId) {
        alert("Debes seleccionar una parada legacy para editar");
        return;
      }
    }

    if (!createParadaTitulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    // Validar lat/lng: o ambas vacías, o ambas con valor
    const latStr = createParadaLat.trim();
    const lngStr = createParadaLng.trim();
    
    if ((latStr && !lngStr) || (!latStr && lngStr)) {
      alert("Debes proporcionar AMBAS coordenadas (lat y lng) o dejar ambas vacías");
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
      // Preparar payload base
      const payload: any = {
        titulo: createParadaTitulo.trim(),
      };

      // Descripción (opcional)
      if (createParadaDescripcion?.trim()) {
        payload.descripcion = createParadaDescripcion.trim();
      }

      // Foto (opcional)
      if (createParadaFoto?.trim()) {
        payload.foto = createParadaFoto.trim();
      }

      // Coordenadas: solo si hay algo escrito
      if (latStr || lngStr) {
        payload.lat = lat!;
        payload.lng = lng!;
      }

      // Solo incluir legacyLugarId si estamos en modo 'legacy'
      if (paradaMode === 'legacy') {
        if (!selectedLegacyId) {
          alert("Selecciona una parada legacy para editar");
          return;
        }
        payload.legacyLugarId = selectedLegacyId;
      }

      // IMPORTANTE: en modo 'nueva' NO se añade legacyLugarId nunca
      // LOG para verificar qué se envía
      console.log("[PARADAS] mode=", paradaMode === 'nueva' ? 'CUSTOM' : 'LEGACY', "payload=", payload);

      const res = await fetch(`/api/admin/multiexperiencias/${expandedMxId}/paradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[PARADAS] save failed", res.status, errorText);
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }

      // Refrescar paradas
      await loadParadas(expandedMxId!);

      // Limpiar formulario
      resetParadaForm();
      alert("Parada guardada correctamente");
    } catch (err: any) {
      console.error("[PARADAS] exception:", err);
      alert(`Error inesperado: ${err.message}`);
    }
  }

  // Helper para resetear formulario de parada
  function resetParadaForm() {
    setSelectedLegacyId(null);
    setCreateParadaTitulo("");
    setCreateParadaDescripcion("");
    setCreateParadaFoto("");
    setCreateParadaLat("");
    setCreateParadaLng("");
    setShowCreateParada(false);
    setParadaMode('nueva');
  }

  // Handler para cambio de modo (limpia estados cruzados)
  function handleModeChange(nextMode: 'legacy' | 'nueva') {
    setParadaMode(nextMode);

    if (nextMode === 'nueva') {
      // Limpiar selección legacy y campos
      setSelectedLegacyId(null);
      setCreateParadaTitulo("");
      setCreateParadaDescripcion("");
      setCreateParadaLat("");
      setCreateParadaLng("");
    }

    if (nextMode === 'legacy') {
      // Limpiar campos para que el usuario seleccione una parada legacy
      setCreateParadaTitulo("");
      setCreateParadaDescripcion("");
      setCreateParadaLat("");
      setCreateParadaLng("");
    }
  }

  // Reordenar paradas (swap UNIVERSAL - LEGACY ↔ LEGACY, CUSTOM ↔ CUSTOM, LEGACY ↔ CUSTOM)
  async function handleSwapParada(direction: "up" | "down", currentIndex: number) {
    if (!expandedMxId) return;

    const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (neighborIndex < 0 || neighborIndex >= paradas.length) return;

    const currentParada = paradas[currentIndex];
    const neighborParada = paradas[neighborIndex];

    // Construir payload universal
    const a = {
      kind: currentParada.kind,
      ...(currentParada.kind === 'LEGACY' 
        ? { legacyLugarId: currentParada.legacyLugarId } 
        : { customId: currentParada.customId })
    };

    const b = {
      kind: neighborParada.kind,
      ...(neighborParada.kind === 'LEGACY' 
        ? { legacyLugarId: neighborParada.legacyLugarId } 
        : { customId: neighborParada.customId })
    };

    console.log("[SWAP] payload=", { a, b });

    try {
      const res = await fetch(`/api/admin/multiexperiencias/${expandedMxId}/paradas/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a, b }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[SWAP] failed", res.status, errorText);
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }

      // Refrescar paradas
      await loadParadas(expandedMxId);
    } catch (err: any) {
      console.error("[SWAP] exception:", err);
      alert(`Error inesperado: ${err.message}`);
    }
  }

  // Eliminar parada (override legacy o custom completa)
  async function handleDeleteParada(parada: Parada) {
    if (!expandedMxId) return;
    
    const mensaje = parada.kind === 'LEGACY' 
      ? "¿Estás seguro de que deseas eliminar este override?" 
      : "¿Estás seguro de que deseas eliminar esta parada custom?";
    
    if (!confirm(mensaje)) return;

    try {
      let url = '';
      
      if (parada.kind === 'LEGACY' && parada.legacyLugarId) {
        // DELETE override legacy
        url = `/api/admin/multiexperiencias/paradas/${parada.legacyLugarId}`;
      } else if (parada.kind === 'CUSTOM' && parada.customId) {
        // DELETE custom parada
        url = `/api/admin/multiexperiencias/${expandedMxId}/paradas/${parada.customId}`;
      } else {
        alert("Error: no se puede eliminar esta parada");
        return;
      }

      console.log("[DELETE parada] url=", url);

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[DELETE parada] failed", res.status, errorText);
        alert(`Error ${res.status}: ${errorText}`);
        return;
      }

      // Refrescar paradas
      await loadParadas(expandedMxId);
      alert("Parada eliminada correctamente");
    } catch (err: any) {
      console.error("[DELETE parada] exception:", err);
      alert(`Error inesperado: ${err.message}`);
    }
  }

  // Eliminar multiexperiencia CUSTOM (HARD DELETE)
  async function handleDeleteMultiexperiencia(mx: Multiexperiencia) {
    if (!confirm(`¿Eliminar la multiexperiencia "${mx.titulo}"?`)) return;

    const res = await fetch(`/api/admin/multiexperiencias/${mx.id}`, {
      method: "DELETE",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("[DELETE MX] error", res.status, text);
      alert(`Error ${res.status}: ${text}`);
      return;
    }

    // HARD DELETE → quitar de la lista
    setMultiexperiencias((prev) => prev.filter((x) => x.id !== mx.id));

    // Si estaba expandida, cerrarla
    if (expandedMxId === mx.id) {
      setExpandedMxId(null);
    }

    alert("Multiexperiencia eliminada correctamente");
  }

  // Helper para detectar coordenadas del pueblo
  function areCoordsPueblo(lat: number | null, lng: number | null): boolean {
    if (lat == null || lng == null || !pueblo?.lat || !pueblo?.lng) return false;
    const EPS = 0.00005;
    return Math.abs(lat - pueblo.lat) < EPS && Math.abs(lng - pueblo.lng) < EPS;
  }

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
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="text-blue-600 hover:underline text-sm"
        >
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
            <div
              key={mx.id}
              className="rounded border border-gray-300 bg-white p-4"
            >
              <div className="flex items-start gap-4">
                {/* Foto de la multiexperiencia */}
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

                {/* Contenido */}
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{mx.titulo}</h3>
                    {mx.descripcion && (
                      <p className="mt-1 text-sm text-gray-600">{mx.descripcion}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Slug: {mx.slug} | Activa: {mx.activo ? "Sí" : "No"}
                    </p>
                    
                    {/* Editar foto de multiexperiencia (subida a R2) */}
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
                                  alert("Sube una foto o deja el campo vacío sin guardar.");
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
                                  const resRefresh = await fetch(`/api/admin/pueblos/${pueblo.id}/multiexperiencias`, { cache: "no-store" });
                                  if (resRefresh.ok) {
                                    const data = await resRefresh.json();
                                    setMultiexperiencias(Array.isArray(data) ? data : []);
                                  }
                                }
                                setEditingMxFoto(null);
                                setEditMxFotoValue("");
                                alert("Foto actualizada");
                              } catch (err: any) {
                                console.error("Error updating foto:", err);
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleExpand(mx.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                      {expandedMxId === mx.id ? "Cerrar" : "Ver paradas"}
                    </button>
                    
                    {/* Botón eliminar - SOLO para multiexperiencias CUSTOM (sin legacyId) */}
                    {!('legacyId' in mx) && (
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

              {/* Paradas expandidas */}
              {expandedMxId === mx.id && (
                <div className="mt-4 rounded bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold">Paradas</h4>
                    {!showCreateParada && (
                      <button
                        onClick={() => setShowCreateParada(true)}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                      >
                        + Crear/Editar Parada
                      </button>
                    )}
                  </div>

                  {/* Mapa de paradas */}
                  <div className="mt-3">
                    <MapLocationPicker
                      center={
                        pueblo?.lat && pueblo?.lng
                          ? [pueblo.lat, pueblo.lng]
                          : [40.4168, -3.7038]
                      }
                      zoom={14}
                      existingMarkers={paradas
                        .filter((p) => p.lat != null && p.lng != null)
                        .map((p, i) => ({
                          lat: p.lat!,
                          lng: p.lng!,
                          label: `#${i + 1} ${p.titulo} (${p.kind})`,
                          color: areCoordsPueblo(p.lat, p.lng) ? 'grey' : p.kind === 'LEGACY' ? 'blue' : 'green',
                          number: i + 1,
                        }))}
                      selectedPosition={
                        showCreateParada && createParadaLat && createParadaLng
                          ? { lat: parseFloat(createParadaLat), lng: parseFloat(createParadaLng) }
                          : null
                      }
                      onLocationSelect={
                        showCreateParada
                          ? (lat, lng, name) => {
                              if (lat === 0 && lng === 0) {
                                setCreateParadaLat('');
                                setCreateParadaLng('');
                                return;
                              }
                              setCreateParadaLat(String(Math.round(lat * 1000000) / 1000000));
                              setCreateParadaLng(String(Math.round(lng * 1000000) / 1000000));
                              if (name && !createParadaTitulo.trim()) {
                                setCreateParadaTitulo(name.split(',')[0]);
                              }
                            }
                          : undefined
                      }
                      height="350px"
                      searchPlaceholder="Buscar lugar (ej: Catedral de Albarracín)..."
                      activeHint={
                        showCreateParada
                          ? "Creando parada: haz clic en el mapa o busca un lugar. Las coordenadas se rellenarán automáticamente."
                          : undefined
                      }
                    />
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" /> Legacy
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" /> Custom
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" /> Coords del pueblo
                      </div>
                      {showCreateParada && (
                        <div className="flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> Nueva parada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulario crear/editar parada */}
                  {showCreateParada && (
                    <div className="mt-4 rounded border border-gray-300 bg-white p-4">
                      <h5 className="text-sm font-semibold">Crear/Editar Parada</h5>
                      
                      {/* Selector de modo */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">Tipo de parada:</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="nueva"
                              checked={paradaMode === 'nueva'}
                              onChange={() => handleModeChange('nueva')}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Crear parada nueva (sin legacy)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="legacy"
                              checked={paradaMode === 'legacy'}
                              onChange={() => handleModeChange('legacy')}
                              className="text-blue-600"
                            />
                            <span className="text-sm">Editar parada existente (legacy)</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        {/* Selector de parada legacy (solo en modo legacy) */}
                        {paradaMode === 'legacy' && (
                          <div>
                            <label className="block text-sm font-medium">
                              Seleccionar parada legacy <span className="text-red-600">*</span>
                            </label>
                            <select
                              value={selectedLegacyId ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const id = parseInt(val, 10);
                                  setSelectedLegacyId(id);
                                  const parada = paradas.find(p => p.legacyLugarId === id);
                                  if (parada) {
                                    setCreateParadaTitulo(parada.titulo);
                                    setCreateParadaDescripcion(parada.descripcion ?? '');
                                    setCreateParadaLat(parada.lat != null ? parada.lat.toString() : '');
                                    setCreateParadaLng(parada.lng != null ? parada.lng.toString() : '');
                                  }
                                } else {
                                  setSelectedLegacyId(null);
                                }
                              }}
                              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                            >
                              <option value="">-- Selecciona una parada --</option>
                              {paradas
                                .filter(p => p.kind === 'LEGACY' && p.legacyLugarId)
                                .map(p => (
                                  <option key={p.legacyLugarId!} value={p.legacyLugarId!}>
                                    {p.titulo} (ID: {p.legacyLugarId})
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        )}

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
                          label="Foto de la parada (se sube a R2)"
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
                            : "Haz clic en el mapa arriba o usa el buscador para situar la parada."
                          }
                        </p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateParada}
                            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={resetParadaForm}
                            className="rounded bg-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de paradas */}
                  <div className="mt-4 space-y-3">
                    {paradas.length === 0 ? (
                      <p className="text-sm text-gray-600">No hay paradas</p>
                    ) : (
                      paradas.map((parada, idx) => {
                        const paradaKey = parada.kind === 'LEGACY' 
                          ? `L-${parada.legacyLugarId}` 
                          : `C-${parada.customId}`;
                        
                        // Permitir swap universal (LEGACY ↔ LEGACY, CUSTOM ↔ CUSTOM, LEGACY ↔ CUSTOM)
                        const canSwap = true;

                        return (
                          <div
                            key={paradaKey}
                            className="rounded border border-gray-200 bg-white p-3"
                          >
                            <div className="flex items-start gap-3">
                              {/* Foto */}
                              {parada.foto && (
                                <img
                                  src={parada.foto}
                                  alt={parada.titulo}
                                  style={{ 
                                    width: 160, 
                                    height: 110, 
                                    objectFit: 'cover', 
                                    borderRadius: 8 
                                  }}
                                />
                              )}

                              {/* Contenido */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-semibold">
                                    #{idx + 1} {parada.titulo}
                                  </h5>
                                  
                                  {/* Badge según kind */}
                                  {parada.kind === 'LEGACY' && (
                                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                                      LEGACY
                                    </span>
                                  )}
                                  {parada.kind === 'CUSTOM' && (
                                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                      CUSTOM
                                    </span>
                                  )}
                                </div>

                                {/* IDs */}
                                <p className="mt-1 text-xs text-gray-500">
                                  {parada.kind === 'LEGACY' && `legacyLugarId: ${parada.legacyLugarId}`}
                                  {parada.kind === 'CUSTOM' && `customId: ${parada.customId}`}
                                </p>

                                {/* Descripción */}
                                {parada.descripcion && (
                                  <p className="mt-1 text-sm text-gray-600">
                                    {parada.descripcion}
                                  </p>
                                )}

                                {/* Coordenadas */}
                                {parada.lat != null && parada.lng != null && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs text-gray-500">
                                      Coords: {parada.lat.toFixed(5)}, {parada.lng.toFixed(5)}
                                    </p>
                                    {areCoordsPueblo(parada.lat, parada.lng) && (
                                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                        Coordenadas del pueblo
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Acciones */}
                              <div className="flex gap-1">
                                {/* Botones de swap universal (LEGACY ↔ CUSTOM) */}
                                {canSwap ? (
                                  <>
                                    <button
                                      onClick={() => handleSwapParada("up", idx)}
                                      disabled={idx === 0}
                                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => handleSwapParada("down", idx)}
                                      disabled={idx === paradas.length - 1}
                                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                      ↓
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 italic px-2">
                                    (no reordenable)
                                  </span>
                                )}

                                {/* Botón eliminar - para CUSTOM completas y overrides LEGACY */}
                                {parada.kind === 'CUSTOM' && (
                                  <button
                                    onClick={() => handleDeleteParada(parada)}
                                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
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
