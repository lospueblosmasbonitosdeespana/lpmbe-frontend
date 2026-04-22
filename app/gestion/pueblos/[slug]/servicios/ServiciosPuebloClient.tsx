"use client";

import { useCallback, useEffect, useState } from "react";
import MapLocationPicker, { type MapMarker } from "@/app/components/MapLocationPicker";
import {
  TIPOS_SERVICIO,
  DIAS_SEMANA,
  getTipoServicioConfig,
  toHorarioTramos,
  hasAnyTramo,
  type DiaSemana,
  type TipoServicio,
  type HorarioTramos,
  type Tramo,
} from "@/lib/tipos-servicio";

type PuntoServicioRow = {
  id: number;
  tipo: string;
  nombre?: string | null;
  lat?: number | null;
  lng?: number | null;
  horario?: unknown;
  horarioTramos?: HorarioTramos | null;
  orden?: number | null;
};

type FormState = {
  tipo: TipoServicio;
  nombre: string;
  lat: number | null;
  lng: number | null;
  horario: HorarioTramos;
};

function horarioVacio(): HorarioTramos {
  return {
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
    domingo: [],
  };
}

function formVacio(): FormState {
  return {
    tipo: "LAVABO",
    nombre: "",
    lat: null,
    lng: null,
    horario: horarioVacio(),
  };
}

/** Texto resumen para mostrar en la tarjeta de listado de un punto. */
function formatTramosDia(tramos: Tramo[] | undefined): string {
  if (!tramos || tramos.length === 0) return "Cerrado";
  return tramos.map((t) => `${t.abre}–${t.cierra}`).join(" · ");
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
    // El backend devuelve `horarioTramos` ya estructurado. Si por alguna
    // razón no viniera, parseamos el `horario` legacy (string) a tramos.
    const tramos =
      row.horarioTramos ?? toHorarioTramos(row.horario as Record<string, unknown> | null | undefined);
    setForm({
      tipo: row.tipo as TipoServicio,
      nombre: row.nombre ?? "",
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      horario: { ...horarioVacio(), ...tramos },
    });
    setFormError(null);
    setShowHorario(hasAnyTramo(tramos));
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
        horario: hasAnyTramo(form.horario)
          ? Object.fromEntries(
              DIAS_SEMANA.map(({ key }) => [key, form.horario[key] ?? []]),
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
      const base = cfg?.etiqueta ?? r.tipo;
      return {
        lat: r.lat!,
        lng: r.lng!,
        label: r.nombre?.trim() ? `${base} — ${r.nombre.trim()}` : base,
        servicioTipo: r.tipo,
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
      <div className="overflow-hidden rounded-xl border border-border">
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
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {rows
          .filter((r) => r.lat != null && r.lng != null)
          .map((r) => {
            const cfg = getTipoServicioConfig(r.tipo);
            const col = cfg?.color ?? "#6b7280";
            return (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
                style={{ background: col + "22", color: col }}
              >
                <span
                  className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: col }}
                  dangerouslySetInnerHTML={{ __html: cfg?.svg ?? "" }}
                />
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
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/60 dark:bg-blue-950/20">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {isCreating ? "Nuevo punto de servicio" : "Editar punto de servicio"}
          </h3>

          {/* Selector de tipo */}
          <div>
            <label className="mb-2 block text-xs font-medium text-foreground/80">
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
                      ? "border-blue-500 bg-blue-100 font-semibold text-blue-800 shadow-sm dark:bg-blue-900/40 dark:text-blue-100"
                      : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/40"
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
            <label className="mb-1 block text-xs font-medium text-foreground/80">
              Nombre (opcional, ej: "Parking Norte")
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-blue-500 focus:outline-none"
              placeholder="Nombre descriptivo"
            />
          </div>

          {/* Coordenadas */}
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            {form.lat != null && form.lng != null ? (
              <span className="font-medium text-green-700 dark:text-green-400">
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
              <span className="text-amber-700 dark:text-amber-400">
                Pulsa en el mapa para situar este punto
              </span>
            )}
          </div>

          {/* Horarios */}
          <div>
            <button
              type="button"
              onClick={() => setShowHorario((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              <span>{showHorario ? "▼" : "▶"}</span>
              Horarios de apertura (opcional)
            </button>

            {showHorario && (
              <HorarioEditor
                value={form.horario}
                onChange={(h) => setForm((f) => ({ ...f, horario: h }))}
              />
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
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted/40 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LISTADO */}
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando puntos de servicio…</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          Aún no hay puntos de servicio para {puebloNombre}. Pulsa "Añadir" para crear el primero.
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {rows.length} punto{rows.length !== 1 ? "s" : ""} de servicio
          </p>
          {rows.map((row) => {
            const cfg = getTipoServicioConfig(row.tipo);
            const isEditing = editingId === row.id;
            const tramosRow =
              row.horarioTramos ?? toHorarioTramos(row.horario as Record<string, unknown> | null | undefined);
            const tieneHorario = hasAnyTramo(tramosRow);
            return (
              <div
                key={row.id}
                className={`rounded-lg border p-4 ${
                  isEditing
                    ? "border-blue-300 bg-blue-50"
                    : "border-border bg-card"
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
                      <p className="text-sm font-medium text-foreground">
                        {cfg?.etiqueta ?? row.tipo}
                        {row.nombre && (
                          <span className="ml-1 font-normal text-muted-foreground">— {row.nombre}</span>
                        )}
                      </p>
                      {row.lat != null && row.lng != null ? (
                        <p className="text-xs text-muted-foreground">
                          {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">Sin coordenadas</p>
                      )}
                      {tieneHorario && (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {DIAS_SEMANA.map(({ key, label }) => {
                            const tramos = tramosRow[key] ?? [];
                            if (tramos.length === 0) return null;
                            return (
                              <span key={key} className="block">
                                <span className="font-medium">{label}:</span> {formatTramosDia(tramos)}
                              </span>
                            );
                          })}
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

/* ------------------------------------------------------------------ */
/* Editor de horarios (dos tramos por día: mañana / tarde)            */
/* ------------------------------------------------------------------ */

const DEFAULT_MANANA: Tramo = { abre: "09:00", cierra: "14:00" };
const DEFAULT_TARDE: Tramo = { abre: "16:00", cierra: "19:00" };

function HorarioEditor({
  value,
  onChange,
}: {
  value: HorarioTramos;
  onChange: (h: HorarioTramos) => void;
}) {
  function setDia(dia: DiaSemana, tramos: Tramo[]) {
    onChange({ ...value, [dia]: tramos });
  }

  function setTramo(dia: DiaSemana, idx: 0 | 1, tramo: Tramo | null) {
    const arr = [...(value[dia] ?? [])];
    if (tramo == null) {
      arr.splice(idx, 1);
    } else {
      arr[idx] = tramo;
    }
    setDia(dia, arr);
  }

  function copiarLunesALaborables() {
    const base = value.lunes ?? [];
    const next: HorarioTramos = { ...value };
    (["martes", "miercoles", "jueves", "viernes"] as const).forEach((d) => {
      next[d] = base.map((t) => ({ ...t }));
    });
    onChange(next);
  }

  function cerrarTodos() {
    onChange(horarioVacio());
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiarLunesALaborables}
          className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
        >
          Copiar Lunes → Mar-Vie
        </button>
        <button
          type="button"
          onClick={cerrarTodos}
          className="rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40"
        >
          Cerrado toda la semana
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-1 font-medium">Día</th>
              <th className="px-2 py-1 font-medium">Mañana</th>
              <th className="px-2 py-1 font-medium">Tarde</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {DIAS_SEMANA.map(({ key, label }) => {
              const dia = value[key] ?? [];
              const manana = dia[0];
              const tarde = dia[1];
              const cerrado = dia.length === 0;
              return (
                <tr key={key} className="border-t border-border/60">
                  <td className="px-2 py-1.5 font-medium text-foreground/80">{label}</td>
                  <td className="px-2 py-1.5">
                    <TramoInput
                      value={manana ?? null}
                      onChange={(t) => setTramo(key, 0, t)}
                      onAdd={() => setTramo(key, 0, DEFAULT_MANANA)}
                      disabled={cerrado}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <TramoInput
                      value={tarde ?? null}
                      onChange={(t) => setTramo(key, 1, t)}
                      onAdd={() => {
                        // Si no hay mañana aún, añadir primero la mañana.
                        const arr = [...(value[key] ?? [])];
                        if (arr.length === 0) arr.push(DEFAULT_MANANA);
                        arr[1] = DEFAULT_TARDE;
                        setDia(key, arr);
                      }}
                      disabled={cerrado}
                    />
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {cerrado ? (
                      <button
                        type="button"
                        onClick={() => setDia(key, [DEFAULT_MANANA])}
                        className="rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                      >
                        Abrir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDia(key, [])}
                        className="rounded border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
                      >
                        Cerrado
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Deja un día en "Cerrado" si ese día no hay servicio. Usa solo la columna "Mañana" para horario intensivo.
      </p>
    </div>
  );
}

function TramoInput({
  value,
  onChange,
  onAdd,
  disabled,
}: {
  value: Tramo | null;
  onChange: (t: Tramo | null) => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (value == null) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="rounded border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-blue-300 hover:text-blue-700"
      >
        + Añadir
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        type="time"
        value={value.abre}
        onChange={(e) => onChange({ ...value, abre: e.target.value })}
        className="w-[90px] rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-blue-400 focus:outline-none"
      />
      <span className="text-muted-foreground">–</span>
      <input
        type="time"
        value={value.cierra}
        onChange={(e) => onChange({ ...value, cierra: e.target.value })}
        className="w-[90px] rounded border border-border bg-background px-1.5 py-1 text-xs text-foreground focus:border-blue-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(null)}
        className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
        title="Quitar tramo"
      >
        ×
      </button>
    </div>
  );
}
