'use client';

import Image from 'next/image';
import Link from 'next/link';

const TIPO_LABELS: Record<string, string> = {
  ENCENDIDO_LUCES: 'Encendido de luces',
  MERCADILLO: 'Mercadillo navideño',
  BELEN: 'Belén',
  BELEN_VIVIENTE: 'Belén viviente',
  CONCIERTO: 'Concierto / Villancicos',
  TALLER_INFANTIL: 'Taller infantil',
  ESPECTACULO: 'Espectáculo',
  ZAMBOMBA: 'Zambomba',
  NOCHEVIEJA: 'Nochevieja / Fin de año',
  CABALGATA_REYES: 'Cabalgata de Reyes',
  CABALGATA_PAPA_NOEL: 'Cabalgata de Papá Noel',
  GASTRONOMIA: 'Gastronomía',
  RUTA_TURISTICA: 'Ruta turística',
  OTRO: 'Otro',
};

const TIPO_ICONS: Record<string, string> = {
  ENCENDIDO_LUCES: '💡', MERCADILLO: '🎄', BELEN: '⭐', BELEN_VIVIENTE: '🌟',
  CONCIERTO: '🎵', TALLER_INFANTIL: '🧒', ESPECTACULO: '🎪', ZAMBOMBA: '🥁',
  NOCHEVIEJA: '🎆', CABALGATA_REYES: '👑', CABALGATA_PAPA_NOEL: '🎅',
  GASTRONOMIA: '🍽️', RUTA_TURISTICA: '🗺️', OTRO: '📌',
};

const PUBLICO_LABELS: Record<string, string> = {
  TODOS: 'Todos los públicos', NINOS: 'Niños', ADULTOS: 'Adultos', FAMILIAS: 'Familias',
};

type Evento = {
  id: number; tipo: string; publicoObjetivo: string;
  titulo: string; descripcion: string | null;
  avisosImportantes: string | null; ubicacion: string | null;
  fechaInicio: string; fechaFin: string | null;
  horarioApertura: string | null; horarioCierre: string | null;
  fotoUrl: string | null; youtubeUrl: string | null;
  streamUrl: string | null; googleMapsUrl: string | null;
  esFiestaInteresTuristico: boolean;
};

type Participante = {
  id: number; titulo: string | null; descripcion: string | null;
  cartelUrl: string | null; streamUrl: string | null; interesTuristico: string;
  pueblo: {
    id: number; nombre: string; slug: string;
    provincia: string; comunidad: string;
    lat?: number | null; lng?: number | null; foto_destacada: string | null;
  };
  eventos: Evento[];
};

type Props = {
  data: {
    config: { anio: number; fechaInicio: string; fechaFin: string; titulo: string; subtitulo?: string };
    participante: Participante;
  };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default function NavidadPuebloClient({ data }: Props) {
  const { config, participante: p } = data;
  const { pueblo, eventos } = p;
  const img = p.cartelUrl || pueblo.foto_destacada;

  const eventosByTipo = (() => {
    const grouped = new Map<string, Evento[]>();
    for (const e of eventos) {
      if (!grouped.has(e.tipo)) grouped.set(e.tipo, []);
      grouped.get(e.tipo)!.push(e);
    }
    return Array.from(grouped.entries())
      .map(([tipo, items]) => ({
        tipo,
        items: items.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()),
      }))
      .sort((a, b) => {
        const order = Object.keys(TIPO_LABELS);
        return order.indexOf(a.tipo) - order.indexOf(b.tipo);
      });
  })();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-2">
        <Link href="/planifica/navidad" className="text-sm text-muted-foreground hover:underline">
          ← Volver a Navidad
        </Link>
      </div>

      <header className="mb-10">
        {img && (
          <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-xl">
            <Image src={img} alt={pueblo.nombre} fill className="object-cover" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold drop-shadow-lg">{pueblo.nombre}</h1>
              <p className="text-sm opacity-90">{pueblo.provincia}, {pueblo.comunidad}</p>
            </div>
            {p.interesTuristico !== 'NINGUNO' && (
              <span className="absolute right-4 top-4 rounded-full bg-red-700/90 px-3 py-1 text-xs font-medium text-white">
                Interés Turístico {p.interesTuristico.charAt(0) + p.interesTuristico.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        )}
        {!img && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{pueblo.nombre}</h1>
            <p className="text-muted-foreground">{pueblo.provincia}, {pueblo.comunidad}</p>
          </div>
        )}
        {p.titulo && <p className="text-xl font-medium">{p.titulo}</p>}
        {p.descripcion && <p className="mt-2 text-muted-foreground">{p.descripcion}</p>}
      </header>

      {p.streamUrl && (
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">En directo</h2>
          <div className="aspect-video overflow-hidden rounded-xl border">
            <iframe src={p.streamUrl} className="h-full w-full" allowFullScreen allow="autoplay; encrypted-media" />
          </div>
        </section>
      )}

      {eventos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <div className="mb-4 text-5xl">🎄</div>
          <p>Aún no se han publicado eventos navideños para este pueblo.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {eventosByTipo.map(({ tipo, items }) => (
            <section key={tipo}>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <span>{TIPO_ICONS[tipo]}</span>
                <span>{TIPO_LABELS[tipo] || tipo}</span>
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="space-y-4">
                {items.map((e) => (
                  <article key={e.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    {e.fotoUrl && (
                      <div className="relative aspect-[16/6]">
                        <Image src={e.fotoUrl} alt={e.titulo} fill className="object-cover" sizes="100vw" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{e.titulo}</h3>
                        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {PUBLICO_LABELS[e.publicoObjetivo]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(e.fechaInicio)} · {formatTime(e.fechaInicio)}
                        {e.fechaFin ? ` – ${formatTime(e.fechaFin)}` : ''}
                      </p>
                      {e.horarioApertura && (
                        <p className="mt-1 text-sm text-emerald-700">
                          Horario diario: {e.horarioApertura} – {e.horarioCierre}
                        </p>
                      )}
                      {e.ubicacion && <p className="mt-1 text-sm text-muted-foreground">📍 {e.ubicacion}</p>}
                      {e.descripcion && <p className="mt-3 text-sm leading-relaxed">{e.descripcion}</p>}
                      {e.avisosImportantes && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          ⚠️ {e.avisosImportantes}
                        </div>
                      )}
                      {e.esFiestaInteresTuristico && (
                        <span className="mt-2 inline-flex rounded-full border border-red-700/30 bg-red-700/10 px-3 py-0.5 text-xs font-medium text-red-800">
                          Fiesta de Interés Turístico
                        </span>
                      )}
                      {e.streamUrl && (
                        <div className="mt-4 aspect-video overflow-hidden rounded-lg border">
                          <iframe src={e.streamUrl} className="h-full w-full" allowFullScreen allow="autoplay; encrypted-media" />
                        </div>
                      )}
                      {e.youtubeUrl && !e.streamUrl && (
                        <a href={e.youtubeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 hover:underline">
                          ▶ Ver en YouTube
                        </a>
                      )}
                      {e.googleMapsUrl && (
                        <a href={e.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          🗺️ Ver recorrido en Google Maps
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
