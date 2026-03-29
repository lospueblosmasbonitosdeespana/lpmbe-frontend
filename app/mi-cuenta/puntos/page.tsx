import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import DashboardResumen from '../components/DashboardResumen';
import DashboardPuntos from '../components/DashboardPuntos';
import DashboardFavoritos from '../components/DashboardFavoritos';
import DashboardLogros from '../components/DashboardLogros';

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

  const pueblosPuntos = Array.isArray(raw?.pueblosPuntos)
    ? raw.pueblosPuntos.map((p: any) => ({
        puebloId: p.puebloId,
        nombre: String(p.nombre ?? ''),
        provincia: String(p.provincia ?? ''),
        comunidad: String(p.comunidad ?? ''),
        puntos: Number(p.puntos ?? 0),
        canjeable: Boolean(p.canjeable),
        origenVisita: p.origenVisita ?? null,
      }))
    : [];

  const desglose = raw?.desglose ?? {};

  const data = {
    puntosTotales: Number(raw?.total ?? 0),
    puntosCanjeables: Number(raw?.puntosCanjeables ?? 0),
    puntosNoCanjeables: Number(raw?.puntosNoCanjeables ?? 0),
    desglose: {
      visitasGPS: {
        puntos: Number(desglose?.visitasGPS?.puntos ?? 0),
        count: Number(desglose?.visitasGPS?.count ?? 0),
        canjeable: true,
      },
      visitasManuales: {
        puntos: Number(desglose?.visitasManuales?.puntos ?? 0),
        count: Number(desglose?.visitasManuales?.count ?? 0),
        canjeable: false,
      },
      clubRecurso: {
        puntos: Number(desglose?.clubRecurso?.puntos ?? 0),
        count: Number(desglose?.clubRecurso?.count ?? 0),
        canjeable: true,
      },
      clubNegocio: {
        puntos: Number(desglose?.clubNegocio?.puntos ?? 0),
        count: Number(desglose?.clubNegocio?.count ?? 0),
        canjeable: true,
      },
      compraTienda: {
        puntos: Number(desglose?.compraTienda?.puntos ?? 0),
        count: Number(desglose?.compraTienda?.count ?? 0),
        canjeable: true,
      },
      logros: {
        puntos: Number(desglose?.logros?.puntos ?? 0),
        count: Number(desglose?.logros?.count ?? 0),
        canjeable: false,
      },
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
    pueblosPuntos,
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
                puntosCanjeables={data.puntosCanjeables}
                puntosNoCanjeables={data.puntosNoCanjeables}
                progreso={data.progreso}
              />

              <DashboardPuntos
                desglose={data.desglose}
                pueblosPuntos={data.pueblosPuntos}
              />

              <DashboardLogros />

              <DashboardFavoritos items={visitadosItems} />
            </div>
          </Container>
        </div>
      </Section>
    </main>
  );
}
