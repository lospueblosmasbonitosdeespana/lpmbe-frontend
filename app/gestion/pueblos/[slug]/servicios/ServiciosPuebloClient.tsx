"use client";

import { useCallback, useEffect, useState } from "react";
import MapLocationPicker, { type MapMarker } from "@/app/components/MapLocationPicker";
import {
  TIPOS_SERVICIO,
  DIAS_SEMANA,
  getTipoServicioConfig,
  type TipoServicio,
  type HorarioServicio,
} from "@/lib/tipos-servicio";

type PuntoServicioRow = {
  id: number;
  tipo: string;
  nombre?: string | null;
  lat?: number | null;
  lng?: number | null;
  horario?: HorarioServicio | null;
  orden?: number | null;
};

type FormState = {
  tipo: TipoServicio;
  nombre: string;
  lat: number | null;
  lng: number | null;
  horario: HorarioServicio;
};

const HORARIO_VACIO: HorarioServicio = {
  lunes: "",
  martes: "",
  miercoles: "",
  jueves: "",
  viernes: "",
  sabado: "",
  domingo: "",
};

function formVacio(): FormState {
  return {
    tipo: "LAVABO",
    nombre: "",
    lat: null,
    lng: null,
    horario: { ...HORARIO_VACIO },
  };
}

function hasHorario(horario: HorarioServicio): boolean {
  return Object.values(horario).some((v) => v != null && v.trim() !== "");
}

export default function ServiciosPuebloClient({
  puebloId,
  puebloNombre,
  puebloLat,
  puebloLng,
}: {
  puebloId: number;
  puebloNombre: string;
  puebloLat?: number | null;
  puebloLng?: number | null;
}) {
  const [rows, setRows] = useState<PuntoServicioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(formVacio());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showHorario, setShowHorario] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  const mapCenter: [number, number] =
    puebloLat != null && puebloLng != null
      ? [puebloLat, puebloLng]
      : [40.4168, -3.7038];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/puntos-servicio`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? `Error ${r.status}`);
      }
      const data = await r.json();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando puntos de servicio");
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setIsCreating(true);
    setEditingId(null);
    setForm(formVacio());
    setFormError(null);
    setShowHorario(false);
  }

  function startEdit(row: PuntoServicioRow) {
    setEditingId(row.id);
    setIsCreating(false);
    setForm({
      tipo: row.tipo as TipoServicio,
      nombre: row.nombre ?? "",
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      horario: { ...HORARIO_VACIO, ...(row.horario ?? {}) },
    });
    setFormError(null);
    setShowHorario(hasHorario({ ...HORARIO_VACIO, ...(row.horario ?? {}) }));
    if (row.lat != null && row.lng != null) {
      setFlyTo([row.lat, row.lng]);
    }
  }

  function cancelForm() {
    setIsCreating(false);
    setEditingId(null);
    setForm(formVacio());
    setFormError(null);
    setShowHorario(false);
    setFlyTo(null);
  }

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setForm((f) => ({ ...f, lat, lng }));
  }, []);

  async function handleSave() {
    if (!form.tipo) {
      setFormError("Selecciona un tipo de servicio");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        tipo: form.tipo,
        nombre: form.nombre.trim() || undefined,
        lat: form.lat,
        lng: form.lng,
        horario: hasHorario(form.horario)
          ? Object.fromEntries(
              Object.entries(form.horario).filter(([, v]) => v != null && (v as string).trim() !== "")
            )
          : null,
      };

      let r: Response;
      if (isCreating) {
        r = await fetch(`/api/admin/pueblos/${puebloId}/puntos-servicio`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        r = await fetch(`/api/admin/puntos-servicio/${editingId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? d?.message ?? `Error ${r.status}`);
      }

      cancelForm();
      await load();
    } catch (e: any) {
      setFormError(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este punto de servicio?")) return;
    try {
      const r = await fetch(`/api/admin/puntos-servicio/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? `Error ${r.status}`);
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      if (editingId === id) cancelForm();
    } catch (e: any) {
      alert(e?.message ?? "Error eliminando");
    }
  }

  const existingMarkers: MapMarker[] = rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const cfg = getTipoServicioConfig(r.tipo);
      return {
        lat: r.lat!,
        lng: r.lng!,
        label: cfg?.etiqueta ?? r.tipo,
        color: cfg?.color ?? "#6b7280",
      };
    });

  const selectedPosition =
    form.lat != null && form.lng != null
      ? { lat: form.lat, lng: form.lng }
      : null;

  const isFormOpen = isCreating || editingId != null;

  return (
    <div className="space-y-6">
      {/* MAPA */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <MapLocationPicker
          center={mapCenter}
          zoom={14}
          existingMarkers={existingMarkers}
          selectedPosition={selectedPosition}
          onLocationSelect={isFormOpen ? handleLocationSelect : undefined}
          height="380px"
          showSearch={isFormOpen}
          flyTo={flyTo}
          activeHint={
            isFormOpen
              ? "Pulsa en el mapa para situar el punto de servicio"
              : undefined
          }
        />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {rows
          .filter((r) => r.lat != null && r.lng != null)
          .map((r) => {
            const cfg = getTipoServicioConfig(r.tipo);
            return (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: (cfg?.color ?? "#6b7280") + "22", color: cfg?.color ?? "#6b7280" }}
              >
                <span>{cfg?.emoji ?? "📍"}</span>
                <span>{cfg?.etiqueta ?? r.tipo}</span>
                {r.nombre && <span>— {r.nombre}</span>}
              </span>
            );
          })}
      </div>

      {/* Botón añadir */}
      {!isFormOpen && (
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Añadir punto de servicio
        </button>
      )}

      {/* FORMULARIO */}
      {isFormOpen && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
          <h3 className="font-semibold text-blue-900 text-sm">
            {isCreating ? "Nuevo punto de servicio" : "Editar punto de servicio"}
          </h3>

          {/* Selector de tipo */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Tipo de servicio <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {TIPOS_SERVICIO.map((t) => (
                <button
                  key={t.tipo}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: t.tipo }))}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all ${
                    form.tipo === t.tipo
                      ? "border-blue-500 bg-blue-100 font-semibold text-blue-800 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ background: t.color }}
                    dangerouslySetInnerHTML={{ __html: t.svg }}
                  />
                  <span className="text-center leading-tight">{t.etiqueta}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre opcional */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Nombre (opcional, ej: "Parking Norte")
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Nombre descriptivo"
            />
          </div>

          {/* Coordenadas */}
          <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-500">
            {form.lat != null && form.lng != null ? (
              <span className="text-green-700 font-medium">
                Posición: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:underline"
                  onClick={() => setForm((f) => ({ ...f, lat: null, lng: null }))}
                >
                  Quitar
                </button>
              </span>
            ) : (
              <span className="text-amber-700">
                Pulsa en el mapa para situar este punto
              </span>
            )}
          </div>

          {/* Horarios */}
          <div>
            <button
              type="button"
              onClick={() => setShowHorario((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            >
              <span>{showHorario ? "▼" : "▶"}</span>
              Horarios de apertura (opcional)
            </button>

            {showHorario && (
              <div className="mt-3 space-y-2">
                {DIAS_SEMANA.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-gray-600">{label}</span>
                    <input
                      type="text"
                      value={form.horario[key] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          horario: { ...f.horario, [key]: e.target.value },
                        }))
                      }
                      placeholder="ej: 9:00-14:00, 16:00-19:00"
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-1">
                  Deja vacío el día si está cerrado. Ej: "9:00-14:00" o "9:00-14:00, 16:00-19:00"
                </p>
              </div>
            )}
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : isCreating ? "Crear" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LISTADO */}
      {loading && (
        <p className="text-sm text-gray-500">Cargando puntos de servicio…</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-gray-400">
          Aún no hay puntos de servicio para {puebloNombre}. Pulsa "Añadir" para crear el primero.
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {rows.length} punto{rows.length !== 1 ? "s" : ""} de servicio
          </p>
          {rows.map((row) => {
            const cfg = getTipoServicioConfig(row.tipo);
            const isEditing = editingId === row.id;
            return (
              <div
                key={row.id}
                className={`rounded-lg border p-4 ${
                  isEditing
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: cfg?.color ?? "#6b7280" }}
                      dangerouslySetInnerHTML={{ __html: cfg?.svg ?? "📍" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cfg?.etiqueta ?? row.tipo}
                        {row.nombre && (
                          <span className="ml-1 font-normal text-gray-500">— {row.nombre}</span>
                        )}
                      </p>
                      {row.lat != null && row.lng != null ? (
                        <p className="text-xs text-gray-400">
                          {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">Sin coordenadas</p>
                      )}
                      {row.horario && hasHorario(row.horario) && (
                        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                          {DIAS_SEMANA.map(({ key, label }) =>
                            row.horario?.[key] ? (
                              <span key={key} className="block">
                                <span className="font-medium">{label}:</span> {row.horario[key]}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => (isEditing ? cancelForm() : startEdit(row))}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
