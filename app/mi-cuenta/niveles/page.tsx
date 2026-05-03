import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { redirect } from 'next/navigation';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import NivelesDetalle from './NivelesDetalle';

export const dynamic = 'force-dynamic';

async function getData() {
  const token = await getToken();
  if (!token) redirect('/entrar');

  const API_BASE = getApiUrl();

  const [resNiveles, resPuntos] = await Promise.all([
    fetch(`${API_BASE}/gamificacion/niveles`, { cache: 'no-store' }),
    fetch(`${API_BASE}/usuarios/me/puntos`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ]);

  const niveles = resNiveles.ok ? await resNiveles.json() : [];
  const puntos = resPuntos.ok ? await resPuntos.json() : { total: 0 };

  return { niveles, puntosTotales: Number(puntos?.total ?? 0) };
}

export default async function NivelesPage() {
  const { niveles, puntosTotales } = await getData();

  return (
    <main>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative py-8 lg:py-12">
            <NivelesDetalle niveles={niveles} puntosTotales={puntosTotales} />
          </Container>
        </div>
      </Section>
    </main>
  );
}
