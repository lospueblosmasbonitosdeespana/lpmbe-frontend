import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import DashboardResumen from './components/DashboardResumen';
import DashboardPuntos from './components/DashboardPuntos';
import DashboardFavoritos from './components/DashboardFavoritos';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const token = await getToken();

  if (!token) {
    redirect('/login');
  }

  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/usuarios/me/puntos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login');
  }

  if (!res.ok) {
    throw new Error('Error cargando dashboard del usuario');
  }

  const raw = await res.json();

  const data = {
    puntosTotales: Number(raw?.total ?? 0),
    puntosPorTipo: {
      VISITA: Number(raw?.detalle?.VISITA ?? 0),
      RUTA: Number(raw?.detalle?.RUTA ?? 0),
      EVENTO: Number(raw?.detalle?.EVENTO ?? 0),
      MULTIEXPERIENCIA: Number(raw?.detalle?.MULTIEXPERIENCIA ?? 0),
    },
    nivelActual: raw?.nivel
      ? { nombre: String(raw.nivel), nivel: 0 }
      : null,
    siguienteNivel: raw?.nivel_siguiente
      ? { nombre: String(raw.nivel_siguiente), nivel: 0, puntos_necesarios: 0 }
      : null,
    progreso: 0,
  };

  return data;
}

export default async function MiCuentaPage() {
  const data = await getDashboardData();
  const token = await getToken();

  if (!token) {
    redirect('/login');
  }

  const API_BASE = getApiUrl();

  const resVisitados = await fetch(`${API_BASE}/usuarios/me/pueblos-visitados`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const visitadosRaw = resVisitados.ok ? await resVisitados.json() : { items: [] };
  const visitadosItems = Array.isArray(visitadosRaw?.items) ? visitadosRaw.items : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Accesos</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link className="underline" href="/mi-cuenta/pueblos">
              Mis pueblos visitados
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mi-cuenta/notificaciones">
              Notificaciones
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mi-cuenta/perfil">
              Mi perfil
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mi-cuenta/mapa">
              Mapa de mis pueblos
            </Link>
          </li>
          <li>
            <Link className="underline" href="/mi-cuenta/club">
              Club de Amigos
            </Link>
          </li>
        </ul>
      </section>

      <DashboardResumen
        nivelActual={data.nivelActual}
        siguienteNivel={data.siguienteNivel}
        puntosTotales={data.puntosTotales}
        progreso={data.progreso}
      />

      <DashboardPuntos puntosPorTipo={data.puntosPorTipo} />

      <DashboardFavoritos items={visitadosItems} />
    </main>
  );
}


