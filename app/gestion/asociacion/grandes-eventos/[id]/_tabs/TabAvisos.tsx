'use client';

import { useState } from 'react';
import { Info, AlertTriangle, AlertCircle, Power, Trash2, Send } from 'lucide-react';
import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';

const IMPORTANCIAS = [
  { value: 'info', label: 'Información', Icon: Info },
  { value: 'warning', label: 'Aviso importante', Icon: AlertTriangle },
  { value: 'critical', label: 'Urgente', Icon: AlertCircle },
] as const;

export default function TabAvisos({
  evento,
  reload,
}: {
  evento: EventoEditDetail;
  reload: () => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [importancia, setImportancia] = useState<'info' | 'warning' | 'critical'>('info');
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setErr(null);
    try {
      await adminFetch(`/${evento.id}/avisos`, {
        method: 'POST',
        json: { texto_es: texto.trim(), importancia },
      });
      setTexto('');
      await reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">
        Los avisos aparecen como un banner en la parte superior de la página pública del evento. Se traducen automáticamente
        a 7 idiomas y los asistentes pueden compartirlos por WhatsApp con un solo clic.
      </p>

      {/* Crear aviso */}
      <form onSubmit={create} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm sm:p-5">
        <h4 className="text-sm font-semibold text-stone-900">Publicar nuevo aviso</h4>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Ej. El autobús saldrá del Hotel El Alcornocal a las 09:00 (15 minutos antes de lo previsto)."
          className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          required
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {IMPORTANCIAS.map((imp) => {
            const Icon = imp.Icon;
            return (
              <button
                key={imp.value}
                type="button"
                onClick={() => setImportancia(imp.value)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  importancia === imp.value
                    ? imp.value === 'critical'
                      ? 'bg-red-600 text-white shadow-md'
                      : imp.value === 'warning'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-sky-600 text-white shadow-md'
                    : 'border border-stone-300 bg-white text-stone-700'
                }`}
              >
                <Icon className="h-4 w-4" /> {imp.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={posting || !texto.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-800 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {posting ? 'Publicando…' : 'Publicar aviso'}
          </button>
          {err ? <span className="text-sm text-red-600">{err}</span> : null}
        </div>
      </form>

      {/* Lista de avisos */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-stone-900">Histórico</h4>
        {evento.avisos.length === 0 ? (
          <p className="text-sm text-stone-500">Aún no hay avisos.</p>
        ) : (
          <ul className="space-y-3">
            {evento.avisos.map((a) => (
              <AvisoRow key={a.id} aviso={a} reload={reload} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AvisoRow({
  aviso,
  reload,
}: {
  aviso: EventoEditDetail['avisos'][number];
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const toggleActivo = async () => {
    setBusy(true);
    try {
      await adminFetch(`/avisos/${aviso.id}`, { method: 'PATCH', json: { activo: !aviso.activo } });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Eliminar este aviso?')) return;
    setBusy(true);
    try {
      await adminFetch(`/avisos/${aviso.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const colors =
    aviso.importancia === 'critical'
      ? 'border-red-200 bg-red-50/60'
      : aviso.importancia === 'warning'
      ? 'border-amber-200 bg-amber-50/60'
      : 'border-sky-200 bg-sky-50/60';

  return (
    <li className={`rounded-2xl border p-4 shadow-sm ${colors}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 shadow-sm">
          {aviso.importancia}
        </span>
        <span className="text-xs text-stone-500">
          {new Date(aviso.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            aviso.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
          }`}
        >
          {aviso.activo ? 'Activo' : 'Desactivado'}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-stone-800">{aviso.texto_es}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={toggleActivo} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-stone-50">
          <Power className="h-3 w-3" /> {aviso.activo ? 'Desactivar' : 'Reactivar'}
        </button>
        <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
          <Trash2 className="h-3 w-3" /> Eliminar
        </button>
      </div>
    </li>
  );
}
