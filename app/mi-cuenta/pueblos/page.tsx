import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { redirect } from 'next/navigation';
import PueblosPageClient from './components/PueblosPageClient';

export const dynamic = 'force-dynamic';

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

type PueblosVisitadosResponse = {
  total: number;
  gps: number;
  manual: number;
  items: PuebloVisitado[];
};

type Pueblo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  provincia?: string | null;
  comunidad?: string | null;
};

async function getPueblosVisitados(): Promise<PueblosVisitadosResponse> {
  const token = await getToken();

  if (!token) {
    redirect('/entrar');
  }

  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/usuarios/me/pueblos-visitados`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/entrar');
  }

  if (!res.ok) {
    throw new Error('Error cargando pueblos visitados');
  }

  return res.json();
}

async function getAllPueblos(): Promise<Pueblo[]> {
  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/pueblos`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Error cargando pueblos');
  }

  const pueblos = await res.json();
  // Filtrar solo los que tienen coordenadas válidas
  return pueblos.filter(
    (p: any) =>
      typeof p.lat === 'number' &&
      typeof p.lng === 'number' &&
      !Number.isNaN(p.lat) &&
      !Number.isNaN(p.lng)
  );
}

export default async function PueblosVisitadosPage() {
  const [data, todosPueblos] = await Promise.all([
    getPueblosVisitados(),
    getAllPueblos(),
  ]);

  return (
    <PueblosPageClient
      initialData={data}
      todosPueblos={todosPueblos}
    />
  );
}








