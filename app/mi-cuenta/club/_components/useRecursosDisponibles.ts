'use client';

import { useEffect, useState } from 'react';

export type RecursoDisponible = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  codigoQr: string;
  puebloId?: number | null;
  puebloNombre?: string | null;
  activo?: boolean;
};

export function useRecursosDisponibles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecursoDisponible[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/club/recursos/disponibles', { cache: 'no-store' });

        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }

        if (res.status === 502) {
          const errorData = await res.json().catch(() => ({}));
          if (errorData?.error === 'upstream_fetch_failed') {
            setError('No se pudo conectar al backend');
          } else {
            setError('El backend no está disponible');
          }
          return;
        }

        if (!res.ok) {
          setError('Error cargando recursos');
          return;
        }

        const recursosData = await res.json().catch(() => ({}));
        const recursos = Array.isArray(recursosData) 
          ? recursosData 
          : (Array.isArray(recursosData.items) ? recursosData.items : []);
        
        setData(recursos);
      } catch (e: any) {
        setError(e?.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { loading, error, data };
}

