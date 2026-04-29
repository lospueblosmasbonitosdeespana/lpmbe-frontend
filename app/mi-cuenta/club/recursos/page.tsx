'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Building2, Landmark } from 'lucide-react';
import { useRecursosDisponibles } from '../_components/useRecursosDisponibles';

function getPuebloNombre(r: any): string | null {
  return r?.puebloNombre ?? r?.pueblo?.nombre ?? (typeof r?.pueblo === 'string' ? r.pueblo : null) ?? null;
}

export default function RecursosPage() {
  const t = useTranslations('club');
  const tAccount = useTranslations('myAccount');
  const { loading, error, data: recursos } = useRecursosDisponibles();
  const [pueblosMap, setPueblosMap] = useState<Record<number, { nombre: string; slug: string }>>({});
  const [loadingPueblos, setLoadingPueblos] = useState(false);

  // Detectar si falta algún slug y cargar mapa de pueblos si es necesario.
  useEffect(() => {
    if (loading || recursos.length === 0) return;

    const faltaSlug = recursos.some((r) => {
      if (!r.puebloId) return false;
      return !r.puebloSlug;
    });

    if (faltaSlug && Object.keys(pueblosMap).length === 0) {
      setLoadingPueblos(true);
      fetch('/api/pueblos', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            const map: Record<number, { nombre: string; slug: string }> = {};
            data.forEach((p: any) => {
              if (p?.id && p?.slug) {
                map[p.id] = { nombre: p.nombre ?? `Pueblo ${p.id}`, slug: p.slug };
              }
            });
            setPueblosMap(map);
          }
        })
        .catch(() => undefined)
        .finally(() => setLoadingPueblos(false));
    }
  }, [recursos, loading, pueblosMap]);

  const recursosAsociacion = useMemo(() => {
    return recursos.filter((r: any) => r.scope === 'ASOCIACION' || !r.puebloId);
  }, [recursos]);

  // Agrupar recursos de pueblo
  const pueblosConRecursos = useMemo(() => {
    const map = new Map<
      number,
      { id: number; nombre: string; slug: string; count: number }
    >();

    recursos.forEach((r) => {
      const puebloId = r.puebloId;
      if (!puebloId) return;

      const slug = r.puebloSlug ?? pueblosMap[puebloId]?.slug;
      if (!slug) return;

      const nombre =
        getPuebloNombre(r) ?? pueblosMap[puebloId]?.nombre ?? `Pueblo ${puebloId}`;
      const existing = map.get(puebloId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(puebloId, { id: puebloId, nombre, slug, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es'),
    );
  }, [recursos, pueblosMap]);

  if (loading || loadingPueblos) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-foreground">{tAccount('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-red-500">{error}</div>
        <div className="mt-4">
          <Link
            href="/mi-cuenta/club"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ChevronLeft size={16} aria-hidden /> {t('backToClub')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <Link
          href="/mi-cuenta/club"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} aria-hidden /> {t('backToClub')}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Recursos Turísticos del Club
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Museos, castillos, jardines, bodegas, monumentos… elige tu pueblo y entra para ver
          todo el detalle: foto, descripción, horarios, ubicación y los beneficios que
          tenéis los socios del Club.
        </p>
      </div>

      {/* Recursos de asociación */}
      {recursosAsociacion.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <Landmark size={20} className="text-amber-700" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">
              {t('associationResources')}
            </h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            {t('associationResourcesDesc')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recursosAsociacion.map((r: any) => (
              <Link
                key={r.id}
                href={r.slug ? `/recursos/${r.slug}` : '#'}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                {r.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.fotoUrl}
                    alt={r.nombre}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-amber-50 text-amber-300">
                    <Landmark size={36} aria-hidden />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-sm font-semibold text-foreground">
                    {r.nombre}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.tipo} · {r.provincia || r.comunidad || ''}
                  </div>
                  {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      −{r.descuentoPorcentaje}% Club
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recursos por pueblo */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">
            {t('resourcesInVillages')}
          </h2>
        </div>

        {pueblosConRecursos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            {t('noResourcesAvailable')}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pueblosConRecursos.map((p) => (
              <Link
                key={p.id}
                href={`/mi-cuenta/club/recursos/${p.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-amber-50/60 to-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Building2 size={22} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900 sm:text-[15px]">
                      {p.nombre}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.count} {p.count === 1 ? 'recurso' : 'recursos'} con beneficios para socios
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
