"use client";

import { useRef, useState } from "react";
import { updateHomeConfig, type HomeConfig, type HomeSlide, type HomeTheme } from "@/lib/homeApi";

type HomeConfigFormProps = {
  initialConfig: HomeConfig;
};

export default function HomeConfigForm({ initialConfig }: HomeConfigFormProps) {
  const [config, setConfig] = useState<HomeConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subir imagen a R2
  async function uploadImage(file: File): Promise<string> {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error subiendo imagen");
      }

      const data = await res.json();
      return data.url;
    } finally {
      setUploading(false);
    }
  }

  // Cambiar número de slides (1-5)
  const setSlidesCount = (n: number) => {
    setConfig((prev) => {
      const cur = prev.hero?.slides ?? [];
      const next = [...cur];

      while (next.length < n) next.push({ image: '', alt: '', hidden: false });
      while (next.length > n) next.pop();

      return { ...prev, hero: { ...prev.hero, slides: next } };
    });
  };

  // Guardar configuración
  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      // CRÍTICO: NO filtrar slides por hidden
      // Solo filtrar slides completamente vacíos (sin image)
      const slides = (config.hero.slides ?? [])
        .filter((s) => typeof s?.image === "string" && s.image.trim().length > 0)
        .slice(0, 5)
        .map((s, i) => ({
          image: s.image.trim(),
          alt: typeof s.alt === "string" ? s.alt : "",
          hidden: i === 0 ? false : !!s.hidden,  // ← Imagen 1 siempre visible
          title: s.title,
          subtitle: s.subtitle,
          cta: s.cta,
        }));

      const payload = {
        hero: {
          title: config.hero.title,
          subtitle: config.hero.subtitle,
          intervalMs: config.hero.intervalMs,
          slides,  // ← Incluye slides con hidden=true
        },
        themes: config.themes,
        homeRutas: config.homeRutas,
        actualidad: config.actualidad,
      };

      console.log("HOME PAYLOAD", JSON.stringify(payload, null, 2));

      // Obtener token de sesión (ya no se usa, el proxy lo obtiene de cookies)
      const resMe = await fetch("/api/auth/me");
      if (!resMe.ok) throw new Error("No autorizado");
      
      const meData = await resMe.json();
      const token = meData.token;

      await updateHomeConfig(token, payload);
      
      setMessage({ type: "success", text: "Configuración guardada correctamente" });
      
      // Recargar la página después de 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Error guardando configuración" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Mensaje de éxito/error */}
      {message && message.type === "error" && (
        <div className="rounded-lg p-4 bg-red-50 text-red-800 border border-red-200">
          {message.text}
        </div>
      )}
      {message && message.type === "success" && (
        <div className="rounded-lg p-4 bg-green-50 text-green-800 border border-green-200">
          {message.text}
        </div>
      )}

      {/* Hero */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Hero</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={config.hero.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, title: e.target.value },
                })
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <textarea
              value={config.hero.subtitle}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, subtitle: e.target.value },
                })
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Intervalo de cambio (ms)
            </label>
            <input
              type="number"
              value={config.hero.intervalMs}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, intervalMs: parseInt(e.target.value) || 6000 },
                })
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Selector de número de imágenes */}
          <div>
            <label className="block text-sm font-medium mb-1">Número de imágenes</label>
            <select
              value={config.hero.slides?.length || 0}
              onChange={(e) => setSlidesCount(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Imágenes */}
          <div className="space-y-4">
            {(config.hero.slides || []).map((slide, idx) => (
              <SlideEditor
                key={idx}
                slide={slide}
                idx={idx}
                uploading={uploading}
                uploadImage={uploadImage}
                updateSlide={(updatedSlide) => {
                  setConfig((prev) => {
                    const slides = [...(prev.hero.slides || [])];
                    slides[idx] = updatedSlide;
                    return { ...prev, hero: { ...prev.hero, slides } };
                  });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Temas</h2>

        <div className="space-y-4">
          {config.themes.map((theme, idx) => (
            <div key={theme.key} className="rounded border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium">{theme.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Título</label>
                  <input
                    type="text"
                    value={theme.title}
                    onChange={(e) => {
                      const newThemes = [...config.themes];
                      newThemes[idx] = { ...newThemes[idx], title: e.target.value };
                      setConfig({ ...config, themes: newThemes });
                    }}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Enlace (href)</label>
                  <input
                    type="text"
                    value={theme.href}
                    onChange={(e) => {
                      const newThemes = [...config.themes];
                      newThemes[idx] = { ...newThemes[idx], href: e.target.value };
                      setConfig({ ...config, themes: newThemes });
                    }}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Subir imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        const url = await uploadImage(file);
                        const newThemes = [...config.themes];
                        newThemes[idx] = { ...newThemes[idx], image: url };
                        setConfig({ ...config, themes: newThemes });
                      } catch (err) {
                        alert("Error subiendo imagen");
                      }

                      e.target.value = "";
                    }}
                    disabled={uploading}
                    className="text-xs"
                  />
                </div>

                {theme.image && (
                  <div className="col-span-2">
                    <img
                      src={theme.image}
                      alt={theme.title}
                      className="h-24 w-auto rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Configuración de rutas */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Rutas en Home</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="rutasEnabled"
              checked={config.homeRutas.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  homeRutas: { ...config.homeRutas, enabled: e.target.checked },
                })
              }
              className="h-4 w-4"
            />
            <label htmlFor="rutasEnabled" className="text-sm font-medium">
              Mostrar rutas en el home
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cantidad de rutas a mostrar
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={config.homeRutas.count}
              onChange={(e) =>
                setConfig({
                  ...config,
                  homeRutas: { ...config.homeRutas, count: parseInt(e.target.value) || 4 },
                })
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Configuración de actualidad */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Actualidad</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Límite de notificaciones a mostrar
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.actualidad.limit}
            onChange={(e) =>
              setConfig({
                ...config,
                actualidad: { limit: parseInt(e.target.value) || 6 },
              })
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </section>

      {/* Botón guardar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>

        {uploading && (
          <span className="text-sm text-gray-600">Subiendo imagen...</span>
        )}
      </div>
    </div>
  );
}

// Componente separado para editar cada slide
function SlideEditor({
  slide,
  idx,
  uploading,
  uploadImage,
  updateSlide,
}: {
  slide: HomeSlide;
  idx: number;
  uploading: boolean;
  uploadImage: (file: File) => Promise<string>;
  updateSlide: (slide: HomeSlide) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Imagen {idx + 1}</span>
        
        {/* Checkbox Ocultar - SOLO si idx > 0 */}
        {idx > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!slide.hidden}
                onChange={(e) => {
                  updateSlide({ ...slide, hidden: e.target.checked });
                }}
                className="h-4 w-4"
              />
              Ocultar
            </label>

            {slide.hidden && (
              <span className="text-xs font-medium text-red-600">OCULTA</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Preview de imagen */}
        {slide.image && (
          <img
            src={slide.image}
            alt={slide.alt || `Imagen ${idx + 1}`}
            style={{ opacity: slide.hidden ? 0.35 : 1 }}
            className="h-40 w-auto rounded border object-cover"
          />
        )}

        {/* Input file oculto */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (ev) => {
            const input = ev.currentTarget;
            const file = input.files?.[0];
            if (!file) return;

            // Reset inmediato ANTES del await para evitar crash
            input.value = "";

            try {
              const url = await uploadImage(file);
              updateSlide({ ...slide, image: url });
            } catch (err) {
              alert("Error subiendo imagen");
            }
          }}
          disabled={uploading}
        />

        {/* Botón de subida */}
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:bg-gray-400"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {slide.image ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
      </div>
    </div>
  );
}
