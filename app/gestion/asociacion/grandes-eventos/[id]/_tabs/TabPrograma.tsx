'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';

export default function TabPrograma({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleAddDia = async () => {
    setBusy(true);
    try {
      const orden = (evento.dias[evento.dias.length - 1]?.orden ?? 0) + 1;
      await adminFetch(`/${evento.id}/dias`, {
        method: 'POST',
        json: { orden, label_es: `Día ${orden}`, titulo_es: 'Sin título' },
      });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        Cada día contiene una lista de actos (hora + texto). Lo que escribas en español se traduce automáticamente a 7 idiomas
        cuando guardas. Para cambiar el orden de un acto, ajusta su número de orden.
      </p>

      {evento.dias.map((dia) => (
        <DiaCard key={dia.id} dia={dia} reload={reload} />
      ))}

      <button
        onClick={handleAddDia}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 px-4 py-4 text-sm font-semibold text-amber-800 transition hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> Añadir día al programa
      </button>
    </div>
  );
}

function DiaCard({
  dia,
  reload,
}: {
  dia: EventoEditDetail['dias'][number];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(dia.label_es);
  const [titulo, setTitulo] = useState(dia.titulo_es);
  const [busy, setBusy] = useState(false);

  const saveDia = async () => {
    setBusy(true);
    try {
      await adminFetch(`/dias/${dia.id}`, {
        method: 'PATCH',
        json: { label_es: label, titulo_es: titulo },
      });
      setEditing(false);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const deleteDia = async () => {
    if (!confirm(`Eliminar día "${dia.label_es}"? Borrará todos sus actos.`)) return;
    setBusy(true);
    try {
      await adminFetch(`/dias/${dia.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const addActo = async () => {
    setBusy(true);
    try {
      const orden = (dia.actos[dia.actos.length - 1]?.orden ?? 0) + 1;
      await adminFetch(`/dias/${dia.id}/actos`, {
        method: 'POST',
        json: { orden, hora: '00:00', texto_es: 'Nuevo acto' },
      });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-[200px]">
          {editing ? (
            <div className="space-y-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Etiqueta del día (ej. Miércoles 20 de mayo)"
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
              />
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título descriptivo (ej. Llegada · Castellar)"
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">{dia.label_es}</p>
              <h3 className="text-base font-bold text-stone-900 sm:text-lg">{dia.titulo_es}</h3>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={saveDia} disabled={busy} className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">
                Guardar
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50">
                <Pencil className="h-3 w-3" /> Editar día
              </button>
              <button onClick={deleteDia} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50">
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      <ol className="space-y-2 border-l-2 border-amber-200 pl-4">
        {dia.actos.map((acto) => (
          <ActoRow key={acto.id} acto={acto} reload={reload} />
        ))}
      </ol>

      <button
        onClick={addActo}
        disabled={busy}
        className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-amber-400 hover:text-amber-700 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir acto
      </button>
    </div>
  );
}

function ActoRow({
  acto,
  reload,
}: {
  acto: EventoEditDetail['dias'][number]['actos'][number];
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [hora, setHora] = useState(acto.hora);
  const [texto, setTexto] = useState(acto.texto_es);
  const [orden, setOrden] = useState(acto.orden);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await adminFetch(`/actos/${acto.id}`, { method: 'PATCH', json: { hora, texto_es: texto, orden } });
      setEditing(false);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Eliminar este acto?')) return;
    setBusy(true);
    try {
      await adminFetch(`/actos/${acto.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <li className="flex flex-col items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-stone-50 sm:flex-row sm:items-baseline sm:gap-3">
        <span className="shrink-0 text-sm font-bold tabular-nums text-amber-800 sm:w-28">{acto.hora}</span>
        <p className="flex-1 text-[14px] leading-relaxed text-stone-700">{acto.texto_es}</p>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50">
            <Pencil className="h-3 w-3" /> Editar
          </button>
          <button onClick={remove} disabled={busy} className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="h-3 w-3" /> Eliminar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          placeholder="HH:MM"
          className="w-24 rounded border border-stone-300 px-2 py-1 text-sm tabular-nums"
        />
        <input
          type="number"
          value={orden}
          onChange={(e) => setOrden(parseInt(e.target.value, 10) || 0)}
          className="w-16 rounded border border-stone-300 px-2 py-1 text-sm"
          title="Orden"
        />
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={save} disabled={busy} className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">
          Guardar
        </button>
        <button onClick={() => setEditing(false)} className="rounded-md border border-stone-300 px-3 py-1.5 text-xs">
          Cancelar
        </button>
      </div>
    </li>
  );
}
