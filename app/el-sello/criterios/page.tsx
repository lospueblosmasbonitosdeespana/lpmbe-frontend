import SelloCmsPage from '@/app/_components/ui/SelloCmsPage';
import type { SelloPage, CmsDocumento } from '@/lib/cms/sello';

export const dynamic = 'force-dynamic';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_CRITERIOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getCartaCalidadDocs(): Promise<CmsDocumento[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/documentos?type=CARTA_CALIDAD`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function CriteriosPage() {
  const [page, cartaCalidadDocs] = await Promise.all([getPage(), getCartaCalidadDocs()]);

  const titulo = page?.titulo ?? 'Criterios de evaluación';
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
        { label: '¿Cómo se obtiene?', href: '/el-sello/como-se-obtiene' },
        { label: 'Criterios' },
      ]}
    >
      {cartaCalidadDocs.length > 0 && (
        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-8">
          <h2 className="text-2xl font-semibold mb-4">Carta de Calidad (PDF)</h2>
          <p className="text-gray-600 mb-6">
            Descarga el documento oficial de la Carta de Calidad firmada por los municipios.
          </p>
          <ul className="space-y-3">
            {cartaCalidadDocs.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-blue-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <span className="text-xl">📄</span>
                  <span className="font-medium">{doc.titulo}</span>
                  <span className="text-sm text-gray-500">(PDF)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SelloCmsPage>
  );
}
