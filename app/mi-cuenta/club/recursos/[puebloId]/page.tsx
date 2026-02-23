'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRecursosDisponibles, RecursoDisponible } from '../../_components/useRecursosDisponibles';
import { useValidacionesClub } from '../../_components/useValidacionesClub';

function esRecursoVisitado(validaciones: any[], recursoId: number): { visitado: boolean; hoy: boolean } {
  const validacionesOk = validaciones.filter(v => v.resultado === 'OK' && v.recursoId === recursoId);
  if (validacionesOk.length === 0) {
    return { visitado: false, hoy: false };
  }
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const visitadoHoy = validacionesOk.some(v => {
    const fecha = new Date(v.scannedAt);
    fecha.setHours(0, 0, 0, 0);
    return fecha.getTime() === hoy.getTime();
  });
  
  return { visitado: true, hoy: visitadoHoy };
}

export default function RecursosPuebloPage() {
  const t = useTranslations('club');
  const tAccount = useTranslations('myAccount');
  const params = useParams();
  const puebloId = params?.puebloId as string;
  const { loading: loadingRecursos, error: errorRecursos, data: recursos } = useRecursosDisponibles();
  const { loading: loadingValidaciones, data: validaciones } = useValidacionesClub();

  const recursosDelPueblo = recursos.filter(r => r.puebloId === Number(puebloId));

  if (loadingRecursos || loadingValidaciones) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-foreground">{tAccount('loading')}</div>
      </div>
    );
  }

  if (errorRecursos) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="text-red-500">{errorRecursos}</div>
        <div className="mt-4">
          <Link href="/mi-cuenta/club/recursos" className="text-primary hover:underline">
            ← {t('backToTownList')}
          </Link>
        </div>
      </div>
    );
  }

  const puebloNombre = recursosDelPueblo.length > 0
    ? recursosDelPueblo[0].puebloNombre || `Pueblo ${puebloId}`
    : `Pueblo ${puebloId}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('touristResources')} — {puebloNombre}
        </h1>
        <div className="text-sm text-muted-foreground">
          <Link href="/mi-cuenta/club/recursos" className="text-primary hover:underline">
            ← {t('backToTownList')}
          </Link>
        </div>
      </div>

      {recursosDelPueblo.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('townNoResources')}</div>
      ) : (
        <div className="grid gap-4">
          {recursosDelPueblo.map((r) => {
            const { visitado, hoy } = esRecursoVisitado(validaciones, r.id);
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 text-base font-semibold text-foreground">{r.nombre}</div>
                    <div className="mb-1 text-sm text-muted-foreground">
                      {t('type')}: {r.tipo || '—'}
                    </div>
                    <div className="mb-1 text-sm text-muted-foreground">
                      {t('price')}: {r.precioCents ? `${(r.precioCents / 100).toFixed(2)} €` : '—'}
                    </div>
                    {r.descuentoPorcentaje && r.precioCents && (
                      <div className="mb-1 text-sm font-semibold text-green-600 dark:text-green-400">
                        {t('withDiscount')}: {((r.precioCents / 100) * (1 - r.descuentoPorcentaje / 100)).toFixed(2)} €
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {t('discount')}: {r.descuentoPorcentaje !== null && r.descuentoPorcentaje !== undefined
                        ? `${r.descuentoPorcentaje}%`
                        : '—'}
                    </div>
                    {r.maxAdultos != null && (
                      <div className="mt-1.5 inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {r.maxAdultos === 1 && (r.maxMenores ?? 0) === 0
                          ? t('discountOnlyHolder')
                          : `${t('upToAdults', { count: r.maxAdultos, plural: r.maxAdultos > 1 ? 's' : '' })}${(r.maxMenores ?? 0) > 0 ? t('plusMinors', { count: r.maxMenores ?? 0, plural: (r.maxMenores ?? 0) > 1 ? 'es' : '', age: r.edadMaxMenor ?? 12 }) : ''}`}
                      </div>
                    )}
                  </div>
                  {visitado && (
                    <div>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${hoy ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                        {hoy ? t('visitedToday') : t('visited')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

