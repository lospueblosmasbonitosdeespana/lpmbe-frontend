import Link from 'next/link';

export const dynamic = 'force-dynamic';

type TematicaPage = {
  id: number;
  titulo: string;
  resumen?: string | null;
  coverUrl?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
    provincia?: string;
    comunidad?: string;
  };
};

type CategoryConfig = {
  title: string;
  description: string;
  category: string;
  tabSlug: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  gastronomia: {
    title: 'Gastronomía',
    description: 'Descubre la riqueza culinaria de nuestros pueblos',
    category: 'GASTRONOMIA',
    tabSlug: 'gastronomia',
  },
  naturaleza: {
    title: 'Naturaleza',
    description: 'Experiencias en entornos naturales únicos',
    category: 'NATURALEZA',
    tabSlug: 'naturaleza',
  },
  cultura: {
    title: 'Cultura',
    description: 'Patrimonio cultural e histórico de nuestros pueblos',
    category: 'CULTURA',
    tabSlug: 'cultura',
  },
  'en-familia': {
    title: 'En familia',
    description: 'Actividades y experiencias para disfrutar en familia',
    category: 'EN_FAMILIA',
    tabSlug: 'en-familia',
  },
  petfriendly: {
    title: 'Petfriendly',
    description: 'Pueblos y experiencias que dan la bienvenida a tus mascotas',
    category: 'PETFRIENDLY',
    tabSlug: 'petfriendly',
  },
};

async function getTematicaPages(category: string): Promise<{ asociacion: TematicaPage | null; pueblos: TematicaPage[] }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/pages?category=${category}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.warn(`[TEMATICA ${category}] Backend respondió ${res.status}`);
      return { asociacion: null, pueblos: [] };
    }

    const data = await res.json();
    
    // Backend devuelve { asociacion, pueblos }
    const asociacion = data?.asociacion ?? null;
    const pueblos = Array.isArray(data?.pueblos) ? data.pueblos : [];
    
    return { asociacion, pueblos };
  } catch (error) {
    console.error(`[TEMATICA ${category}] Error:`, error);
    return { asociacion: null, pueblos: [] };
  }
}

export default async function TematicaPage({
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

  const { asociacion, pueblos } = await getTematicaPages(config.category);

  // Agrupar pueblos por CCAA
  const byCCAA = pueblos.reduce((acc, item) => {
    const ccaa = item.pueblo?.comunidad ?? 'Sin comunidad';
    acc[ccaa] = acc[ccaa] || [];
    acc[ccaa].push(item);
    return acc;
  }, {} as Record<string, TematicaPage[]>);

  // Ordenar comunidades alfabéticamente
  const comunidades = Object.keys(byCCAA).sort((a, b) => a.localeCompare(b, 'es'));

  const isEmpty = !asociacion && pueblos.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">{config.title}</h1>
        <p className="mt-2 text-gray-600">{config.description}</p>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No hay experiencias disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Bloque ASOCIACIÓN (si existe) */}
          {asociacion && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Asociación</h2>
              
              <Link
                href={`/experiencias/${slug}/asociacion`}
                className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
              >
                {asociacion.coverUrl && asociacion.coverUrl.trim() && (
                  <div className="h-64 w-full overflow-hidden rounded-t-lg bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asociacion.coverUrl.trim()}
                      alt={asociacion.titulo}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">{asociacion.titulo}</h3>
                  {asociacion.resumen && (
                    <p className="mt-2 text-gray-600">{asociacion.resumen}</p>
                  )}
                  <p className="mt-4 text-sm text-blue-600">Leer más →</p>
                </div>
              </Link>
            </section>
          )}

          {/* Bloques por CCAA (pueblos) */}
          {comunidades.map((ccaa) => {
            const itemsCCAA = byCCAA[ccaa];

            return (
              <section key={ccaa}>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">{ccaa}</h2>

                {/* Grid de cards - 5 cols desktop, 6 en 2xl */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {itemsCCAA.map((item) => {
                    const href = `/experiencias/${slug}/pueblos/${item.pueblo!.slug}`;

                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="block overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                      >
                        {/* Imagen */}
                        {item.coverUrl && item.coverUrl.trim() ? (
                          <div className="h-28 w-full overflow-hidden rounded-t-lg bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.coverUrl.trim()}
                              alt={item.titulo}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-28 w-full rounded-t-lg bg-gray-200" />
                        )}

                        {/* Contenido */}
                        <div className="p-2.5">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                            {item.titulo}
                          </h3>

                          <p className="mt-1 text-xs text-gray-600">
                            {item.pueblo!.nombre}
                            {item.pueblo!.provincia && ` (${item.pueblo!.provincia})`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
