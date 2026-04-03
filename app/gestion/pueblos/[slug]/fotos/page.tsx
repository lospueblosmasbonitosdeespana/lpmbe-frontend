import PhotoManager from "@/app/components/PhotoManager";
import { getMeServer } from "@/lib/me";
import { getMisPueblosServer } from "@/lib/misPueblos";
import { getPuebloBySlug } from "@/lib/api";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FotosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const me = await getMeServer();
  if (!me) redirect("/entrar");
  if (me.rol !== "ALCALDE" && me.rol !== "ADMIN" && me.rol !== "EDITOR") {
    redirect("/cuenta");
  }

  if (me.rol === "ALCALDE") {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect("/gestion/mis-pueblos");
  }

  let pueblo: { id: number; nombre: string } | null = null;
  try {
    const raw = await getPuebloBySlug(slug);
    if (raw?.id) {
      pueblo = { id: raw.id, nombre: raw.nombre ?? slug };
    }
  } catch {
    // mensaje abajo
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-600/90 dark:text-pink-400">
            Imagen y vídeo
          </p>
          <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Fotos del pueblo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pueblo:{" "}
            <strong className="font-medium text-foreground">{pueblo?.nombre ?? slug}</strong>
          </p>
        </div>
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-lg text-pink-800 dark:bg-pink-500/15 dark:text-pink-200">
          🖼️
        </span>
      </div>

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Sube y ordena la <span className="font-medium text-foreground">galería</span> de la ficha pública, rotaciones y textos
        alternativos. La primera imagen puede usarse como destacada según la configuración del sitio.
      </p>

      {!pueblo?.id ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No se pudo cargar el pueblo. Inténtalo de nuevo más tarde.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6">
            <h2 className="text-sm font-semibold text-foreground">Galería e imágenes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arrastra para reordenar. Los cambios se guardan desde los controles de cada foto.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <PhotoManager entity="pueblo" entityId={pueblo.id} useAdminEndpoint={true} />
          </div>
        </div>
      )}

      {pueblo?.id && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link
            href={`/pueblos/${slug}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver ficha pública de {pueblo.nombre}
          </Link>
        </p>
      )}
    </main>
  );
}
