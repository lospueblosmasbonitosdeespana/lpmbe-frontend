'use client';

import { useEffect, useState } from 'react';

export type RecursoDisponibleImagen = {
  id: number;
  url: string;
  alt?: string | null;
  orden?: number;
};

export type RecursoDisponibleHorarioDia = {
  diaSemana: number; // 0..6 (0=lunes según convención existente)
  abierto: boolean;
  horaAbre?: string | null;
  horaCierra?: string | null;
};

export type RecursoDisponible = {
  id: number;
  nombre: string;
  slug?: string | null;
  tipo: string;
  scope?: string | null;
  descripcion?: string | null;
  fotoUrl?: string | null;
  imagenes?: RecursoDisponibleImagen[];
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  codigoQr: string;
  puebloId?: number | null;
  puebloNombre?: string | null;
  puebloSlug?: string | null;
  activo?: boolean;
  maxAdultos?: number;
  maxMenores?: number;
  edadMaxMenor?: number;
  // Geolocalización y contacto
  lat?: number | null;
  lng?: number | null;
  horarios?: string | null;
  horariosSemana?: RecursoDisponibleHorarioDia[];
  contacto?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  web?: string | null;
  bookingUrl?: string | null;
  servicios?: string[] | null;
  socialLinks?: Record<string, string> | null;
  provincia?: string | null;
  comunidad?: string | null;
  // Regalo del Club
  regaloActivo?: boolean;
  regaloTitulo?: string | null;
  regaloDescripcion?: string | null;
  regaloFotoUrl?: string | null;
  regaloCondiciones?: string | null;
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

