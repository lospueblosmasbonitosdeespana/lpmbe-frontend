"use client";

import { useState } from "react";
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

  // Guardar configuración
  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      // Obtener token de sesión
      const resMe = await fetch("/api/auth/me");
      if (!resMe.ok) throw new Error("No autorizado");
      
      const meData = await resMe.json();
      const token = meData.token;

      await updateHomeConfig(token, config);
      
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
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
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
                  hero: { ...config.hero, intervalMs: parseInt(e.target.value) },
                })
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Slides */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Slides</label>
              <button
                onClick={() => {
                  const newSlide: HomeSlide = {
                    image: "https://via.placeholder.com/1920x800",
                    title: "Nuevo slide",
                    subtitle: "",
                  };
                  setConfig({
                    ...config,
                    hero: {
                      ...config.hero,
                      slides: [...config.hero.slides, newSlide],
                    },
                  });
                }}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                + Añadir slide
              </button>
            </div>

            <div className="space-y-4">
              {config.hero.slides.map((slide, idx) => (
                <div key={idx} className="rounded border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium">Slide {idx + 1}</span>
                    <button
                      onClick={() => {
                        setConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            slides: config.hero.slides.filter((_, i) => i !== idx),
                          },
                        });
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Imagen URL</label>
                      <input
                        type="text"
                        value={slide.image}
                        onChange={(e) => {
                          const newSlides = [...config.hero.slides];
                          newSlides[idx] = { ...newSlides[idx], image: e.target.value };
                          setConfig({
                            ...config,
                            hero: { ...config.hero, slides: newSlides },
                          });
                        }}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>

                    <div>
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
                            const newSlides = [...config.hero.slides];
                            newSlides[idx] = { ...newSlides[idx], image: url };
                            setConfig({
                              ...config,
                              hero: { ...config.hero, slides: newSlides },
                            });
                          } catch (err) {
                            alert("Error subiendo imagen");
                          }

                          e.target.value = "";
                        }}
                        disabled={uploading}
                        className="text-xs"
                      />
                    </div>

                    {slide.image && (
                      <img
                        src={slide.image}
                        alt={`Slide ${idx + 1}`}
                        className="h-20 w-auto rounded border"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  <label className="block text-xs font-medium mb-1">Imagen URL</label>
                  <input
                    type="text"
                    value={theme.image}
                    onChange={(e) => {
                      const newThemes = [...config.themes];
                      newThemes[idx] = { ...newThemes[idx], image: e.target.value };
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
                  homeRutas: { ...config.homeRutas, count: parseInt(e.target.value) },
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
                actualidad: { limit: parseInt(e.target.value) },
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
