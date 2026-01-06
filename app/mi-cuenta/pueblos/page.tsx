import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import PueblosVisitadosList from './components/PueblosVisitadosList';
import MapaPueblosVisitados from './mapa';
import { redirect } from 'next/navigation';

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

function extractVisitedIds(data: any): Set<number> {
  const items = Array.isArray(data) ? data : (data?.items ?? data?.visitados ?? []);
  const set = new Set<number>();

  for (const it of items) {
    const id =
      (typeof it?.puebloId === 'number' ? it.puebloId : null) ??
      (typeof it?.pueblo?.id === 'number' ? it.pueblo.id : null) ??
      (typeof it?.id === 'number' ? it.id : null);

    if (typeof id === 'number') set.add(id);
  }

  if (set.size === 0) {
    console.warn('[pueblos-visitados] No pude extraer puebloId del payload. Revisa forma de datos.', {
      sample: items?.[0],
      keys: items?.[0] ? Object.keys(items[0]) : null,
    });
  }

  return set;
}

async function getPueblosVisitados(): Promise<PueblosVisitadosResponse> {
  const token = await getToken();

  if (!token) {
    redirect('/login');
  }

  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/usuarios/me/pueblos-visitados`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login');
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

  const visitedIds = extractVisitedIds(data);

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Mis pueblos visitados</h1>
        </div>

        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold">{data.total}</span>
          </div>
          <div>
            <span className="text-gray-600">GPS: </span>
            <span className="font-semibold">{data.gps}</span>
          </div>
          <div>
            <span className="text-gray-600">Manual: </span>
            <span className="font-semibold">{data.manual}</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(520px, 1.1fr) minmax(700px, 1.9fr)',
            gap: 8,
            alignItems: 'start',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <PueblosVisitadosList items={data.items} />
          </div>
          <div style={{ minWidth: 0 }}>
            <MapaPueblosVisitados pueblos={todosPueblos} visitedIds={visitedIds} />
          </div>
        </div>
      </main>
    </div>
  );
}








