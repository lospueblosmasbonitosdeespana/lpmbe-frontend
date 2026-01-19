import Link from 'next/link';
import SelloCmsPage from '@/app/_components/ui/SelloCmsPage';
import type { SelloPage } from '@/lib/cms/sello';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_COMO_SE_OBTIENE`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ComoSeObtienePage() {
  const page = await getPage();

  const titulo = page?.titulo ?? '¿Cómo se obtiene el sello?';
  const subtitle = page?.subtitle;
  const heroUrl = page?.heroUrl;
  const contenido = page?.contenido ?? '';

  return (
    <SelloCmsPage
      titulo={titulo}
      subtitle={subtitle}
      heroUrl={heroUrl}
      contenido={contenido}
      breadcrumbs={[
        { label: 'El sello', href: '/el-sello' },
        { label: '¿Cómo se obtiene el sello?' },
      ]}
    >
      <div className="grid gap-8 md:grid-cols-2">
        <Link
          href="/el-sello/proceso"
          className="group block rounded-lg border border-gray-200 bg-white p-8 transition-all hover:border-gray-300 hover:shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
            Proceso de selección
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Conoce las etapas que debe superar un municipio desde la solicitud inicial 
            hasta la obtención definitiva del sello de calidad.
          </p>
          <span className="text-sm font-medium text-blue-600 group-hover:underline">
            Ver proceso →
          </span>
        </Link>

        <Link
          href="/el-sello/criterios"
          className="group block rounded-lg border border-gray-200 bg-white p-8 transition-all hover:border-gray-300 hover:shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
            Criterios de evaluación
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Descubre los estándares de calidad en patrimonio, urbanismo, paisaje y gestión 
            que deben cumplir los pueblos candidatos.
          </p>
          <span className="text-sm font-medium text-blue-600 group-hover:underline">
            Ver criterios →
          </span>
        </Link>
      </div>
    </SelloCmsPage>
  );
}
