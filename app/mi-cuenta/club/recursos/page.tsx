'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRecursosDisponibles } from '../_components/useRecursosDisponibles';

function getPuebloNombre(r: any): string | null {
  return r?.puebloNombre ?? r?.pueblo?.nombre ?? (typeof r?.pueblo === 'string' ? r.pueblo : null) ?? null;
}

export default function RecursosPage() {
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

  // Agrupar por pueblo
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
        <div>Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de Amigos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Descuentos en recursos turísticos</h1>
        <div style={{ fontSize: 14, color: '#666' }}>
          <Link href="/mi-cuenta/club" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Volver a Club de Amigos
          </Link>
        </div>
      </div>

      {pueblosConRecursos.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>No hay recursos disponibles.</div>
      ) : (
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Pueblo</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Nº recursos</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>Ver</th>
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
                    Ver
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

