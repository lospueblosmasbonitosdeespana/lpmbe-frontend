import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ExplorarClient from '../ExplorarClient';
import Breadcrumbs from '@/app/_components/ui/Breadcrumbs';
import { Container } from '@/app/components/ui/container';
import {
  parseExplorarSlug,
  buildExplorarTitle,
  buildExplorarDescription,
} from '@/lib/explorar-slugs';
import { getApiUrl } from '@/lib/api';

type Props = {
  params: Promise<{ filtros: string[] }>;
};

async function fetchActiveCollectionKeys(): Promise<{
  tags: Set<string>;
  servicios: Set<string>;
}> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(
      `${API_BASE}/public/explorar/counts?soloColecciones=true`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return { tags: new Set(), servicios: new Set() };
    const data = await res.json();
    return {
      tags: new Set(
        (data.tags ?? []).map((t: { tag: string }) => t.tag),
      ),
      servicios: new Set(
        (data.servicios ?? []).map((s: { tipo: string }) => s.tipo),
      ),
    };
  } catch {
    return { tags: new Set(), servicios: new Set() };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { filtros } = await params;
  const { filter, location } = parseExplorarSlug(filtros);

  if (!filter && !location) return {};

  const API_BASE = getApiUrl();
  let total = 0;
  try {
    const qp = new URLSearchParams();
    if (filter?.type === 'tag') qp.set('tags', filter.key);
    if (filter?.type === 'servicio') qp.set('servicios', filter.key);
    if (location?.type === 'region') qp.set('region', location.key);
    if (location?.type === 'comunidad') qp.set('comunidad', location.key);

    const res = await fetch(`${API_BASE}/public/explorar?${qp}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      total = data.total ?? 0;
    }
  } catch {}

  const title = buildExplorarTitle(filter, location, total);
  const description = buildExplorarDescription(filter, location, total);

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function ExplorarFiltrosPage({ params }: Props) {
  const { filtros } = await params;
  const { filter, location } = parseExplorarSlug(filtros);

  if (!filter && !location) notFound();

  if (filter) {
    const active = await fetchActiveCollectionKeys();
    const isApproved =
      (filter.type === 'tag' && active.tags.has(filter.key)) ||
      (filter.type === 'servicio' && active.servicios.has(filter.key));
    if (!isApproved) notFound();
  }

  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: 'Inicio', href: '/' },
    { label: 'Explorar', href: '/explorar' },
  ];
  if (filter) {
    breadcrumbItems.push({ label: filter.label_es });
  }
  if (location) {
    breadcrumbItems.push({ label: location.label_es });
  }

  const titleParts: string[] = [];
  if (filter) titleParts.push(`Pueblos con ${filter.label_es.toLowerCase()}`);
  else titleParts.push('Pueblos');
  if (location) titleParts.push(`en ${location.label_es}`);

  return (
    <Container className="py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {titleParts.join(' ')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Datos de primera mano verificados por los municipios. Filtra para
          encontrar tu pueblo ideal.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border bg-card"
              >
                <div className="aspect-[16/10] bg-muted" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <ExplorarClient initialFilter={filter} initialLocation={location} />
      </Suspense>
    </Container>
  );
}
