import SelloCmsPage from '@/app/_components/ui/SelloCmsPage';
import type { SelloPage, CmsDocumento } from '@/lib/cms/sello';
import { CONTENIDO_CRITERIOS } from '@/lib/cms/sello-content';

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
    const docs = Array.isArray(data) ? data : [];
    return docs.filter((d: CmsDocumento) => d?.url && String(d.url).trim().length > 0);
  } catch {
    return [];
  }
}

function needsFallback(contenido: string): boolean {
  const c = (contenido ?? '').trim();
  return c.length < 300 || c.includes('Los criterios que aplicamos para evaluar');
}

export default async function CriteriosPage() {
  const [page, cartaCalidadDocs] = await Promise.all([getPage(), getCartaCalidadDocs()]);

  const titulo = page?.titulo ?? 'Criterios de evaluación';
  const subtitle = page?.subtitle ?? 'Resumen de la Carta de Calidad';
  const heroUrl = page?.heroUrl;
  const contenidoRaw = page?.contenido ?? '';
  const contenido = needsFallback(contenidoRaw) ? CONTENIDO_CRITERIOS : contenidoRaw;

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
        <div className="mt-12 space-y-8">
          {cartaCalidadDocs.map((doc) => {
            const url = String(doc.url).trim();
            if (!url) return null;
            return (
              <div key={doc.id} className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-2xl font-semibold mb-2">{doc.titulo}</h2>
                <p className="text-gray-600 mb-4">
                  Documento oficial de la Carta de Calidad firmada por los municipios.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    <span>📄</span>
                    Abrir PDF en nueva pestaña
                  </a>
                  <a
                    href={url}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Descargar PDF
                  </a>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Si el visor no carga el PDF, usa el botón «Abrir PDF en nueva pestaña».
                </p>
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden" style={{ minHeight: '500px' }}>
                  <iframe
                    src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                    title={doc.titulo}
                    className="w-full h-[600px] border-0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartaCalidadDocs.length === 0 && (
        <div className="mt-12 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            Para mostrar la Carta de Calidad en PDF, sube el documento en{' '}
            <strong>Gestión → Asociación → El Sello → Documentos</strong>, tipo «Carta de Calidad».
          </p>
        </div>
      )}
    </SelloCmsPage>
  );
}
