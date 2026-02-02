"use client";

import { useEffect, useState } from "react";
import { decode as heDecod } from "he";

function stripHtml(input: string) {
  return (input ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<\/?[^>]+>/g, "");
}

function normalizeDescripcion(input: string) {
  return (input ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/^Subtítulos realizados por la comunidad de Amara\.org\s*$/gmi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function DescripcionPuebloClient({ slug }: { slug: string }) {
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [noPermisos, setNoPermisos] = useState(false);

  const [descripcion, setDescripcion] = useState("");
  const [lead, setLead] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function loadDescripcion() {
      try {
        setLoading(true);
        setErr(null);
        setNoPermisos(false);

        // 1) Obtener pueblo por slug desde el proxy de Next (mismo origen)
        const puebloRes = await fetch(`/api/pueblos/${slug}`, { cache: "no-store" });
        if (!puebloRes.ok) {
          throw new Error(`Error cargando pueblo (${puebloRes.status})`);
        }
        const pueblo = await puebloRes.json();
        const id = pueblo?.id;
        if (!id) throw new Error("Pueblo sin id");

        setPuebloId(id);

        // 2) Cargar descripción (admin)
        const res = await fetch(`/api/admin/pueblos/${id}/descripcion`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (res.status === 403) {
          setNoPermisos(true);
          return;
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Error cargando descripción (${res.status}) ${text}`);
        }

        const data = await res.json();
        const raw = data?.descripcion ?? "";
        const text1 = stripHtml(raw);
        const text2 = heDecod(text1);
        const text3 = text2.replace(/\u00A0/g, " ");
        const clean = normalizeDescripcion(text3);
        setDescripcion(clean);
        setLead(data?.lead ?? "");
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? "Load failed");
      } finally {
        setLoading(false);
      }
    }

    loadDescripcion();
  }, [slug]);

  async function handleGuardar() {
    if (!puebloId) return;
    
    setGuardando(true);
    setMensaje(null);

    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/descripcion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, lead: lead.trim() || null }),
        credentials: "include",
      });

      if (r.status === 401) {
        window.location.href = "/entrar";
        return;
      }

      if (r.status === 403) {
        setMensaje("No tienes permisos para editar este pueblo");
        return;
      }

      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData?.error ?? errorData?.message ?? `Error ${r.status}`);
      }

      setMensaje("Cambios guardados");
    } catch (error: any) {
      setMensaje(error?.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">Error: {err}</p>
      </div>
    );
  }

  if (noPermisos) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Descripción del pueblo</h1>
        <p className="mt-4 text-red-600">No tienes permisos para editar este pueblo</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Descripción del pueblo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Esta descripción se muestra en la web pública
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">
          Enunciado (1-2 frases impactantes, opcional)
        </label>
        <input
          type="text"
          value={lead}
          onChange={(e) => setLead(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Ej: El pueblo donde la naturaleza manda"
          maxLength={250}
        />
        <p className="mt-1 text-xs text-gray-500">
          {lead.length} / 250 caracteres
        </p>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">
          Descripción completa
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={12}
          className="w-full rounded border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Descripción del pueblo..."
        />
               <p className="mt-1 text-xs text-gray-500">
                 {descripcion.length} / 5000 caracteres
               </p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>

        {mensaje && (
          <p
            className={`text-sm ${
              mensaje.includes("Error") || mensaje.includes("permisos")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
}
