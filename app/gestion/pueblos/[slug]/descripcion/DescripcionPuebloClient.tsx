"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { decode as heDecod } from "he";
import dynamic from "next/dynamic";

const MapLocationPicker = dynamic(
  () => import("@/app/components/MapLocationPicker").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  }
);

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
    .replace(/^Subtítulos realizados por la comunidad de Amara\.org\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatSlugLabel(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const field =
  "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const btnAmber =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-45";

const sectionCard = "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm";

const sectionHead = "border-b border-border/60 bg-muted/30 px-5 py-3.5 sm:px-6";
const sectionBody = "p-5 sm:p-6";

export default function DescripcionPuebloClient({ slug }: { slug: string }) {
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [puebloNombre, setPuebloNombre] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [noPermisos, setNoPermisos] = useState(false);

  const [descripcion, setDescripcion] = useState("");
  const [lead, setLead] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [altitud, setAltitud] = useState<string>("");
  const [poblacion, setPoblacion] = useState<string>("");
  const [puntosVisita, setPuntosVisita] = useState<string>("");
  const [anioIncorporacion, setAnioIncorporacion] = useState<string>("");
  const [anioExpulsion, setAnioExpulsion] = useState<string>("");
  const [anioReincorporacion, setAnioReincorporacion] = useState<string>("");
  const [userRol, setUserRol] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [guardandoCoords, setGuardandoCoords] = useState(false);
  const [guardandoFicha, setGuardandoFicha] = useState(false);
  const [guardandoAnio, setGuardandoAnio] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const baseGestion = `/gestion/pueblos/${slug}`;
  const labelPueblo = puebloNombre.trim() || formatSlugLabel(slug);

  useEffect(() => {
    async function loadDescripcion() {
      try {
        setLoading(true);
        setErr(null);
        setNoPermisos(false);

        const puebloRes = await fetch(`/api/pueblos/${slug}`, { cache: "no-store" });
        if (!puebloRes.ok) {
          throw new Error(`Error cargando pueblo (${puebloRes.status})`);
        }
        const pueblo = await puebloRes.json();
        const id = pueblo?.id;
        if (!id) throw new Error("Pueblo sin id");

        setPuebloId(id);
        setPuebloNombre(typeof pueblo?.nombre === "string" ? pueblo.nombre : "");
        const pl = pueblo?.lat;
        const pn = pueblo?.lng;
        setLat(typeof pl === "number" && Number.isFinite(pl) ? pl : null);
        setLng(typeof pn === "number" && Number.isFinite(pn) ? pn : null);
        if (pueblo?.anioIncorporacion) setAnioIncorporacion(String(pueblo.anioIncorporacion));
        if (pueblo?.anioExpulsion) setAnioExpulsion(String(pueblo.anioExpulsion));
        if (pueblo?.anioReincorporacion) setAnioReincorporacion(String(pueblo.anioReincorporacion));

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

        try {
          const fichaRes = await fetch(`/api/admin/pueblos/${id}/ficha`, {
            credentials: "include", cache: "no-store",
          });
          if (fichaRes.ok) {
            const ficha = await fichaRes.json();
            if (ficha.altitud != null) setAltitud(String(ficha.altitud));
            if (ficha.poblacion != null) setPoblacion(String(ficha.poblacion));
            if (ficha.puntosVisita != null) setPuntosVisita(String(ficha.puntosVisita));
          }
        } catch { /* ignore */ }

        try {
          const meRes = await fetch("/api/auth/me", { credentials: "include" });
          if (meRes.ok) {
            const me = await meRes.json();
            setUserRol(me?.rol ?? "");
          }
        } catch {
          /* ignore */
        }
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? "Load failed");
      } finally {
        setLoading(false);
      }
    }

    loadDescripcion();
  }, [slug]);

  const handleCoordenadasChange = useCallback(
    async (newLat: number, newLng: number) => {
      if (newLat === 0 && newLng === 0) return;
      setLat(newLat);
      setLng(newLng);
      if (!puebloId) return;
      setGuardandoCoords(true);
      setMensaje(null);
      try {
        const r = await fetch(`/api/admin/pueblos/${puebloId}/coordenadas`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: newLat, lng: newLng }),
          credentials: "include",
        });
        if (r.status === 401) {
          window.location.href = "/entrar";
          return;
        }
        if (r.status === 403) {
          setMensaje("No tienes permisos para editar coordenadas");
          return;
        }
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d?.error ?? d?.message ?? `Error ${r.status}`);
        }
        setMensaje("Coordenadas guardadas");
        setTimeout(() => setMensaje(null), 3000);
      } catch (e: any) {
        setMensaje(e?.message ?? "Error al guardar coordenadas");
      } finally {
        setGuardandoCoords(false);
      }
    },
    [puebloId]
  );

  async function handleGuardarFicha() {
    if (!puebloId) return;
    setGuardandoFicha(true);
    setMensaje(null);
    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/ficha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altitud: altitud ? parseInt(altitud, 10) : null,
          poblacion: poblacion ? parseInt(poblacion, 10) : null,
          puntosVisita: puntosVisita ? parseInt(puntosVisita, 10) : null,
        }),
        credentials: "include",
      });
      if (r.status === 401) { window.location.href = "/entrar"; return; }
      if (r.status === 403) { setMensaje("No tienes permisos"); return; }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? d?.message ?? `Error ${r.status}`);
      }
      setMensaje("Datos del pueblo guardados");
      setTimeout(() => setMensaje(null), 3000);
    } catch (e: any) {
      setMensaje(e?.message ?? "Error al guardar datos del pueblo");
    } finally {
      setGuardandoFicha(false);
    }
  }

  async function handleGuardarAnio() {
    if (!puebloId) return;
    setGuardandoAnio(true);
    setMensaje(null);
    try {
      const r = await fetch(`/api/admin/pueblos/${puebloId}/incorporacion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anioIncorporacion: anioIncorporacion ? parseInt(anioIncorporacion, 10) : null,
          anioExpulsion: anioExpulsion ? parseInt(anioExpulsion, 10) : null,
          anioReincorporacion: anioReincorporacion ? parseInt(anioReincorporacion, 10) : null,
        }),
        credentials: "include",
      });
      if (r.status === 401) {
        window.location.href = "/entrar";
        return;
      }
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.message ?? `Error ${r.status}`);
      }
      setMensaje("Año de incorporación guardado");
      setTimeout(() => setMensaje(null), 3000);
    } catch (e: any) {
      setMensaje(e?.message ?? "Error al guardar año");
    } finally {
      setGuardandoAnio(false);
    }
  }

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

  const backLink = (
    <Link
      href={baseGestion}
      className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Volver a gestión del pueblo
    </Link>
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {backLink}
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-muted/20 py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">Cargando ficha del pueblo…</p>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {backLink}
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-6 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          <p className="font-semibold">No se pudo cargar la página</p>
          <p className="mt-2 text-red-800/90 dark:text-red-200/90">{err}</p>
          <Link href={baseGestion} className="mt-4 inline-block text-sm font-medium text-red-900 underline-offset-4 hover:underline dark:text-red-100">
            Volver a gestión del pueblo
          </Link>
        </div>
      </main>
    );
  }

  if (noPermisos) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {backLink}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 dark:border-amber-900/40 dark:bg-amber-950/25">
          <h1 className="text-lg font-bold text-foreground">Información y descripción</h1>
          <p className="mt-2 text-sm font-medium text-amber-950/90 dark:text-amber-100/90">No tienes permisos para editar este pueblo.</p>
        </div>
      </main>
    );
  }

  const coordCenter: [number, number] =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat, lng]
      : [40.4168, -3.7038];
  const selectedPosition =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  const mensajeEsError =
    mensaje != null && (mensaje.includes("Error") || mensaje.includes("permisos") || mensaje.includes("No tienes"));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {backLink}

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: "linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)" }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Información y descripción</h1>
              <p className="mt-0.5 text-sm text-white/85">
                Coordenadas, enunciado y texto para la ficha pública ·{" "}
                <span className="font-semibold text-white/95">{labelPueblo}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold">{descripcion.length}</span>
            <span className="ml-1.5 text-xs text-white/75">caracteres (descripción)</span>
          </div>
          {lead.trim() ? (
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/80">Enunciado definido</span>
            </div>
          ) : null}
        </div>
      </div>

      {mensaje && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
            mensajeEsError
              ? "border-red-200 bg-red-50/90 text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100"
              : "border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
          }`}
        >
          {mensaje}
        </div>
      )}

      <div className={sectionCard}>
        <div className={`${sectionHead} bg-sky-50/50 dark:bg-sky-950/20`}>
          <h2 className="text-sm font-bold text-foreground">Ubicación del pueblo</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Busca un lugar o haz clic en el mapa. Las coordenadas se guardan al fijar el punto.
          </p>
        </div>
        <div className={sectionBody}>
          <MapLocationPicker
            center={coordCenter}
            zoom={selectedPosition ? 14 : 6}
            selectedPosition={selectedPosition}
            onLocationSelect={(la, ln) => handleCoordenadasChange(la, ln)}
            height="240px"
            searchPlaceholder="Buscar lugar (ej: Plaza Mayor, Aínsa)…"
            showSearch={true}
            activeHint="Busca o haz clic en el mapa para situar el pueblo"
          />
          {guardandoCoords && (
            <p className="mt-3 text-xs font-medium text-sky-700 dark:text-sky-300">Guardando coordenadas…</p>
          )}
        </div>
      </div>

      <div className={`${sectionCard} mt-6`}>
        <div className={`${sectionHead} bg-emerald-50/50 dark:bg-emerald-950/20`}>
          <h2 className="text-sm font-bold text-foreground">Datos del pueblo</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Altitud, habitantes y puntos de visita. Estos datos se usan en las colecciones y la ficha pública.
          </p>
        </div>
        <div className={`${sectionBody} space-y-4`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Altitud (metros)</label>
              <input
                type="number"
                min={0}
                max={9999}
                value={altitud}
                onChange={(e) => setAltitud(e.target.value)}
                className={field}
                placeholder="Ej: 589"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Habitantes (censo)</label>
              <input
                type="number"
                min={0}
                max={999999}
                value={poblacion}
                onChange={(e) => setPoblacion(e.target.value)}
                className={field}
                placeholder="Ej: 2.100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground">Puntos de visita</label>
              <input
                type="number"
                min={0}
                max={999}
                value={puntosVisita}
                onChange={(e) => setPuntosVisita(e.target.value)}
                className={field}
                placeholder="Ej: 12"
              />
            </div>
          </div>
          <button type="button" onClick={handleGuardarFicha} disabled={guardandoFicha} className={btnAmber}>
            {guardandoFicha ? "Guardando…" : "Guardar datos del pueblo"}
          </button>
        </div>
      </div>

      {userRol === "ADMIN" && (
        <div className={`${sectionCard} mt-6`}>
          <div className={`${sectionHead} bg-amber-50/60 dark:bg-amber-950/20`}>
            <h2 className="text-sm font-bold text-foreground">Incorporación a la red</h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Solo administración: año de entrada a LPMBE, expulsión o reincorporación.
            </p>
          </div>
          <div className={`${sectionBody} space-y-4`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Año de incorporación</label>
                <input
                  type="number"
                  min={2011}
                  max={2099}
                  value={anioIncorporacion}
                  onChange={(e) => setAnioIncorporacion(e.target.value)}
                  className={field}
                  placeholder="Ej: 2013"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Año de expulsión / salida</label>
                <input
                  type="number"
                  min={2011}
                  max={2099}
                  value={anioExpulsion}
                  onChange={(e) => setAnioExpulsion(e.target.value)}
                  className={field}
                  placeholder="Vacío si sigue activo"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground">Año de reincorporación</label>
                <input
                  type="number"
                  min={2011}
                  max={2099}
                  value={anioReincorporacion}
                  onChange={(e) => setAnioReincorporacion(e.target.value)}
                  className={field}
                  placeholder="Solo si volvió"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleGuardarAnio} disabled={guardandoAnio} className={btnAmber}>
                {guardandoAnio ? "Guardando…" : "Guardar años"}
              </button>
              {anioExpulsion ? (
                <button
                  type="button"
                  onClick={() => {
                    setAnioExpulsion("");
                    setAnioReincorporacion("");
                  }}
                  className="text-xs font-semibold text-red-600 underline-offset-4 hover:underline dark:text-red-400"
                >
                  Quitar expulsión
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className={`${sectionCard} mt-6`}>
        <div className={`${sectionHead} bg-violet-50/40 dark:bg-violet-950/15`}>
          <h2 className="text-sm font-bold text-foreground">Enunciado</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Una o dos frases de impacto (opcional). Aparece destacado en la ficha.</p>
        </div>
        <div className={sectionBody}>
          <input
            type="text"
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            className={field}
            placeholder="Ej: El pueblo donde la naturaleza manda"
            maxLength={250}
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {lead.length} / 250 caracteres
          </p>
        </div>
      </div>

      <div className={`${sectionCard} mt-6`}>
        <div className={`${sectionHead} bg-muted/40`}>
          <h2 className="text-sm font-bold text-foreground">Descripción completa</h2>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Texto principal de la página del pueblo (hasta 5000 caracteres).</p>
        </div>
        <div className={sectionBody}>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={14}
            className={`${field} min-h-[280px] resize-y`}
            placeholder="Descripción del pueblo…"
          />
          <p className="mt-2 text-xs font-medium text-muted-foreground">{descripcion.length} / 5000 caracteres</p>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/60 pt-6">
            <button type="button" onClick={handleGuardar} disabled={guardando} className={btnPrimary}>
              {guardando ? "Guardando…" : "Guardar descripción y enunciado"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border/60 pt-6">
        <Link
          href={baseGestion}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}
