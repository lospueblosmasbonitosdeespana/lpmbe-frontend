'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import PueblosVisitadosList from './PueblosVisitadosList';
import PueblosPorVisitar from './PueblosPorVisitar';
import MapaPueblosVisitados from '../mapa';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Caption } from '@/app/components/ui/typography';

type PuebloVisitado = {
  puebloId: number;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  origen: 'GPS' | 'MANUAL';
  ultima_fecha: string;
  rating?: number | null;
};

type Pueblo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  provincia?: string | null;
  comunidad?: string | null;
};

type Props = {
  initialData: {
    total: number;
    gps: number;
    manual: number;
    items: PuebloVisitado[];
  };
  todosPueblos: Pueblo[];
};

export default function PueblosPageClient({ initialData, todosPueblos }: Props) {
  const t = useTranslations('visitedVillages');
  const [data, setData] = useState(initialData);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sincronizar con datos frescos del servidor (ej. tras router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Set de IDs visitados
  const visitedIds = useMemo(() => {
    return new Set(data.items.map((item) => item.puebloId));
  }, [data.items]);

  // Map de origen por pueblo: GPS (azul) o MANUAL (verde)
  const visitedOrigins = useMemo(() => {
    const map = new Map<number, 'GPS' | 'MANUAL'>();
    data.items.forEach((item) => map.set(item.puebloId, item.origen));
    return map;
  }, [data.items]);

  // Función para marcar un pueblo como visitado
  const handleMarcarVisitado = useCallback(
    async (puebloId: number) => {
      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al registrar visita');
      }

      // Encontrar el pueblo en todosPueblos para obtener sus datos
      const pueblo = todosPueblos.find((p) => p.id === puebloId);
      if (!pueblo) return;

      const puntosOtorgados = result.puntos?.puntos ?? 20;

      // Crear nuevo item visitado
      const nuevoItem: PuebloVisitado = {
        puebloId,
        pueblo: {
          id: puebloId,
          nombre: pueblo.nombre,
          slug: pueblo.nombre.toLowerCase().replace(/\s+/g, '-'),
          provincia: pueblo.provincia || '',
          comunidad: pueblo.comunidad || '',
          foto_destacada: null,
        },
        origen: 'MANUAL',
        ultima_fecha: new Date().toISOString(),
        rating: null,
      };

      // Actualizar estado local
      setData((prev) => ({
        total: prev.total + 1,
        gps: prev.gps,
        manual: prev.manual + 1,
        items: [nuevoItem, ...prev.items],
      }));

      // Mostrar mensaje de éxito
      setSuccessMsg(`${pueblo.nombre} ${t('markedVisited')} (+${puntosOtorgados} ${t('pointsLabel')})`);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    [todosPueblos]
  );

  const handleRatingSaved = useCallback((puebloId: number, rating: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.puebloId === puebloId ? { ...it, rating } : it
      ),
    }));
  }, []);

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-background" />
          <Container size="full" className="relative max-w-[1600px]">
            <div className="space-y-6 py-8 lg:py-12">
              <div>
                <Headline as="h1">{t('title')}</Headline>
                <Caption className="mt-1 block">
                  {t('subtitle')}
                </Caption>
              </div>

              {/* Mensaje de éxito */}
              {successMsg && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                  {successMsg}
                </div>
              )}

              {/* Contadores */}
              <div className="grid grid-cols-3 gap-4 sm:max-w-md">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <Caption>{t('total')}</Caption>
                  <p className="mt-1 font-serif text-2xl font-medium tabular-nums">{data.total}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                  <Caption className="text-blue-700">{t('gps')}</Caption>
                  <p className="mt-1 font-serif text-2xl font-medium tabular-nums text-blue-700">{data.gps}</p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
                  <Caption className="text-green-700">{t('manual')}</Caption>
                  <p className="mt-1 font-serif text-2xl font-medium tabular-nums text-green-700">{data.manual}</p>
                </div>
              </div>

              {/* Layout principal: visitados + mapa */}
              <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.9fr] xl:gap-6">
                {/* Columna izquierda: pueblos visitados */}
                <div className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm lg:max-h-[70vh] lg:p-6">
                  <PueblosVisitadosList
                    items={data.items}
                    onRatingSaved={handleRatingSaved}
                  />
                </div>

                {/* Columna derecha: mapa */}
                <div className="min-h-0 overflow-hidden rounded-xl border border-border shadow-sm lg:min-h-[70vh]">
                  <MapaPueblosVisitados pueblos={todosPueblos} visitedIds={visitedIds} visitedOrigins={visitedOrigins} />
                </div>
              </div>

              {/* Pueblos por visitar */}
              <div className="pt-4">
                <PueblosPorVisitar
                  pueblos={todosPueblos}
                  visitedIds={visitedIds}
                  onMarcarVisitado={handleMarcarVisitado}
                />
              </div>
            </div>
          </Container>
        </div>
      </Section>
    </div>
  );
}
