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

function formatIcsDateTime(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric' });
  const month = pad(Number(d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', month: '2-digit' })));
  const day = pad(Number(d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', day: '2-digit' })));
  const hour = pad(Number(d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false })));
  const minute = pad(Number(d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', minute: '2-digit' })));
  const second = pad(Number(d.toLocaleString('en-CA', { timeZone: 'Europe/Madrid', second: '2-digit' })));
  return `${year}${month}${day}T${hour}${minute}${second}`;
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function downloadAppleCalendar(item: AgendaItem) {
  const start = formatIcsDateTime(item.fechaInicio);
  const end = formatIcsDateTime(item.fechaFin || item.fechaInicio);
  const summary = escapeIcsText(item.titulo);
  const description = escapeIcsText(item.descripcion || '');
  const location = escapeIcsText(item.ubicacion || '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LPMBE//Semana Santa//ES',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    description && `DESCRIPTION:${description}`,
    location && `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.titulo.replace(/[^a-z0-9]/gi, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const timeOpts = { hour: '2-digit' as const, minute: '2-digit' as const, timeZone: 'Europe/Madrid' };

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
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{it.titulo}</span>
                        {it.esFiestaInteresTuristico && (
                          <span className="inline-flex shrink-0 rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2 py-0.5 text-[10px] font-medium text-[#8f4a26]">
                            Fiesta de Interés Turístico
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {new Date(it.fechaInicio).toLocaleTimeString(locale, timeOpts)}
                        {it.fechaFin
                          ? ` - ${new Date(it.fechaFin).toLocaleTimeString(locale, timeOpts)}`
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
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold">{selected.titulo}</h3>
                  {selected.esFiestaInteresTuristico && (
                    <span className="inline-flex shrink-0 rounded-full border border-[#b2643a]/30 bg-[#b2643a]/10 px-2.5 py-1 text-xs font-medium text-[#8f4a26]">
                      Fiesta de Interés Turístico
                    </span>
                  )}
                </div>
              </div>
              <button className="shrink-0 rounded-full border px-2 py-1 text-muted-foreground" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(selected.fechaInicio).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {new Date(selected.fechaInicio).toLocaleTimeString(locale, timeOpts)}
              {selected.fechaFin
                ? ` - ${new Date(selected.fechaFin).toLocaleTimeString(locale, timeOpts)}`
                : ''}
            </p>
            {selected.fotoUrl && (
              <div className="mt-3 overflow-hidden rounded-lg border">
                <img src={selected.fotoUrl} alt={selected.titulo} className="h-48 w-full object-cover" />
              </div>
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
              <button
                type="button"
                onClick={() => downloadAppleCalendar(selected)}
                className="rounded-full border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Añadir a Apple Calendar
              </button>
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
