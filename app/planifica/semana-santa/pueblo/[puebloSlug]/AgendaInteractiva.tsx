'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const EventoRecorridoMap = dynamic(() => import('./EventoRecorridoMap'), { ssr: false });

type AgendaItem = {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  inicioLat?: number | null;
  inicioLng?: number | null;
  finLat?: number | null;
  finLng?: number | null;
  paradas?: Array<{ lat: number; lng: number; label?: string }> | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  youtubeUrl?: string | null;
  esFiestaInteresTuristico?: boolean;
};

function googleCalendarUrl(item: AgendaItem) {
  const start = item.fechaInicio.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('.000Z', 'Z');
  const end = (item.fechaFin || item.fechaInicio)
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('.000Z', 'Z');
  const text = encodeURIComponent(item.titulo);
  const details = encodeURIComponent(item.descripcion || '');
  const location = encodeURIComponent(item.ubicacion || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export default function AgendaInteractiva({ agenda, locale = 'es' }: { agenda: AgendaItem[]; locale?: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AgendaItem | null>(null);

  const grouped = useMemo(() => {
    return agenda.reduce<Record<string, AgendaItem[]>>((acc, item) => {
      const key = new Date(item.fechaInicio).toISOString().slice(0, 10);
      acc[key] = [...(acc[key] || []), item];
      return acc;
    }, {});
  }, [agenda]);

  if (agenda.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium">Agenda</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {open ? 'Ocultar agenda' : 'Ver agenda completa'}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="rounded-xl border p-3">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="space-y-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className="flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left hover:bg-muted"
                  >
                    <span>
                      <span className="block font-medium">{it.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(it.fechaInicio).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        {it.fechaFin
                          ? ` - ${new Date(it.fechaFin).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </span>
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Detalles</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-xl font-semibold">{selected.titulo}</h3>
              <button className="rounded-full border px-2 py-1 text-muted-foreground" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(selected.fechaInicio).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {new Date(selected.fechaInicio).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              {selected.fechaFin
                ? ` - ${new Date(selected.fechaFin).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </p>
            {selected.esFiestaInteresTuristico && (
              <span className="mt-2 inline-flex rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2.5 py-1 text-xs font-medium text-[#8f4a26]">
                Fiesta de Interés Turístico
              </span>
            )}
            {selected.ubicacion && <p className="mt-2 text-sm">📍 {selected.ubicacion}</p>}
            {selected.descripcion && <p className="mt-3 text-sm text-muted-foreground">{selected.descripcion}</p>}
            {(selected.inicioLat != null && selected.inicioLng != null) && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Recorrido</p>
                <EventoRecorridoMap
                  inicioLat={selected.inicioLat}
                  inicioLng={selected.inicioLng}
                  finLat={selected.finLat}
                  finLng={selected.finLng}
                  paradas={selected.paradas}
                />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={googleCalendarUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Añadir a Google Calendar
              </a>
              {selected.ubicacion && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.ubicacion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Ver ubicación
                </a>
              )}
              {selected.youtubeUrl && (
                <a
                  href={selected.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Ver vídeo de otros años
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
