import Link from 'next/link';
import Breadcrumbs from '@/app/_components/ui/Breadcrumbs';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { DOC_TYPE_LABELS } from '@/lib/cms/sello';
import type { SelloPage, CmsDocumento, CmsDocType } from '@/lib/cms/sello';

export const dynamic = 'force-dynamic';

const sections = [
  {
    title: '¿Cómo se obtiene el sello?',
    description: 'Conoce el proceso de selección y los criterios de evaluación para formar parte de la red.',
    href: '/el-sello/como-se-obtiene',
  },
  {
    title: 'Quiénes somos',
    description: 'Descubre nuestra misión, valores y la organización que impulsa la red.',
    href: '/el-sello/quienes-somos',
  },
  {
    title: 'Socios',
    description: 'Instituciones, colaboradores y entidades que forman parte de nuestro proyecto.',
    href: '/el-sello/socios',
  },
  {
    title: 'El sello en el mundo',
    description: 'La red internacional de los pueblos más bonitos y nuestra presencia global.',
    href: '/el-sello/internacional',
  },
  {
    title: 'Únete',
    description: 'Forma parte de Los Pueblos Más Bonitos de España como municipio o colaborador.',
    href: '/el-sello/unete',
  },
];

async function getSelloPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_HOME`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getDocumentos(): Promise<CmsDocumento[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/documentos`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const TIPOS_ORDEN: CmsDocType[] = ['ESTATUTOS', 'CARTA_CALIDAD', 'REGLAMENTO', 'MEMORIA', 'OTROS'];

function agruparPorTipo(docs: CmsDocumento[]): Record<CmsDocType, CmsDocumento[]> {
  const grupos = {} as Record<CmsDocType, CmsDocumento[]>;
  for (const t of TIPOS_ORDEN) {
    grupos[t] = docs.filter((d) => d.type === t);
  }
  return grupos;
}

export default async function ElSelloPage() {
  const page = await getSelloPage();
  const docs = await getDocumentos();
  const porTipo = agruparPorTipo(docs);

  const titulo = page?.titulo ?? 'El sello';
  const subtitle = page?.subtitle;
  const heroUrl = page?.heroUrl;
  const contenido = page?.contenido ?? '';

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'El sello' }]} />

      {/* Hero */}
      <div className="mb-16">
        {heroUrl && heroUrl.trim() && (
          <div className="mb-8 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroUrl.trim()}
              alt={titulo}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        <h1 className="text-5xl font-semibold mb-6">{titulo}</h1>
        
        {subtitle && (
          <p className="text-xl text-gray-600 mb-6">{subtitle}</p>
        )}

        {contenido && (
          <div className="mb-8">
            <SafeHtml html={contenido} />
          </div>
        )}
      </div>

      {/* Grid de secciones */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block rounded-lg border border-gray-200 bg-white p-8 transition-all hover:border-gray-300 hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
              {section.title}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {section.description}
            </p>
            <span className="text-sm font-medium text-blue-600 group-hover:underline">
              Más información →
            </span>
          </Link>
        ))}
      </div>

      {/* Documentación - todos los PDFs agrupados por tipo */}
      {docs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
          <h2 className="text-2xl font-semibold mb-6">Documentación</h2>
          <p className="text-gray-600 mb-6">
            Descarga los documentos oficiales de la asociación.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {TIPOS_ORDEN.map(
              (tipo) =>
                porTipo[tipo].length > 0 && (
                  <div key={tipo}>
                    <h3 className="text-lg font-semibold mb-3">
                      {DOC_TYPE_LABELS[tipo]}
                    </h3>
                    <ul className="space-y-2">
                      {porTipo[tipo].map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            📄 {doc.titulo}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </main>
  );
}
