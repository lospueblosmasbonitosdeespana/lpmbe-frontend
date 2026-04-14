import type { Metadata } from 'next';
import { Suspense } from 'react';
import ExplorarClient from './ExplorarClient';
import Breadcrumbs from '@/app/_components/ui/Breadcrumbs';
import { Container } from '@/app/components/ui/container';

export const metadata: Metadata = {
  title: 'Explorar pueblos — Los Pueblos Más Bonitos de España',
  description:
    'Encuentra tu pueblo ideal filtrando por patrimonio, naturaleza, servicios del visitante y ubicación. Más de 120 pueblos con datos de primera mano.',
  openGraph: {
    title: 'Explorar pueblos — Los Pueblos Más Bonitos de España',
    description:
      'Encuentra tu pueblo ideal filtrando por patrimonio, naturaleza, servicios y ubicación.',
  },
};

export default function ExplorarPage() {
  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Explorar' },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Explorar pueblos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Filtra por patrimonio, naturaleza, servicios del visitante y ubicación para encontrar tu pueblo ideal.
        </p>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
              <div className="aspect-[16/10] bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      }>
        <ExplorarClient initialFilter={null} initialLocation={null} />
      </Suspense>
    </Container>
  );
}
