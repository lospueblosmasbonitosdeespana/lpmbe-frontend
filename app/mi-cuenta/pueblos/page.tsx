import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import PueblosVisitadosList from './components/PueblosVisitadosList';
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

export default async function PueblosVisitadosPage() {
  const data = await getPueblosVisitados();

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
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

      <PueblosVisitadosList items={data.items} />
    </main>
  );
}








