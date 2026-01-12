"use client";

import { useEffect, useMemo, useState } from "react";

type FotoRow = {
  id: string | number;
  url: string;
  alt?: string | null;
  orden?: number | null;
  origen?: "LEGACY" | "NUEVA" | string;
  activo?: boolean;
  editable?: boolean;
};

export default function FotosPuebloClient({ slug }: { slug: string }) {
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<FotoRow[]>([]);

  const [editId, setEditId] = useState<string | number | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editOrden, setEditOrden] = useState<number | "">("");

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
    return Number(data.id);
  }

  async function fetchFotos(pid: number) {
    const r = await fetch(`/api/admin/pueblos/${pid}/fotos`, { cache: "no-store" });
    if (r.status === 401) {
      window.location.href = "/entrar";
      return [];
    }
    if (r.status === 403) throw new Error("No autorizado (403)");
    if (!r.ok) throw new Error(`Error cargando fotos (${r.status})`);
    return (await r.json()) as FotoRow[];
  }

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const pid = puebloId ?? (await fetchPuebloId());
      if (!pid) return;
      if (!puebloId) setPuebloId(pid);
      const fotos = await fetchFotos(pid);
      setRows(fotos);
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

  function startEdit(row: FotoRow) {
    setEditId(row.id);
    setEditAlt(row.alt ?? "");
    setEditOrden((row.orden ?? "") as any);
  }

  function cancelEdit() {
    setEditId(null);
    setEditAlt("");
    setEditOrden("");
  }

  async function saveEdit() {
    if (editId == null) return;
    setErr(null);

    const payload: any = {};
    if (typeof editOrden === "number") payload.orden = editOrden;
    if (editAlt.trim()) payload.alt = editAlt.trim();
    if (!editAlt.trim()) payload.alt = ""; // permitir limpiar

    const r = await fetch(`/api/admin/fotos/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (r.status === 401) return void (window.location.href = "/entrar");
    if (r.status === 403) return setErr("No autorizado (403)");
    if (!r.ok) return setErr(`Error guardando (${r.status})`);

    cancelEdit();
    await refresh();
  }

  async function deleteFoto(id: string | number) {
    if (!confirm("¿Eliminar esta foto?")) return;
    setErr(null);
    const r = await fetch(`/api/admin/fotos/${id}`, { method: "DELETE" });
    if (r.status === 401) return void (window.location.href = "/entrar");
    if (r.status === 403) return setErr("No autorizado (403)");
    if (!r.ok) return setErr(`Error eliminando (${r.status})`);
    await refresh();
  }

  async function swapOrden(a: FotoRow, b: FotoRow) {
    if (!puebloId) {
      alert("No hay puebloId");
      return;
    }

    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/fotos/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ aId: a.id, bId: b.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(`Error ${res.status}: ${text}`);
        return;
      }

      await refresh();
    } catch (e: any) {
      alert(`Error: ${e?.message ?? String(e)}`);
    }
  }

  async function moveUp(index: number) {
    if (index <= 0) return;
    const curr = sorted[index];
    const prev = sorted[index - 1];
    await swapOrden(curr, prev);
  }

  async function moveDown(index: number) {
    if (index >= sorted.length - 1) return;
    const curr = sorted[index];
    const next = sorted[index + 1];
    await swapOrden(curr, next);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
        Fotos del pueblo: {slug}
      </h1>

      {err && (
        <div style={{ marginBottom: 12, padding: 12, background: "#ffecec" }}>
          {err}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={async () => {
            if (!puebloId) {
              alert("No hay puebloId todavía");
              return;
            }

            const urlPrompt = window.prompt("Pega la URL de la foto (https://...):", "");
            const url = (urlPrompt ?? "").trim();
            if (!url) {
              alert("URL requerida");
              return;
            }

            const altPrompt = window.prompt("ALT (opcional):", "");
            const alt = (altPrompt ?? "").trim();

            try {
              // Calcular orden máximo actual
              const maxOrden = sorted.reduce((m, f) => Math.max(m, Number(f.orden) || 0), 0);
              const desiredOrden = maxOrden + 1;

              // POST para crear la foto
              const res = await fetch(`/api/admin/pueblos/${puebloId}/fotos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ url, alt: alt || undefined }),
              });

              if (!res.ok) {
                const text = await res.text();
                alert(`Error ${res.status}: ${text}`);
                return;
              }

              // Parsear respuesta para obtener el id
              const created = await res.json().catch(() => null);
              const createdId = created?.id;

              // Si el backend devolvió el id, corregir orden
              if (createdId) {
                await fetch(`/api/admin/fotos/${createdId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ orden: desiredOrden }),
                });
              }

              await refresh();
            } catch (e: any) {
              alert(`Error de red: ${e?.message ?? String(e)}`);
            }
          }}
          style={{ padding: "10px 14px" }}
        >
          Añadir foto
        </button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((r, index) => {
            const editable = !!r.editable;
            const isEdit = editId === r.id;
            const isPrincipal = r.orden === 1;

            return (
              <div
                key={String(r.id ?? Math.random())}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 72px 1fr 160px 120px 220px",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  background: "#f6f6f6",
                  borderRadius: 6,
                }}
              >
                {/* Botones subir/bajar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    style={{ padding: "2px 6px", fontSize: 14 }}
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === sorted.length - 1}
                    style={{ padding: "2px 6px", fontSize: 14 }}
                    title="Bajar"
                  >
                    ↓
                  </button>
                </div>
                <img
                  src={r.url}
                  alt={r.alt ?? ""}
                  width={72}
                  height={48}
                  style={{ objectFit: "cover", borderRadius: 6, background: "#ddd" }}
                />

                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {r.origen ?? "—"} {editable ? "(editable)" : "(legacy)"}
                    {isPrincipal && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 6px",
                          background: "#4caf50",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 3,
                        }}
                      >
                        Principal
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{r.alt ?? "—"}</div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.8,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.url}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>Orden</div>
                  <div style={{ fontWeight: 700 }}>{r.orden ?? "—"}</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {!isEdit ? (
                    <button onClick={() => startEdit(r)} style={{ padding: "8px 10px" }}>
                      Editar
                    </button>
                  ) : (
                    <>
                      <button onClick={saveEdit} style={{ padding: "8px 10px" }}>
                        Guardar
                      </button>
                      <button onClick={cancelEdit} style={{ padding: "8px 10px" }}>
                        Cancelar
                      </button>
                    </>
                  )}

                  {editable && (
                    <button onClick={() => deleteFoto(r.id)} style={{ padding: "8px 10px" }}>
                      Borrar
                    </button>
                  )}
                </div>

                <div>
                  {isEdit ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      <input
                        value={editOrden}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") return setEditOrden("");
                          const n = Number(v);
                          if (!Number.isNaN(n)) setEditOrden(n);
                        }}
                        type="number"
                        placeholder="orden"
                        style={{ padding: 8 }}
                      />

                      <input
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        placeholder="alt"
                        style={{ padding: 8 }}
                        disabled={!editable}
                      />
                      {!editable && (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>ALT legacy no editable</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {editable ? "Puedes editar ALT / orden" : "Solo lectura"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
