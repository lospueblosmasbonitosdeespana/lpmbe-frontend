'use client';

import { useEffect, useMemo, useState } from 'react';
import R2ImageUploader from '@/app/components/R2ImageUploader';

type ReleaseType = 'news' | 'event';

type HiddenRelease = {
  type: ReleaseType;
  id: number;
};

type ExternalMediaItem = {
  id: string;
  medio: string;
  titulo: string;
  url: string;
  logoUrl: string | null;
  fecha: string | null;
  resumen: string | null;
};

type KitItem = {
  id: string;
  titulo: string;
  descripcion: string | null;
  url: string | null;
  imageUrl: string | null;
};

type PressPageConfig = {
  contactEmail: string;
  hiddenReleases: HiddenRelease[];
  externalMedia: ExternalMediaItem[];
  kitItems: KitItem[];
};

type ReleaseOption = {
  id: number;
  type: ReleaseType;
  titulo: string;
  fecha: string | null;
};

const DEFAULT_CONFIG: PressPageConfig = {
  contactEmail: 'prensa@lospueblosmasbonitosdeespana.org',
  hiddenReleases: [],
  externalMedia: [],
  kitItems: [],
};

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function newExternalMediaItem(): ExternalMediaItem {
  return {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    medio: '',
    titulo: '',
    url: '',
    logoUrl: null,
    fecha: null,
    resumen: null,
  };
}

function newKitItem(): KitItem {
  return {
    id: `kit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    titulo: '',
    descripcion: null,
    url: null,
    imageUrl: null,
  };
}

export default function PrensaMediosForm() {
  const [config, setConfig] = useState<PressPageConfig>(DEFAULT_CONFIG);
  const [releaseOptions, setReleaseOptions] = useState<ReleaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [configRes, newsRes, eventsRes] = await Promise.all([
          fetch('/api/admin/press-page', { cache: 'no-store' }),
          fetch('/api/public/noticias?limit=80', { cache: 'no-store' }),
          fetch('/api/public/eventos?limit=80', { cache: 'no-store' }),
        ]);

        if (!configRes.ok) throw new Error('No se pudo cargar la configuración de prensa');

        const configData = await configRes.json();
        const loaded = (configData?.pressPage || {}) as Partial<PressPageConfig>;
        setConfig({
          contactEmail: loaded.contactEmail || DEFAULT_CONFIG.contactEmail,
          hiddenReleases: Array.isArray(loaded.hiddenReleases) ? loaded.hiddenReleases : [],
          externalMedia: Array.isArray(loaded.externalMedia) ? loaded.externalMedia : [],
          kitItems: Array.isArray(loaded.kitItems) ? loaded.kitItems : [],
        });

        const news = newsRes.ok ? await newsRes.json().catch(() => []) : [];
        const events = eventsRes.ok ? await eventsRes.json().catch(() => []) : [];

        const options: ReleaseOption[] = [
          ...(Array.isArray(news)
            ? news.map((n: any) => ({
                id: Number(n.id),
                type: 'news' as const,
                titulo: n.titulo ?? `(Noticia #${n.id})`,
                fecha: n.publishedAt ?? n.fecha ?? n.createdAt ?? null,
              }))
            : []),
          ...(Array.isArray(events)
            ? events.map((e: any) => ({
                id: Number(e.id),
                type: 'event' as const,
                titulo: e.titulo ?? `(Evento #${e.id})`,
                fecha: e.publishedAt ?? e.fechaInicio ?? e.createdAt ?? null,
              }))
            : []),
        ].sort((a, b) => {
          const ad = a.fecha ? new Date(a.fecha).getTime() : 0;
          const bd = b.fecha ? new Date(b.fecha).getTime() : 0;
          return bd - ad;
        });

        setReleaseOptions(options);
      } catch (e: any) {
        setError(e?.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hiddenSet = useMemo(
    () => new Set(config.hiddenReleases.map((x) => `${x.type}:${x.id}`)),
    [config.hiddenReleases],
  );
  const externalMediaInvalid = useMemo(
    () =>
      config.externalMedia.some(
        (item) =>
          !item.medio.trim() ||
          !item.titulo.trim() ||
          !item.url.trim() ||
          !isValidHttpUrl(item.url.trim()),
      ),
    [config.externalMedia],
  );
  const kitInvalid = useMemo(
    () =>
      config.kitItems.some(
        (item) =>
          !item.titulo.trim() ||
          (item.url?.trim() ? !isValidHttpUrl(item.url.trim()) : false),
      ),
    [config.kitItems],
  );

  const toggleHiddenRelease = (type: ReleaseType, id: number) => {
    const key = `${type}:${id}`;
    setConfig((prev) => {
      const exists = prev.hiddenReleases.some((x) => x.type === type && x.id === id);
      return {
        ...prev,
        hiddenReleases: exists
          ? prev.hiddenReleases.filter((x) => !(x.type === type && x.id === id))
          : [...prev.hiddenReleases, { type, id }],
      };
    });
    if (hiddenSet.has(key)) return;
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const normalized: PressPageConfig = {
        contactEmail: config.contactEmail.trim() || DEFAULT_CONFIG.contactEmail,
        hiddenReleases: config.hiddenReleases
          .filter((x) => Number.isFinite(Number(x.id)))
          .map((x) => ({ type: x.type, id: Number(x.id) })),
        externalMedia: config.externalMedia.map((item) => ({
          ...item,
          medio: item.medio.trim(),
          titulo: item.titulo.trim(),
          url: item.url.trim(),
          fecha: item.fecha?.trim() || null,
          resumen: item.resumen?.trim() || null,
          logoUrl: item.logoUrl || null,
        })),
        kitItems: config.kitItems.map((item) => ({
          ...item,
          titulo: item.titulo.trim(),
          descripcion: item.descripcion?.trim() || null,
          url: item.url?.trim() || null,
          imageUrl: item.imageUrl || null,
        })),
      };

      if (externalMediaInvalid) {
        throw new Error('Revisa Medios externos: medio, titular y URL válida son obligatorios.');
      }
      if (kitInvalid) {
        throw new Error('Revisa Kit de prensa: el título es obligatorio y la URL debe ser válida.');
      }

      const res = await fetch('/api/admin/press-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pressPage: normalized }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'No se pudo guardar');
      }
      setSuccess('Configuración de prensa guardada');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="mt-6 text-sm text-muted-foreground">Cargando...</p>;
  }

  return (
    <div className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Contacto de prensa</h2>
        <label className="mb-1 block text-sm">Email de contacto</label>
        <input
          className="w-full max-w-xl rounded-md border px-3 py-2 text-sm"
          value={config.contactEmail}
          onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
          placeholder="prensa@lospueblosmasbonitosdeespana.org"
        />
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="mb-2 text-lg font-semibold">Comunicados visibles en /prensa</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          En noticias/eventos se publica contenido normalmente. Aquí puedes ocultar elementos concretos para que no salgan en la pestaña de comunicados de la página de prensa.
        </p>
        <div className="mb-3">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm md:max-w-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título..."
          />
        </div>
        <div className="max-h-[420px] space-y-2 overflow-auto rounded-md border p-3">
          {releaseOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comunicados cargados.</p>
          ) : (
            releaseOptions.map((item) => {
              if (query.trim()) {
                const q = query.trim().toLowerCase();
                if (!item.titulo.toLowerCase().includes(q)) return null;
              }
              const checked = hiddenSet.has(`${item.type}:${item.id}`);
              return (
                <label
                  key={`${item.type}-${item.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggleHiddenRelease(item.type, item.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'news' ? 'Noticia' : 'Evento'} · ID {item.id}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Medios externos ({config.externalMedia.length})</h2>
            <p className="text-sm text-muted-foreground">
              Añade enlaces de medios que han hablado sobre la asociación.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                externalMedia: [...prev.externalMedia, newExternalMediaItem()],
              }))
            }
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            + Añadir medio
          </button>
        </div>

        <div className="space-y-4">
          {config.externalMedia.map((item, idx) => (
            <div key={item.id} className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Medio {idx + 1}</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => {
                        if (idx === 0) return prev;
                        const arr = [...prev.externalMedia];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        return { ...prev, externalMedia: arr };
                      })
                    }
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => {
                        if (idx === prev.externalMedia.length - 1) return prev;
                        const arr = [...prev.externalMedia];
                        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                        return { ...prev, externalMedia: arr };
                      })
                    }
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        externalMedia: prev.externalMedia.filter((x) => x.id !== item.id),
                      }))
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs">Nombre del medio</label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={item.medio}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        externalMedia: prev.externalMedia.map((x) =>
                          x.id === item.id ? { ...x, medio: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Fecha (opcional)</label>
                  <input
                    type="date"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={item.fecha || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        externalMedia: prev.externalMedia.map((x) =>
                          x.id === item.id ? { ...x, fecha: e.target.value || null } : x,
                        ),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs">Titular</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={item.titulo}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      externalMedia: prev.externalMedia.map((x) =>
                        x.id === item.id ? { ...x, titulo: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs">URL del artículo</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={item.url}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      externalMedia: prev.externalMedia.map((x) =>
                        x.id === item.id ? { ...x, url: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs">Resumen (opcional)</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={item.resumen || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      externalMedia: prev.externalMedia.map((x) =>
                        x.id === item.id ? { ...x, resumen: e.target.value || null } : x,
                      ),
                    }))
                  }
                />
              </div>

              <div className="mt-3">
                <R2ImageUploader
                  label="Logo del medio (opcional)"
                  value={item.logoUrl}
                  onChange={(url) =>
                    setConfig((prev) => ({
                      ...prev,
                      externalMedia: prev.externalMedia.map((x) =>
                        x.id === item.id ? { ...x, logoUrl: url } : x,
                      ),
                    }))
                  }
                  folder="prensa-medios"
                  previewHeight="h-24"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Kit de prensa ({config.kitItems.length})</h2>
            <p className="text-sm text-muted-foreground">
              Define bloques de recursos que quieras mostrar en la pestaña “Kit de prensa”.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                kitItems: [...prev.kitItems, newKitItem()],
              }))
            }
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            + Añadir recurso
          </button>
        </div>

        <div className="space-y-4">
          {config.kitItems.map((item, idx) => (
            <div key={item.id} className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Recurso {idx + 1}</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => {
                        if (idx === 0) return prev;
                        const arr = [...prev.kitItems];
                        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        return { ...prev, kitItems: arr };
                      })
                    }
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => {
                        if (idx === prev.kitItems.length - 1) return prev;
                        const arr = [...prev.kitItems];
                        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                        return { ...prev, kitItems: arr };
                      })
                    }
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        kitItems: prev.kitItems.filter((x) => x.id !== item.id),
                      }))
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs">Título</label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={item.titulo}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        kitItems: prev.kitItems.map((x) =>
                          x.id === item.id ? { ...x, titulo: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Descripción (opcional)</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={item.descripcion || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        kitItems: prev.kitItems.map((x) =>
                          x.id === item.id ? { ...x, descripcion: e.target.value || null } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">URL destino (opcional)</label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={item.url || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        kitItems: prev.kitItems.map((x) =>
                          x.id === item.id ? { ...x, url: e.target.value || null } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <R2ImageUploader
                  label="Imagen / recurso visual (opcional)"
                  value={item.imageUrl}
                  onChange={(url) =>
                    setConfig((prev) => ({
                      ...prev,
                      kitItems: prev.kitItems.map((x) =>
                        x.id === item.id ? { ...x, imageUrl: url } : x,
                      ),
                    }))
                  }
                  folder="prensa-kit"
                  previewHeight="h-24"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving || externalMediaInvalid || kitInvalid}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar Prensa y Medios'}
      </button>
      {(externalMediaInvalid || kitInvalid) && (
        <p className="text-sm text-amber-700">
          Revisa los campos obligatorios antes de guardar.
        </p>
      )}
    </div>
  );
}
