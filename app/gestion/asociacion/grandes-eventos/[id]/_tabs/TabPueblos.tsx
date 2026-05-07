'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';
import { getApiUrl } from '@/lib/api';

type PuebloLite = { id: number; nombre: string; slug: string; provincia: string; foto_destacada: string | null };

export default function TabPueblos({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const [allPueblos, setAllPueblos] = useState<PuebloLite[]>([]);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${getApiUrl()}/pueblos`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PuebloLite[]) => {
        setAllPueblos(data.filter((p) => p.id !== 200)); // ocultar Pollença
      })
      .catch(() => setAllPueblos([]));
  }, []);

  const yaAsignados = new Set(evento.pueblos.map((p) => p.puebloId));
  const disponibles = allPueblos
    .filter((p) => !yaAsignados.has(p.id))
    .filter((p) => {
      const f = filter.trim().toLowerCase();
      if (!f) return true;
      return p.nombre.toLowerCase().includes(f) || p.provincia.toLowerCase().includes(f);
    })
    .slice(0, 12);

  const addPueblo = async (puebloId: number) => {
    setBusy(true);
    try {
      const orden = (evento.pueblos[evento.pueblos.length - 1]?.orden ?? 0) + 1;
      await adminFetch(`/${evento.id}/pueblos`, {
        method: 'POST',
        json: { puebloId, orden },
      });
      setFilter('');
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">
        Estos son los pueblos que aparecen en las tarjetas y en el mapa de la página pública. Se muestran en el orden indicado
        (1 = primero).
      </p>

      <div className="space-y-3">
        {evento.pueblos.map((p) => (
          <PuebloAsoc key={p.id} asoc={p} reload={reload} />
        ))}
      </div>

      {/* Buscador para añadir */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-stone-900">Añadir pueblo</h4>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por nombre o provincia…"
          className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
        {filter && disponibles.length > 0 ? (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {disponibles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => addPueblo(p.id)}
                  disabled={busy}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-2 text-left transition hover:border-amber-300 hover:bg-amber-50/60 disabled:opacity-50"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {p.foto_destacada ? (
                      <Image src={p.foto_destacada} alt="" fill style={{ objectFit: 'cover' }} sizes="64px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">{p.nombre}</p>
                    <p className="truncate text-xs text-stone-500">{p.provincia}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-700 px-2 py-1 text-[10px] font-bold uppercase text-white">
                    Añadir
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {filter && disponibles.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Ningún pueblo coincide.</p>
        ) : null}
      </section>
    </div>
  );
}

function PuebloAsoc({
  asoc,
  reload,
}: {
  asoc: EventoEditDetail['pueblos'][number];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [orden, setOrden] = useState(asoc.orden);
  const [tagline, setTagline] = useState(asoc.tagline_es ?? '');
  const [fotoUrl, setFotoUrl] = useState(asoc.fotoUrl ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminFetch(`/pueblos/${asoc.id}`, {
        method: 'PATCH',
        json: { orden, tagline_es: tagline || null, fotoUrl: fotoUrl || null },
      });
      setEditing(false);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Quitar ${asoc.pueblo.nombre} del recorrido?`)) return;
    setBusy(true);
    try {
      await adminFetch(`/pueblos/${asoc.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:flex-row sm:items-start sm:p-4">
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white">
          {asoc.orden}
        </div>
        <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-stone-100 sm:h-20 sm:w-32">
          {(asoc.fotoUrl || asoc.pueblo.foto_destacada) && (
            <Image
              src={(asoc.fotoUrl || asoc.pueblo.foto_destacada) as string}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="128px"
            />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-stone-900">{asoc.pueblo.nombre}</p>
        <p className="text-xs text-stone-500">{asoc.pueblo.provincia}</p>

        {editing ? (
          <div className="mt-3 space-y-2">
            <label className="block text-xs font-semibold text-stone-600">
              Orden
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value, 10) || 1)}
                className="mt-1 w-20 rounded border border-stone-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              Tagline (opcional)
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej. Sede de bienvenida"
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              URL de foto (opcional, si quieres usar una distinta a la oficial)
              <input
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">
                Guardar
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {asoc.tagline_es ? <p className="mt-1 text-sm text-stone-600">{asoc.tagline_es}</p> : null}
            <div className="mt-2 flex gap-2">
              <button onClick={() => setEditing(true)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50">
                Editar
              </button>
              <button onClick={remove} disabled={busy} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">
                Quitar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
