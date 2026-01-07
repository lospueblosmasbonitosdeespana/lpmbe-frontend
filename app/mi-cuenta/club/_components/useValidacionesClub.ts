'use client';

import { useEffect, useState } from 'react';

export type ClubValidacion = {
  id: number;
  scannedAt: string;
  resultado?: 'OK' | 'CADUCADO' | 'YA_USADO' | 'INVALIDO' | string | null;
  puebloId?: number | null;
  puebloNombre?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
  } | null;
  recursoId?: number | null;
  recursoNombre?: string | null;
  recurso?: {
    id: number;
    nombre: string;
  } | null;
  adultosUsados?: number | null;
  menoresUsados?: number | null;
  descuentoPorcentaje?: number | null;
};

type ClubValidacionesResponse = {
  items?: ClubValidacion[];
  total?: number;
};

export function useValidacionesClub() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClubValidacion[]>([]);
  const [noDisponible, setNoDisponible] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/club/validaciones', { cache: 'no-store' });

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

        if (res.status === 404 || res.status === 501) {
          // Endpoint aún no disponible en backend
          setData([]);
          setNoDisponible(true);
          return;
        }

        if (!res.ok) {
          setError('Error cargando validaciones');
          return;
        }

        const validacionesData: ClubValidacionesResponse = await res.json().catch(() => ({}));
        const validaciones = Array.isArray(validacionesData) 
          ? validacionesData 
          : (Array.isArray(validacionesData.items) ? validacionesData.items : []);
        
        setData(validaciones);
        setNoDisponible(false);
      } catch (e: any) {
        setError(e?.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { loading, error, data, noDisponible };
}

