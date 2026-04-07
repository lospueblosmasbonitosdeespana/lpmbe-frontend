'use client';

import Link from 'next/link';
import Image from 'next/image';

const TIPO_ICONS: Record<string, string> = {
  ENCENDIDO_LUCES: '💡', MERCADILLO: '🎄', BELEN: '⭐', BELEN_VIVIENTE: '🌟',
  CONCIERTO: '🎵', TALLER_INFANTIL: '🧒', ESPECTACULO: '🎪', ZAMBOMBA: '🥁',
  NOCHEVIEJA: '🎆', CABALGATA_REYES: '👑', CABALGATA_PAPA_NOEL: '🎅',
  GASTRONOMIA: '🍽️', RUTA_TURISTICA: '🗺️', OTRO: '📌',
};

type Evento = { id: number; tipo: string; publicoObjetivo: string; titulo: string; fechaInicio: string };
type Item = {
  id: number;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: string;
  pueblo: {
    nombre: string; slug: string; provincia: string; comunidad: string;
    lat?: number | null; lng?: number | null; foto_destacada: string | null;
  };
  eventos: Evento[];
};
type Config = { titulo: string; subtitulo: string | null; anio: number; activo: boolean };

export default function NavidadLandingClient({
  config,
  pueblos,
}: {
  config: Config | null;
  pueblos: Item[];
}) {
  if (!config || pueblos.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="mb-6 text-6xl">🎄</div>
        <h1 className="text-3xl font-bold text-foreground">Navidad en Los Pueblos más Bonitos</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Pronto podrás descubrir los mercadillos navideños, belenes vivientes, cabalgatas de Reyes y mucho más
          en los pueblos más bonitos de España.
        </p>
        <div className="mt-8 text-5xl">❄️ 🎅 ⭐ 👑</div>
      </main>
    );
  }

  const eventTypes = new Set(pueblos.flatMap((p) => p.eventos.map((e) => e.tipo)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 text-center">
        <div className="mb-4 text-5xl">🎄</div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {config.titulo} {config.anio}
        </h1>
        {config.subtitulo && (
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">{config.subtitulo}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          {pueblos.length} pueblos participantes · {pueblos.reduce((s, p) => s + p.eventos.length, 0)} eventos
        </p>
        {eventTypes.size > 0 && (
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {Array.from(eventTypes).map((t) => (
              <span key={t} className="rounded-full border border-red-200 bg-red-50/50 px-3 py-1 text-xs font-medium text-red-900">
                {TIPO_ICONS[t]} {t.replace(/_/g, ' ').toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pueblos.map((item) => {
          const img = item.cartelUrl || item.pueblo.foto_destacada;
          return (
            <Link
              key={item.id}
              href={`/planifica/navidad/pueblo/${item.pueblo.slug}`}
              className="group overflow-hidden rounded-xl border border-red-100 bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {img ? (
                  <Image src={img} alt={item.pueblo.nombre} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">🎄</div>
                )}
                {item.interesTuristico !== 'NINGUNO' && (
                  <span className="absolute right-2 top-2 rounded-full bg-red-700/90 px-2 py-0.5 text-[11px] font-medium text-white">
                    {item.interesTuristico === 'INTERNACIONAL' ? '🌍 Internacional' : item.interesTuristico === 'NACIONAL' ? '🇪🇸 Nacional' : '📍 Regional'}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold group-hover:text-red-700">{item.pueblo.nombre}</h2>
                <p className="text-sm text-muted-foreground">{item.pueblo.provincia}, {item.pueblo.comunidad}</p>
                {item.eventos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from(new Set(item.eventos.map((e) => e.tipo))).slice(0, 5).map((t) => (
                      <span key={t} className="text-sm">{TIPO_ICONS[t]}</span>
                    ))}
                    <span className="text-xs text-muted-foreground">{item.eventos.length} eventos</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
