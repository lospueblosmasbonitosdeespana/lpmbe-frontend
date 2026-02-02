import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
  patrimonio: { title: 'Patrimonio', category: 'PATRIMONIO' },
  'en-familia': { title: 'En familia', category: 'EN_FAMILIA' },
  petfriendly: { title: 'Petfriendly', category: 'PETFRIENDLY' },
};

type PuebloPages = {
  GASTRONOMIA?: TematicaPage;
  NATURALEZA?: TematicaPage;
  CULTURA?: TematicaPage;
  PATRIMONIO?: TematicaPage;
  EN_FAMILIA?: TematicaPage;
  PETFRIENDLY?: TematicaPage;
};

async function getPuebloPage(puebloSlug: string, category: string): Promise<TematicaPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/pueblos/${puebloSlug}/pages`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.warn(`[PUEBLO ${puebloSlug} ${category}] Backend respondió ${res.status}`);
      return null;
    }

    const data: PuebloPages = await res.json();
    return data[category as keyof PuebloPages] ?? null;
  } catch (error) {
    console.error(`[PUEBLO ${puebloSlug} ${category}] Error:`, error);
    return null;
  }
}

export default async function PuebloTematicaPage({
  params,
}: {
  params: Promise<{ slug: string; puebloSlug: string }>;
}) {
  const { slug, puebloSlug } = await params;
  const config = CATEGORY_MAP[slug];

  if (!config) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-gray-600">Categoría no encontrada</p>
      </main>
    );
  }

  const page = await getPuebloPage(puebloSlug, config.category);

  if (!page) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <Link href={`/experiencias/${slug}`} className="text-sm text-blue-600 hover:underline">
          ← Volver a {config.title}
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
        <h1 className="text-4xl font-semibold">{page.titulo}</h1>

        {page.coverUrl && page.coverUrl.trim() && (
          <div className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.coverUrl.trim()}
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
