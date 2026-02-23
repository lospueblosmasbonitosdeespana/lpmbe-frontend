'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRecursosDisponibles } from '../_components/useRecursosDisponibles';

function getPuebloNombre(r: any): string | null {
  return r?.puebloNombre ?? r?.pueblo?.nombre ?? (typeof r?.pueblo === 'string' ? r.pueblo : null) ?? null;
}

export default function RecursosPage() {
  const t = useTranslations('club');
  const tAccount = useTranslations('myAccount');
  const { loading, error, data: recursos } = useRecursosDisponibles();
  const [pueblosMap, setPueblosMap] = useState<Record<number, string>>({});
  const [loadingPueblos, setLoadingPueblos] = useState(false);

  // Detectar si falta algún nombre y cargar mapa de pueblos si es necesario
  useEffect(() => {
    if (loading || recursos.length === 0) return;

    const faltaNombre = recursos.some(r => {
      const puebloId = r.puebloId;
      if (!puebloId) return false;
      return !getPuebloNombre(r);
    });

    if (faltaNombre && Object.keys(pueblosMap).length === 0) {
      setLoadingPueblos(true);
      fetch('/api/pueblos', { cache: 'no-store' })
        .then(res => {
          if (!res.ok) return;
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const map: Record<number, string> = {};
            data.forEach((p: any) => {
              if (p.id && p.nombre) {
                map[p.id] = p.nombre;
              }
            });
            setPueblosMap(map);
          }
        })
        .catch(() => {
          // Ignorar errores silenciosamente
        })
        .finally(() => {
          setLoadingPueblos(false);
        });
    }
  }, [recursos, loading, pueblosMap]);

  // Separar recursos de asociación y de pueblo
  const recursosAsociacion = useMemo(() => {
    return recursos.filter((r: any) => r.scope === 'ASOCIACION' || !r.puebloId);
  }, [recursos]);

  // Agrupar por pueblo (solo recursos con puebloId)
  const pueblosConRecursos = useMemo(() => {
    const map = new Map<number, { nombre: string; count: number }>();
    
    recursos.forEach((r) => {
      const puebloId = r.puebloId;
      if (!puebloId) return;
      
      const nombre = getPuebloNombre(r) ?? pueblosMap[puebloId] ?? `Pueblo ${puebloId}`;
      const existing = map.get(puebloId);
      
      if (existing) {
        existing.count += 1;
      } else {
        map.set(puebloId, { nombre, count: 1 });
      }
    });
    
    return Array.from(map.entries())
      .map(([id, info]) => ({ id, nombre: info.nombre, count: info.count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
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
          <Link href="/mi-cuenta/club" className="text-primary hover:underline">
            ← {t('backToClub')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{t('discountsOnResources')}</h1>
        <div className="text-sm text-muted-foreground">
          <Link href="/mi-cuenta/club" className="text-primary hover:underline">
            ← {t('backToClub')}
          </Link>
        </div>
      </div>

      {/* Recursos de asociación */}
      {recursosAsociacion.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{t('associationResources')}</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {t('associationResourcesDesc')}
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {recursosAsociacion.map((r: any) => (
              <Link
                key={r.id}
                href={r.slug ? `/recursos/${r.slug}` : '#'}
                className="block rounded-lg border border-border bg-card p-4 text-foreground transition hover:shadow-md dark:bg-neutral-800 dark:border-neutral-700"
              >
                <div className="font-semibold text-sm text-foreground">{r.nombre}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {r.tipo} · {r.provincia || r.comunidad || ''}
                </div>
                {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
                  <div className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    −{r.descuentoPorcentaje}% Club
                  </div>
                )}
                {r.maxAdultos != null && (
                  <div className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                    {r.maxAdultos === 1 && (r.maxMenores ?? 0) === 0
                      ? t('onlyHolder')
                      : `${r.maxAdultos} adulto${r.maxAdultos > 1 ? 's' : ''}${(r.maxMenores ?? 0) > 0 ? ` + ${r.maxMenores} menor${(r.maxMenores ?? 0) > 1 ? 'es' : ''} (<${r.edadMaxMenor ?? 12} años)` : ''}`}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recursos por pueblo */}
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('resourcesInVillages')}</h2>
      {pueblosConRecursos.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('noResourcesAvailable')}</div>
      ) : (
        <table className="w-full border-collapse rounded-lg border border-border text-sm dark:border-neutral-700">
          <thead>
            <tr className="border-b border-border bg-muted text-foreground dark:bg-neutral-800 dark:border-neutral-700">
              <th className="px-3 py-2 text-left">{t('town')}</th>
              <th className="px-3 py-2 text-center">{t('numResources')}</th>
              <th className="px-3 py-2 text-center">{t('view')}</th>
            </tr>
          </thead>
          <tbody>
            {pueblosConRecursos.map((p) => (
              <tr key={p.id} className="border-b border-border dark:border-neutral-700">
                <td className="px-3 py-2 text-foreground">{p.nombre}</td>
                <td className="px-3 py-2 text-center text-foreground">{p.count}</td>
                <td className="px-3 py-2 text-center">
                  <Link
                    href={`/mi-cuenta/club/recursos/${p.id}`}
                    className="text-primary hover:underline"
                  >
                    {t('view')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

