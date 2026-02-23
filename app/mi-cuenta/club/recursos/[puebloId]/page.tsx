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
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div>{tAccount('loading')}</div>
      </div>
    );
  }

  if (errorRecursos) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ color: '#ef4444' }}>{errorRecursos}</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/mi-cuenta/club/recursos" style={{ color: '#0066cc', textDecoration: 'none' }}>
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
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          {t('touristResources')} — {puebloNombre}
        </h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/mi-cuenta/club/recursos" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← {t('backToTownList')}
          </Link>
        </div>
      </div>

      {recursosDelPueblo.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>{t('townNoResources')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {recursosDelPueblo.map((r) => {
            const { visitado, hoy } = esRecursoVisitado(validaciones, r.id);
            return (
              <div key={r.id} style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{r.nombre}</div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                      {t('type')}: {r.tipo || '—'}
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                      {t('price')}: {r.precioCents ? `${(r.precioCents / 100).toFixed(2)} €` : '—'}
                    </div>
                    {r.descuentoPorcentaje && r.precioCents && (
                      <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>
                        {t('withDiscount')}: {((r.precioCents / 100) * (1 - r.descuentoPorcentaje / 100)).toFixed(2)} €
                      </div>
                    )}
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {t('discount')}: {r.descuentoPorcentaje !== null && r.descuentoPorcentaje !== undefined
                        ? `${r.descuentoPorcentaje}%`
                        : '—'}
                    </div>
                    {r.maxAdultos != null && (
                      <div style={{
                        marginTop: 6,
                        fontSize: 13,
                        color: '#1d4ed8',
                        background: '#eff6ff',
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 8,
                        fontWeight: 500,
                      }}>
                        {r.maxAdultos === 1 && (r.maxMenores ?? 0) === 0
                          ? t('discountOnlyHolder')
                          : `${t('upToAdults', { count: r.maxAdultos, plural: r.maxAdultos > 1 ? 's' : '' })}${(r.maxMenores ?? 0) > 0 ? t('plusMinors', { count: r.maxMenores, plural: (r.maxMenores ?? 0) > 1 ? 'es' : '', age: r.edadMaxMenor ?? 12 }) : ''}`}
                      </div>
                    )}
                  </div>
                  {visitado && (
                    <div style={{ marginLeft: 16 }}>
                      <span style={{
                        fontSize: 12,
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                        background: hoy ? '#dcfce7' : '#dbeafe',
                        color: hoy ? '#166534' : '#1e40af'
                      }}>
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

