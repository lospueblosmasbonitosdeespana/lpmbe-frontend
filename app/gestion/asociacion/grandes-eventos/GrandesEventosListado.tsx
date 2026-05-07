'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EventoListItem = {
  id: number;
  slug: string;
  nombre: string;
  publicado: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
  logoUrl: string | null;
  updatedAt: string;
  _count: { dias: number; pueblos: number; avisos: number; fotos: number };
};

export default function GrandesEventosListado() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/grandes-eventos', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando eventos');
      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/grandes-eventos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), slug: slug.trim() || slugify(nombre) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error creando evento');
      }
      const created = (await res.json()) as { id: number };
      router.push(`/gestion/asociacion/grandes-eventos/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Crear nuevo */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Crear nuevo evento</h2>
        <p className="mt-1 text-sm text-stone-600">
          Indica un nombre interno (ej. <em>Asamblea General 2026 Alcudia</em>) y, opcionalmente, un slug para la URL pública{' '}
          <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">/encuentros/[slug]</code>. Si lo dejas vacío, se generará automáticamente.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre del evento"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            required
          />
          <input
            type="text"
            placeholder="slug-de-la-url (opcional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || !nombre.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creando…' : 'Crear evento'}
            </button>
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>
      </section>

      {/* Listado */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Eventos existentes</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Cargando…</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay eventos. Crea el primero arriba.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/gestion/asociacion/grandes-eventos/${ev.id}`}
                  className="block h-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-stone-900">{ev.nombre}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ev.publicado ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {ev.publicado ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-stone-500">/encuentros/{ev.slug}</p>
                  {(ev.fechaInicio || ev.fechaFin) && (
                    <p className="mt-2 text-xs text-stone-600">
                      {fmtDate(ev.fechaInicio)} – {fmtDate(ev.fechaFin)}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider text-stone-500">
                    <Stat label="días" value={ev._count.dias} />
                    <Stat label="pueblos" value={ev._count.pueblos} />
                    <Stat label="avisos" value={ev._count.avisos} />
                    <Stat label="fotos" value={ev._count.fotos} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-stone-50 px-2 py-2">
      <div className="text-base font-bold text-stone-900">{value}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
