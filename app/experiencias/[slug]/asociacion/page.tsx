import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TematicaPage = {
  id: number;
  titulo: string;
  contenido: string;
  coverUrl?: string | null;
};

type CategoryConfig = {
  title: string;
  category: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  gastronomia: { title: 'Gastronomía', category: 'GASTRONOMIA' },
  naturaleza: { title: 'Naturaleza', category: 'NATURALEZA' },
  cultura: { title: 'Cultura', category: 'CULTURA' },
  'en-familia': { title: 'En familia', category: 'EN_FAMILIA' },
  petfriendly: { title: 'Petfriendly', category: 'PETFRIENDLY' },
};

async function getAsociacionPage(category: string): Promise<TematicaPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/pages?category=${category}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.warn(`[ASOCIACION ${category}] Backend respondió ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.asociacion ?? null;
  } catch (error) {
    console.error(`[ASOCIACION ${category}] Error:`, error);
    return null;
  }
}

export default async function AsociacionTematicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = CATEGORY_MAP[slug];

  if (!config) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-gray-600">Categoría no encontrada</p>
      </main>
    );
  }

  const page = await getAsociacionPage(config.category);

  if (!page) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <Link href={`/experiencias/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Volver
        </Link>
        <p className="mt-4 text-gray-600">Contenido no disponible</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link href={`/experiencias/${slug}`} className="text-sm text-blue-600 hover:underline">
        ← Volver a {config.title}
      </Link>

      <article className="mt-8">
        <div className="mb-2 inline-block rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
          Asociación
        </div>
        
        <h1 className="mt-2 text-4xl font-semibold">{page.titulo}</h1>

        {page.coverUrl && (
          <div className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.coverUrl}
              alt={page.titulo}
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: '500px' }}
            />
          </div>
        )}

        <div className="prose prose-gray prose-lg max-w-none">
          <ReactMarkdown>{page.contenido}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
