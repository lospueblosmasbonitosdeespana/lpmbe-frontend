import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

type Webcam = {
  id: number;
  puebloId: number;
  nombre: string;
  url: string;
  tipo?: string | null;
};

export default async function WebcamPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const API_BASE = getApiUrl();

  const pueblo = await getPuebloBySlug(slug).catch(() => null);
  if (!pueblo) {
    notFound();
  }

  const webcamsRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/webcams`, {
    cache: "no-store",
  });

  let webcams: Webcam[] = [];
  if (webcamsRes.ok) {
    try {
      webcams = await webcamsRes.json();
    } catch {
      // ignorar
    }
  }

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
    { label: "Webcam", href: `/pueblos/${pueblo.slug}/webcam` },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold">Webcam de {pueblo.nombre}</h1>
          <p className="mt-1 text-muted-foreground">
            Imagen en directo de las webcams del pueblo.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {webcams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-muted-foreground">
              Aún no hay webcams enlazadas para este pueblo.
            </p>
            <Link
              href={`/pueblos/${pueblo.slug}`}
              className="mt-4 inline-block text-primary hover:underline"
            >
              Volver al pueblo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1">
            {webcams.map((webcam) => (
              <div
                key={webcam.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="aspect-video w-full bg-muted">
                  <iframe
                    src={webcam.url}
                    title={webcam.nombre}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold">{webcam.nombre}</h2>
                  {webcam.tipo && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {webcam.tipo}
                    </p>
                  )}
                  <a
                    href={webcam.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    Ver webcam en nueva pestaña ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
