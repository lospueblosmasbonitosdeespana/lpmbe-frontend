import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import DashboardResumen from '../components/DashboardResumen';
import DashboardPuntos from '../components/DashboardPuntos';
import DashboardFavoritos from '../components/DashboardFavoritos';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const token = await getToken();
  const t = await getTranslations('points');

  if (!token) {
    redirect('/entrar');
  }

  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/usuarios/me/puntos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/entrar');
  }

  if (!res.ok) {
    throw new Error(t('dashboardError'));
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
      ? {
          nombre: String(raw.nivel_siguiente),
          nivel: 0,
          puntos_necesarios: Number(raw.puntos_necesarios ?? 0),
        }
      : null,
    progreso: Number(raw.progreso ?? 0),
  };

  return data;
}

export default async function PuntosPage() {
  const data = await getDashboardData();
  const token = await getToken();

  if (!token) {
    redirect('/entrar');
  }

  const API_BASE = getApiUrl();

  const resVisitados = await fetch(`${API_BASE}/usuarios/me/pueblos-visitados`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const visitadosRaw = resVisitados.ok ? await resVisitados.json() : { items: [] };
  const visitadosItems = Array.isArray(visitadosRaw?.items) ? visitadosRaw.items : [];

  return (
    <main>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative py-8 lg:py-12">
            <div className="space-y-8">
              <DashboardResumen
                nivelActual={data.nivelActual}
                siguienteNivel={data.siguienteNivel}
                puntosTotales={data.puntosTotales}
                progreso={data.progreso}
              />

              <DashboardPuntos puntosPorTipo={data.puntosPorTipo} />

              <DashboardFavoritos items={visitadosItems} />
            </div>
          </Container>
        </div>
      </Section>
    </main>
  );
}






















