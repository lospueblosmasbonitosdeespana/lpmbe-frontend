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
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div>{tAccount('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← {t('backToClub')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t('discountsOnResources')}</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← {t('backToClub')}
          </Link>
        </div>
      </div>

      {/* Recursos de asociación */}
      {recursosAsociacion.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{t('associationResources')}</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            {t('associationResourcesDesc')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {recursosAsociacion.map((r: any) => (
              <Link
                key={r.id}
                href={r.slug ? `/recursos/${r.slug}` : '#'}
                style={{
                  display: 'block',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15 }}>{r.nombre}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  {r.tipo} · {r.provincia || r.comunidad || ''}
                </div>
                {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
                  <div style={{
                    marginTop: 8,
                    display: 'inline-block',
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}>
                    −{r.descuentoPorcentaje}% Club
                  </div>
                )}
                  {r.maxAdultos != null && (
                  <div style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: '#1d4ed8',
                  }}>
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
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{t('resourcesInVillages')}</h2>
      {pueblosConRecursos.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>{t('noResourcesAvailable')}</div>
      ) : (
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>{t('town')}</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>{t('numResources')}</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>{t('view')}</th>
            </tr>
          </thead>
          <tbody>
            {pueblosConRecursos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{p.nombre}</td>
                <td style={{ textAlign: 'center', padding: '8px' }}>{p.count}</td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <Link
                    href={`/mi-cuenta/club/recursos/${p.id}`}
                    style={{ color: '#0066cc', textDecoration: 'none' }}
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

