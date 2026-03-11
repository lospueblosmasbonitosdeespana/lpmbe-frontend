'use client';

import { useEffect, useState } from 'react';
import R2ImageUploader from '@/app/components/R2ImageUploader';

type AppWebPageConfig = {
  title: string;
  subtitle: string;
  intro: string;
  feature1Title: string;
  feature1Text: string;
  feature2Title: string;
  feature2Text: string;
  feature3Title: string;
  feature3Text: string;
  feature4Title: string;
  feature4Text: string;
  screenshot1Url: string | null;
  screenshot2Url: string | null;
  screenshot3Url: string | null;
  screenshot4Url: string | null;
  screenshot5Url: string | null;
  screenshot6Url: string | null;
  appStoreUrl: string;
  playStoreUrl: string;
};

const DEFAULT_CONFIG: AppWebPageConfig = {
  title: 'La app oficial de Los Pueblos Más Bonitos de España',
  subtitle: 'Rutas, mapas y alertas para planificar tu escapada',
  intro:
    'Descubre pueblos, organiza fines de semana y consulta información útil en tiempo real desde tu móvil.',
  feature1Title: 'Planifica tu fin de semana',
  feature1Text: 'Ideas de viaje, rutas y propuestas para escapadas por toda España.',
  feature2Title: 'Mapa interactivo',
  feature2Text: 'Explora pueblos y recursos turísticos en un mapa visual y fácil de usar.',
  feature3Title: 'Actualidad y alertas',
  feature3Text: 'Consulta noticias, avisos y semáforo turístico antes de viajar.',
  feature4Title: 'Semana Santa y eventos',
  feature4Text: 'Sigue procesiones, horarios y recomendaciones para disfrutar cada visita.',
  screenshot1Url: null,
  screenshot2Url: null,
  screenshot3Url: null,
  screenshot4Url: null,
  screenshot5Url: null,
  screenshot6Url: null,
  appStoreUrl:
    'https://apps.apple.com/es/app/los-pueblos-m%C3%A1s-bonitos-de-esp/id6755147967',
  playStoreUrl:
    'https://play.google.com/store/apps/details?id=app.rork.pueblos_bonitos_app',
};

export default function PaginaWebAppForm() {
  const [config, setConfig] = useState<AppWebPageConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/app-web-page', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudo cargar la configuración');
        const data = await res.json();
        setConfig({ ...DEFAULT_CONFIG, ...(data?.appWebPage || {}) });
      } catch (e: any) {
        setError(e?.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/app-web-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appWebPage: config }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'No se pudo guardar');
      }
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Cabecera</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Título</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Subtítulo</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.subtitle}
              onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Introducción</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.intro}
              onChange={(e) => setConfig({ ...config, intro: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Funcionalidades (4 bloques)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-md border p-3">
              <label className="mb-1 block text-sm">Título {i}</label>
              <input
                className="mb-2 w-full rounded-md border px-3 py-2 text-sm"
                value={config[`feature${i}Title` as keyof AppWebPageConfig] as string}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [`feature${i}Title`]: e.target.value,
                  } as AppWebPageConfig)
                }
              />
              <label className="mb-1 block text-sm">Texto {i}</label>
              <textarea
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={config[`feature${i}Text` as keyof AppWebPageConfig] as string}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [`feature${i}Text`]: e.target.value,
                  } as AppWebPageConfig)
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Capturas / fotos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sube capturas en formato vertical de móvil. Puedes configurar hasta 6 imágenes.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => {
            const key = `screenshot${index}Url` as keyof AppWebPageConfig;
            return (
              <R2ImageUploader
                key={index}
                label={`Captura ${index}`}
                value={config[key] as string | null}
                onChange={(url) => setConfig({ ...config, [key]: url })}
                folder="app-web-page"
                previewHeight="h-72"
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Enlaces de descarga</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">URL App Store</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.appStoreUrl}
              onChange={(e) => setConfig({ ...config, appStoreUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">URL Google Play</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.playStoreUrl}
              onChange={(e) => setConfig({ ...config, playStoreUrl: e.target.value })}
            />
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar página app'}
      </button>
    </div>
  );
}
