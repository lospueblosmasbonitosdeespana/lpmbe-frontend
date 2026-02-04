import SelloCmsPage from '@/app/_components/ui/SelloCmsPage';
import type { SelloPage } from '@/lib/cms/sello';
import { CONTENIDO_PROCESO } from '@/lib/cms/sello-content';

export const dynamic = 'force-dynamic';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_PROCESO`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function needsFallback(contenido: string): boolean {
  const c = (contenido ?? '').trim();
  return c.length < 300 || c.includes('Conoce las etapas del proceso de certificación');
}

export default async function ProcesoPage() {
  const page = await getPage();

  const titulo = page?.titulo ?? 'Proceso de selección';
  const subtitle = page?.subtitle ?? 'Las tres etapas hasta obtener el Sello';
  const heroUrl = page?.heroUrl;
  const contenidoRaw = page?.contenido ?? '';
  const contenido = needsFallback(contenidoRaw) ? CONTENIDO_PROCESO : contenidoRaw;

  // DEBUG temporal
  if (process.env.NODE_ENV === 'development') {
    console.log('=== DEBUG PROCESO PAGE ===');
    console.log('contenidoRaw length:', contenidoRaw.length);
    console.log('needsFallback:', needsFallback(contenidoRaw));
    console.log('contenidoRaw preview:', contenidoRaw.substring(0, 200));
    console.log('=========================');
  }

  return (
    <SelloCmsPage
      titulo={titulo}
      subtitle={subtitle}
      heroUrl={heroUrl}
      contenido={contenido}
      breadcrumbs={[
        { label: 'El sello', href: '/el-sello' },
        { label: '¿Cómo se obtiene?', href: '/el-sello/como-se-obtiene' },
        { label: 'Proceso' },
      ]}
    />
  );
}
