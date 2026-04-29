'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ChevronLeft,
  Mountain,
  MapPin,
  Sparkles,
  Smartphone,
  Wifi,
  Navigation,
} from 'lucide-react';
import { useRecursosDisponibles } from '../_components/useRecursosDisponibles';
import { useGamificacionConfig } from '../_components/useGamificacionConfig';

function buildMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function RecursosRuralesSocioPage() {
  const { loading, error, data } = useRecursosDisponibles();
  const { getPuntos } = useGamificacionConfig();
  const puntos = getPuntos('RECURSO_NATURAL_VISITADO');

  const items = useMemo(() => {
    return data.filter(
      (r) => r.activo !== false && (r.validacionTipo === 'GEO' || r.validacionTipo === 'AMBOS'),
    );
  }, [data]);

  const grupos = useMemo(() => {
    const map = new Map<
      string,
      { titulo: string; recursos: typeof items; puebloSlug: string | null }
    >();
    for (const r of items) {
      const k = r.puebloId
        ? `pueblo-${r.puebloId}`
        : 'asociacion';
      const titulo = r.puebloNombre ?? 'Recursos de la asociación';
      if (!map.has(k)) {
        map.set(k, {
          titulo,
          recursos: [],
          puebloSlug: r.puebloSlug ?? null,
        });
      }
      map.get(k)!.recursos.push(r);
    }
    return [...map.values()];
  }, [items]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/mi-cuenta/club"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver al Club de Amigos
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
          <Mountain className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Recursos rurales / naturales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cascadas, miradores, parajes, dólmenes, ermitas en ruta… Lugares
            sin QR físico que se validan por GPS desde tu móvil.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <Smartphone className="h-4 w-4" />
            Cómo funciona
          </div>
          <p className="text-xs text-emerald-900/85">
            Llega al recurso, abre la app de LPMBE y, en la ficha del recurso,
            pulsa <strong>"Estoy aquí"</strong>. La app envía tu ubicación y
            registra la visita si estás dentro del radio.
          </p>
        </div>
        <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-fuchsia-900">
            <Sparkles className="h-4 w-4" />
            Gamificación
          </div>
          <p className="text-xs text-fuchsia-900/85">
            Cada visita validada por GPS suma{' '}
            <strong>+{puntos} puntos</strong> a tu marcador del Club.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-900">
            <Wifi className="h-4 w-4" />
            ¿Sin cobertura?
          </div>
          <p className="text-xs text-sky-900/85">
            El GPS funciona sin datos. Para registrar la visita necesitas
            conexión: si no la hay, la app te avisará y podrás reintentar al
            volver a tener señal.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          Cargando recursos…
        </div>
      )}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && grupos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Aún no hay recursos rurales/naturales publicados. ¡Pronto se irán
          añadiendo desde los pueblos y la asociación!
        </div>
      )}

      <div className="space-y-8">
        {grupos.map((g, i) => (
          <section key={i}>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {g.titulo}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                · {g.recursos.length} {g.recursos.length === 1 ? 'recurso' : 'recursos'}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.recursos.map((r) => (
                <article
                  key={r.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  {r.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.fotoUrl}
                      alt={r.nombre}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-emerald-50 text-emerald-300">
                      <Mountain className="h-12 w-12" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {r.nombre}
                        </h3>
                        <div className="mt-0.5 text-xs text-muted-foreground">{r.tipo}</div>
                      </div>
                      {puntos > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-800">
                          <Sparkles className="h-3 w-3" />+{puntos} pts
                        </span>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {r.descripcion}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {r.lat != null && r.lng != null && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3" />
                          {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">
                        Radio {r.geoRadioMetros ?? 200} m
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {r.lat != null && r.lng != null && (
                        <a
                          href={buildMapsLink(r.lat, r.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Cómo llegar
                        </a>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Valida desde la app móvil
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
