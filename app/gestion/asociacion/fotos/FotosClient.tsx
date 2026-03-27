'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

type PhotoEntry = {
  url: string;
  source: string;
  label: string;
  parentTitle: string;
  parentId: string | number;
  puebloNombre?: string | null;
  createdAt?: string | null;
  fileSize?: number | null;
  fileSizeLoading?: boolean;
};

type PuebloOption = { id: number; nombre: string; slug: string };
type Scope = 'PUEBLO' | 'ASOCIACION';
type ViewMode = 'RECIENTES' | 'PUEBLO' | 'ASOCIACION';

const SOURCE_LABELS: Record<string, string> = {
  ALL: 'Todas las fuentes',
  GALERIA_PUEBLO: 'Galería del pueblo',
  POI: 'Puntos de interés',
  MULTIEXPERIENCIA: 'Multiexperiencias',
  CONTENIDO: 'Contenidos (noticias/eventos/artículos)',
  PAGINA_TEMATICA: 'Páginas temáticas',
};

const SOURCE_ICONS: Record<string, string> = {
  GALERIA_PUEBLO: '🖼️',
  POI: '📍',
  MULTIEXPERIENCIA: '🎯',
  CONTENIDO: '📰',
  PAGINA_TEMATICA: '📄',
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function FotosClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('RECIENTES');
  const [puebloId, setPuebloId] = useState<number>(0);
  const [pueblos, setPueblos] = useState<PuebloOption[]>([]);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileSizeCache = useRef<Map<string, number | null>>(new Map());

  useEffect(() => {
    fetch('/api/pueblos?limit=500')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = (Array.isArray(data) ? data : data?.items ?? [])
          .filter((p: any) => p.id !== 200)
          .map((p: any) => ({ id: Number(p.id), nombre: String(p.nombre || ''), slug: String(p.slug || '') }))
          .sort((a: PuebloOption, b: PuebloOption) => a.nombre.localeCompare(b.nombre));
        setPueblos(list);
      })
      .catch(() => {});
  }, []);

  const loadRecientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhotos([]);
    try {
      const res = await fetch('/api/admin/fotos/recientes?limit=50');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPhotos(data.map((d: any) => ({
          url: d.url,
          source: d.source,
          label: d.label,
          parentTitle: d.puebloNombre || d.label,
          parentId: '',
          puebloNombre: d.puebloNombre,
          createdAt: d.createdAt,
        })));
      }
    } catch (e: any) {
      setError(e?.message || 'Error cargando fotos recientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhotos([]);

    try {
      let url = '';
      if (viewMode === 'PUEBLO' && puebloId > 0) {
        const selectedSlug = pueblos.find((p) => p.id === puebloId)?.slug || '';
        url = `/api/admin/fotos/pueblo/${puebloId}?slug=${encodeURIComponent(selectedSlug)}`;
      } else if (viewMode === 'ASOCIACION') {
        url = '/api/admin/fotos/asociacion';
      } else {
        setLoading(false);
        return;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data);
    } catch (e: any) {
      setError(e?.message || 'Error cargando fotos');
    } finally {
      setLoading(false);
    }
  }, [viewMode, puebloId, pueblos]);

  // Auto-load recientes on mount
  useEffect(() => {
    loadRecientes();
  }, [loadRecientes]);

  useEffect(() => {
    if (viewMode === 'ASOCIACION' || (viewMode === 'PUEBLO' && puebloId > 0)) {
      loadPhotos();
    }
  }, [viewMode, puebloId, loadPhotos]);

  // Lazy-load file sizes for visible photos
  useEffect(() => {
    if (photos.length === 0) return;

    const urlsToFetch = photos
      .filter((p) => p.fileSize === undefined && !p.fileSizeLoading && !fileSizeCache.current.has(p.url))
      .map((p) => p.url);

    if (urlsToFetch.length === 0) {
      const needsUpdate = photos.some((p) => p.fileSize === undefined && fileSizeCache.current.has(p.url));
      if (needsUpdate) {
        setPhotos((prev) =>
          prev.map((p) => {
            if (p.fileSize === undefined && fileSizeCache.current.has(p.url)) {
              return { ...p, fileSize: fileSizeCache.current.get(p.url) ?? null };
            }
            return p;
          }),
        );
      }
      return;
    }

    setPhotos((prev) =>
      prev.map((p) => (urlsToFetch.includes(p.url) ? { ...p, fileSizeLoading: true } : p)),
    );

    const BATCH = 6;
    let idx = 0;

    async function fetchBatch() {
      const batch = urlsToFetch.slice(idx, idx + BATCH);
      if (batch.length === 0) return;
      idx += BATCH;

      const results = await Promise.all(
        batch.map(async (u) => {
          try {
            const res = await fetch(`/api/admin/fotos/filesize?url=${encodeURIComponent(u)}`);
            if (!res.ok) return { url: u, bytes: null };
            const data = await res.json();
            return { url: u, bytes: data.bytes ?? null };
          } catch {
            return { url: u, bytes: null };
          }
        }),
      );

      for (const r of results) {
        fileSizeCache.current.set(r.url, r.bytes);
      }

      setPhotos((prev) =>
        prev.map((p) => {
          const match = results.find((r) => r.url === p.url);
          if (match) return { ...p, fileSize: match.bytes, fileSizeLoading: false };
          return p;
        }),
      );

      if (idx < urlsToFetch.length) {
        setTimeout(fetchBatch, 100);
      }
    }

    fetchBatch();
  }, [photos.length, viewMode, puebloId]);

  const availableSources = useMemo(() => {
    const set = new Set(photos.map((p) => p.source));
    return ['ALL', ...Array.from(set).sort()];
  }, [photos]);

  const filtered = useMemo(() => {
    let list = photos;
    if (sourceFilter !== 'ALL') list = list.filter((p) => p.source === sourceFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.parentTitle.toLowerCase().includes(q) ||
          (p.puebloNombre && p.puebloNombre.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [photos, sourceFilter, search]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of photos) {
      counts[p.source] = (counts[p.source] || 0) + 1;
    }
    return counts;
  }, [photos]);

  const selectedPuebloNombre = pueblos.find((p) => p.id === puebloId)?.nombre || '';

  function buildFilename(photo: PhotoEntry): string {
    const base = (viewMode === 'PUEBLO' ? (selectedPuebloNombre || 'pueblo') : viewMode === 'RECIENTES' ? (photo.puebloNombre || 'reciente') : 'asociacion')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const src = photo.source.toLowerCase().replace(/_/g, '-');
    const safe = photo.parentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    return `${base}-${src}-${safe || photo.parentId || 'foto'}.jpg`;
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    }).catch(() => {});
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    setPuebloId(0);
    setPhotos([]);
    setSourceFilter('ALL');
    setSearch('');
    if (mode === 'RECIENTES') {
      loadRecientes();
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Biblioteca de fotos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las imágenes: galería del pueblo, puntos de interés, multiexperiencias, noticias, eventos, artículos y páginas temáticas.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-muted-foreground">
          Ámbito
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value as ViewMode)}
            className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
          >
            <option value="RECIENTES">Últimas fotos subidas</option>
            <option value="PUEBLO">Pueblos</option>
            <option value="ASOCIACION">Asociación</option>
          </select>
        </label>

        {viewMode === 'PUEBLO' && (
          <label className="text-xs font-medium text-muted-foreground">
            Pueblo
            <select
              value={puebloId}
              onChange={(e) => {
                setPuebloId(Number(e.target.value));
                setSourceFilter('ALL');
                setSearch('');
              }}
              className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
            >
              <option value={0}>Selecciona un pueblo…</option>
              {pueblos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-xs font-medium text-muted-foreground">
          Fuente
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
          >
            {availableSources.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s] || s} {s !== 'ALL' && sourceCounts[s] ? `(${sourceCounts[s]})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted-foreground">
          Buscar
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Título, nombre, pueblo…"
            className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
          />
        </label>
      </div>

      {/* Pills de categoría */}
      {photos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSourceFilter('ALL')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              sourceFilter === 'ALL' ? 'border-[#b5472a] bg-[#b5472a] text-white' : 'hover:bg-gray-50'
            }`}
          >
            Todas ({photos.length})
          </button>
          {Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([src, count]) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  sourceFilter === src ? 'border-[#b5472a] bg-[#b5472a] text-white' : 'hover:bg-gray-50'
                }`}
              >
                {SOURCE_ICONS[src] || '📷'} {SOURCE_LABELS[src] || src} ({count})
              </button>
            ))}
        </div>
      )}

      {/* Status */}
      <div className="mt-4 text-sm text-muted-foreground">
        {loading && (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#b5472a] border-t-transparent" />
            {viewMode === 'RECIENTES'
              ? 'Cargando últimas fotos subidas…'
              : `Cargando fotos de ${viewMode === 'PUEBLO' ? selectedPuebloNombre || 'pueblo' : 'la asociación'}…`}
          </span>
        )}
        {!loading && viewMode === 'PUEBLO' && !puebloId && 'Selecciona un pueblo para ver todas sus fotos.'}
        {!loading && viewMode === 'RECIENTES' && photos.length > 0 && (
          <span>
            Últimas {photos.length} fotos subidas a la web (de todos los pueblos y fuentes)
          </span>
        )}
        {!loading && viewMode !== 'RECIENTES' && photos.length > 0 && (
          <span>
            {filtered.length === photos.length
              ? `${photos.length} foto${photos.length === 1 ? '' : 's'} en total`
              : `Mostrando ${filtered.length} de ${photos.length}`}
            {viewMode === 'PUEBLO' && selectedPuebloNombre ? ` · ${selectedPuebloNombre}` : ''}
          </span>
        )}
        {!loading && (viewMode === 'ASOCIACION' || (viewMode === 'PUEBLO' && puebloId > 0) || viewMode === 'RECIENTES') && photos.length === 0 && !error && 'No se encontraron fotos.'}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => viewMode === 'RECIENTES' ? loadRecientes() : loadPhotos()}
            className="rounded border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de fotos */}
      {filtered.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((photo, idx) => (
            <article
              key={`${photo.url}-${idx}`}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.label}
                className="h-44 w-full bg-gray-100 object-cover"
                loading="lazy"
              />
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold">{photo.label}</p>

                {viewMode === 'RECIENTES' && photo.puebloNombre && (
                  <p className="text-xs font-medium text-[#b5472a]">{photo.puebloNombre}</p>
                )}

                <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span>{SOURCE_ICONS[photo.source] || '📷'}</span>
                    <span>{SOURCE_LABELS[photo.source] || photo.source}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {photo.fileSizeLoading ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                    ) : (
                      formatBytes(photo.fileSize)
                    )}
                  </span>
                </div>

                {viewMode === 'RECIENTES' && photo.createdAt && (
                  <p className="text-[10px] text-muted-foreground">{formatDate(photo.createdAt)}</p>
                )}

                <div className="grid grid-cols-3 gap-1.5">
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border px-2 py-1.5 text-center text-xs font-medium hover:bg-gray-50"
                  >
                    Ver
                  </a>
                  <button
                    type="button"
                    onClick={() => copyUrl(photo.url)}
                    className={`rounded border px-2 py-1.5 text-center text-xs font-medium transition ${
                      copiedUrl === photo.url ? 'border-green-500 bg-green-50 text-green-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    {copiedUrl === photo.url ? '✓' : 'URL'}
                  </button>
                  <a
                    href={`/api/admin/media/download?url=${encodeURIComponent(photo.url)}&filename=${encodeURIComponent(buildFilename(photo))}`}
                    className="rounded border border-[#b5472a]/30 bg-[#b5472a]/5 px-2 py-1.5 text-center text-xs font-semibold text-[#b5472a] hover:bg-[#b5472a]/10"
                  >
                    Descargar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}
