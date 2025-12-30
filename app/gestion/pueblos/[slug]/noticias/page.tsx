import Link from "next/link";
import NoticiasList from "./NoticiasList.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Noticias</h1>
        <p className="mt-1">
          Pueblo: <strong>{slug}</strong>
        </p>
        <p className="mt-3">
          <Link
            href={`/gestion/pueblos/${slug}/noticias/nueva`}
            className="underline"
          >
            + Nueva noticia
          </Link>
        </p>
      </header>

      <NoticiasList puebloSlug={slug} />

      <div className="mt-6">
        <Link href={`/gestion/pueblos/${slug}`} className="underline">
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}

