'use client';

import { useEffect, useState } from 'react';

interface PuebloLogoItem {
  id: number;
  nombre: string;
  url: string;
  createdAt: string;
}

interface PuebloGroup {
  pueblo: { id: number; nombre: string; slug: string };
  logos: PuebloLogoItem[];
}

export default function LogosAyuntamientosPage() {
  const [groups, setGroups] = useState<PuebloGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/admin/pueblo-logos?grouped=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando logos');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGroups(); }, []);

  async function handleDelete(logoId: number) {
    if (!confirm('¿Eliminar este logo?')) return;
    setDeleting(logoId);
    try {
      const res = await fetch(`/api/admin/pueblo-logos/${logoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, logos: g.logos.filter((l) => l.id !== logoId) }))
          .filter((g) => g.logos.length > 0)
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = groups.filter((g) =>
    g.pueblo.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logos de Ayuntamientos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Logos subidos por los alcaldes para usar en el constructor de contenidos.
            Puedes descargarlos o eliminarlos.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-md bg-muted px-3 py-1.5 font-medium">
            {groups.length} {groups.length === 1 ? 'pueblo' : 'pueblos'} ·{' '}
            {groups.reduce((acc, g) => acc + g.logos.length, 0)} logos
          </span>
        </div>
      </div>

      <input
        type="search"
        placeholder="Buscar pueblo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-border px-3 py-2 text-sm"
      />

      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">Cargando logos...</p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {search ? 'No hay resultados para esa búsqueda.' : 'Ningún ayuntamiento ha subido logos todavía.'}
        </div>
      )}

      <div className="space-y-6">
        {filtered.map(({ pueblo, logos }) => (
          <div key={pueblo.id} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex-1">
                <h2 className="font-semibold text-base">{pueblo.nombre}</h2>
                <p className="text-xs text-muted-foreground">
                  {logos.length} logo{logos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {logos.map((logo) => (
                <div key={logo.id} className="group relative flex flex-col items-center rounded-lg border border-border bg-background p-3 text-center">
                  <img
                    src={logo.url}
                    alt={logo.nombre}
                    className="h-16 w-full object-contain"
                  />
                  <p className="mt-2 text-xs font-medium text-foreground line-clamp-2">{logo.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(logo.createdAt).toLocaleDateString('es')}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <a
                      href={logo.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                      title="Descargar"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Descargar
                    </a>
                    <button
                      type="button"
                      disabled={deleting === logo.id}
                      onClick={() => handleDelete(logo.id)}
                      className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deleting === logo.id ? '...' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
