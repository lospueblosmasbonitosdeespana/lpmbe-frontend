import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { redirect } from 'next/navigation';
import PreferenciasNotificaciones from './components/PreferenciasNotificaciones';

export const dynamic = 'force-dynamic';

type Pueblo = {
  id: number;
  nombre: string;
  provincia?: string | null;
  comunidad?: string | null;
  slug: string;
};

type Suscripcion = {
  puebloId: number;
  tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO';
  enabled: boolean;
};

type Notificacion = {
  id: string | number;
  tipo?: string;
  titulo?: string;
  contenido?: string;
  mensaje?: string;
  fecha?: string;
  createdAt?: string;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
};

async function getPueblos(): Promise<Pueblo[]> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pueblos`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function getPreferencias(token: string): Promise<Suscripcion[]> {
  const API_BASE = getApiUrl();
  // Intentar obtener preferencias del backend
  // Si el endpoint no existe aún, devolver array vacío
  try {
    const res = await fetch(`${API_BASE}/suscripciones`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Si 404 o error, devolver array vacío (endpoint no existe aún)
      return [];
    }

    const data = await res.json();
    // Normalizar respuesta (puede venir como array o como objeto con items)
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    return [];
  } catch {
    return [];
  }
}

async function getNotificaciones(token: string): Promise<Notificacion[]> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/notificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    // Normalizar respuesta
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    return [];
  } catch {
    return [];
  }
}

function formatFecha(fecha: string | undefined | null): string {
  if (!fecha) return 'Sin fecha';
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Sin fecha';
  }
}

export default async function NotificacionesPage() {
  const token = await getToken();

  if (!token) {
    redirect('/login');
  }

  const [pueblos, preferencias, notificaciones] = await Promise.all([
    getPueblos(),
    getPreferencias(token),
    getNotificaciones(token),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        <p className="mt-2 text-gray-600">Elige qué quieres recibir por pueblo</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Preferencias</h2>
        <PreferenciasNotificaciones pueblos={pueblos} initial={preferencias} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Bandeja</h2>
        {notificaciones.length === 0 ? (
          <p className="text-sm text-gray-600">No hay notificaciones</p>
        ) : (
          <div className="space-y-4">
            {notificaciones.map((notif) => (
              <div key={notif.id} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">
                      {notif.titulo ?? notif.tipo ?? 'Notificación'}
                    </div>
                    {notif.pueblo && (
                      <div className="text-sm text-gray-600">
                        Pueblo: {notif.pueblo.nombre}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFecha(notif.fecha ?? notif.createdAt)}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  {notif.contenido ?? notif.mensaje ?? ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
