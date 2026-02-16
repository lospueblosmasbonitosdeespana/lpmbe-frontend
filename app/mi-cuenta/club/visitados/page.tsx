'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useValidacionesClub } from '../_components/useValidacionesClub';

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function esHoy(fecha: string | null | undefined): boolean {
  if (!fecha) return false;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === hoy.getTime();
}

export default function VisitadosPage() {
  const t = useTranslations('club');
  const tAccount = useTranslations('myAccount');
  const { loading, error, data: validaciones, noDisponible } = useValidacionesClub();

  // Filtrar solo OK y agrupar por pueblo y recurso
  const visitadosAgrupados = useMemo(() => {
    const validacionesOk = validaciones.filter(v => v.resultado === 'OK');
    
    const map = new Map<string, {
      puebloId: number | null;
      puebloNombre: string;
      recursos: Map<number, {
        recursoId: number;
        recursoNombre: string;
        ultimaFecha: string;
        esHoy: boolean;
      }>;
    }>();

    validacionesOk.forEach((v) => {
      const puebloId = v.puebloId ?? 0;
      const puebloNombre = v.puebloNombre || v.pueblo?.nombre || `Pueblo ${puebloId}`;
      const recursoId = v.recursoId ?? 0;
      const recursoNombre = v.recursoNombre || v.recurso?.nombre || `Recurso ${recursoId}`;
      
      const key = `${puebloId}-${puebloNombre}`;
      let pueblo = map.get(key);
      
      if (!pueblo) {
        pueblo = {
          puebloId,
          puebloNombre,
          recursos: new Map(),
        };
        map.set(key, pueblo);
      }
      
      const recurso = pueblo.recursos.get(recursoId);
      const fecha = v.scannedAt;
      const esHoyFecha = esHoy(fecha);
      
      if (!recurso || new Date(fecha) > new Date(recurso.ultimaFecha)) {
        pueblo.recursos.set(recursoId, {
          recursoId,
          recursoNombre,
          ultimaFecha: fecha,
          esHoy: esHoyFecha,
        });
      }
    });
    
    return Array.from(map.values())
      .map(p => ({
        ...p,
        recursos: Array.from(p.recursos.values()).sort((a, b) => 
          a.recursoNombre.localeCompare(b.recursoNombre, 'es')
        ),
      }))
      .sort((a, b) => a.puebloNombre.localeCompare(b.puebloNombre, 'es'));
  }, [validaciones]);

  if (loading) {
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

  if (noDisponible) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 14, color: '#666' }}>{t('historyUnavailable')}</div>
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
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t('visitedResourcesTitle')}</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← {t('backToClub')}
          </Link>
        </div>
      </div>

      {visitadosAgrupados.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>{t('noResourceVisits')}</div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          {visitadosAgrupados.map((pueblo, idx) => (
            <div key={idx}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{pueblo.puebloNombre}</h2>
              <div style={{ display: 'grid', gap: 8, paddingLeft: 16 }}>
                {pueblo.recursos.map((recurso) => (
                  <div key={recurso.recursoId} style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 500 }}>{recurso.recursoNombre}</span>
                    <span style={{ color: '#666', marginLeft: 8 }}>
                      — {t('lastVisit')} {formatFecha(recurso.ultimaFecha)}
                      {recurso.esHoy && (
                        <span style={{ color: '#22c55e', fontWeight: 600, marginLeft: 4 }}>({t('today')})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

