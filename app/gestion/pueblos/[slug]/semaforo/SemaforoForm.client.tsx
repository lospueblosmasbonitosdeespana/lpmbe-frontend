"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  puebloId: number;
  slug: string;
  estadoInicial?: string | null;
  mensajeInicial?: string | null;
  mensajePublicoInicial?: string | null;
  motivoInicial?: string | null;
  inicioProgramadoInicial?: string | null;
  finProgramadoInicial?: string | null;
  estadoActual?: string | null;
};

// Helper para convertir ISO a datetime-local
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

// Helper para convertir datetime-local a ISO
function datetimeLocalToIso(dt: string | null | undefined): string | null {
  if (!dt || !dt.trim()) return null;
  try {
    return new Date(dt).toISOString();
  } catch {
    return null;
  }
}

export default function SemaforoForm({
  puebloId,
  slug,
  estadoInicial = "VERDE",
  mensajeInicial = "",
  mensajePublicoInicial = "",
  motivoInicial = "",
  inicioProgramadoInicial = null,
  finProgramadoInicial = null,
  estadoActual,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>(estadoInicial ?? "VERDE");

  async function saveSemaforo(payload: {
    estado: string;
    mensaje?: string | null;
    mensajePublico?: string | null;
    motivo?: string | null;
    inicioProgramado?: string | null;
    finProgramado?: string | null;
  }) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/gestion/pueblos/${puebloId}/semaforo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
        redirect: "follow",
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
        setError(msg);
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/semaforo?ts=${Date.now()}`);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const estado = String(formData.get("estado") ?? "VERDE").trim().toUpperCase();
    const mensajeRaw = formData.get("mensaje");
    const mensaje = mensajeRaw ? String(mensajeRaw).trim() || null : null;
    const mensajePublicoRaw = formData.get("mensajePublico");
    const mensajePublico = mensajePublicoRaw ? String(mensajePublicoRaw).trim() || null : null;
    const motivoRaw = formData.get("motivo");
    const motivo = motivoRaw ? String(motivoRaw).trim() || null : null;
    const inicioProgramadoRaw = formData.get("inicioProgramado");
    const inicioProgramado = inicioProgramadoRaw ? datetimeLocalToIso(String(inicioProgramadoRaw)) : null;
    const finProgramadoRaw = formData.get("finProgramado");
    const finProgramado = finProgramadoRaw ? datetimeLocalToIso(String(finProgramadoRaw)) : null;

    // Validaciones
    if (estado !== "VERDE" && !mensajePublico?.trim()) {
      setError("El mensaje público es obligatorio cuando el estado no es VERDE");
      setLoading(false);
      return;
    }

    if ((inicioProgramado || finProgramado) && (!inicioProgramado || !finProgramado)) {
      setError("Si hay programación, deben especificarse tanto inicio como fin");
      setLoading(false);
      return;
    }

    if (inicioProgramado && finProgramado) {
      const inicio = new Date(inicioProgramado);
      const fin = new Date(finProgramado);
      if (fin <= inicio) {
        setError("La fecha de fin debe ser posterior a la fecha de inicio");
        setLoading(false);
        return;
      }
      if (!motivo) {
        setError("El motivo es obligatorio cuando hay programación");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/gestion/pueblos/${puebloId}/semaforo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          mensaje,
          mensajePublico,
          motivo,
          inicioProgramado,
          finProgramado,
        }),
        credentials: "include",
        redirect: "follow",
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
        setError(msg);
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/semaforo?ts=${Date.now()}`);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: 4 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div style={{ marginTop: 12 }}>
          <label>
            Estado
            <select
              name="estado"
              defaultValue={estadoInicial ?? "VERDE"}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
              style={{ marginLeft: 12 }}
              disabled={loading}
            >
              <option value="VERDE">VERDE</option>
              <option value="AMARILLO">AMARILLO</option>
              <option value="ROJO">ROJO</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            Mensaje público {estadoSeleccionado !== "VERDE" && <span style={{ color: "red" }}>*</span>}
            <textarea
              name="mensajePublico"
              defaultValue={mensajePublicoInicial ?? ""}
              style={{ marginLeft: 12, width: 520, minHeight: 60 }}
              placeholder={estadoSeleccionado === "VERDE" ? "Opcional" : "Obligatorio si estado no es VERDE"}
              disabled={loading}
              required={estadoSeleccionado !== "VERDE"}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            Mensaje interno
            <input
              name="mensaje"
              defaultValue={mensajeInicial ?? ""}
              style={{ marginLeft: 12, width: 520 }}
              placeholder="Opcional"
              disabled={loading}
            />
          </label>
        </div>

        <div style={{ marginTop: 24, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Programación (opcional)</h3>
          <div style={{ marginTop: 12 }}>
            <label>
              Inicio programado
              <input
                type="datetime-local"
                name="inicioProgramado"
                defaultValue={isoToDatetimeLocal(inicioProgramadoInicial)}
                style={{ marginLeft: 12 }}
                disabled={loading}
              />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>
              Fin programado
              <input
                type="datetime-local"
                name="finProgramado"
                defaultValue={isoToDatetimeLocal(finProgramadoInicial)}
                style={{ marginLeft: 12 }}
                disabled={loading}
              />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>
              Motivo <span style={{ color: "red" }}>*</span> (si hay programación)
              <textarea
                name="motivo"
                defaultValue={motivoInicial ?? ""}
                style={{ marginLeft: 12, width: 520, minHeight: 60 }}
                placeholder="Obligatorio si hay programación"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 16, padding: "8px 12px" }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => saveSemaforo({ estado: "VERDE", mensajePublico: null, mensaje: null })}
          disabled={loading}
          style={{ padding: "8px 12px" }}
        >
          Reset a VERDE
        </button>
        <button
          type="button"
          onClick={() => saveSemaforo({ 
            estado: estadoActual ?? estadoInicial ?? "VERDE", 
            mensajePublico: null,
            mensaje: null 
          })}
          disabled={loading}
          style={{ padding: "8px 12px" }}
        >
          Borrar mensaje
        </button>
      </div>
    </>
  );
}

