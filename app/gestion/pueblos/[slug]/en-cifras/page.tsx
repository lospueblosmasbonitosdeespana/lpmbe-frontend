import { getMeServer } from "@/lib/me";
import { getMisPueblosServer } from "@/lib/misPueblos";
import { getPuebloBySlug } from "@/lib/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import EnCifrasClient from "./EnCifrasClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EnCifrasPage({
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
    // El cliente puede mostrar error si hace falta
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600/90 dark:text-violet-400">
            En cifras
          </p>
          <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Patrimonio y tradición
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pueblo: <strong className="font-medium text-foreground">{pueblo?.nombre ?? slug}</strong>
          </p>
        </div>
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-lg text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          📊
        </span>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Los cuatro datos destacados del bloque «En cifras» en la{" "}
        <span className="font-medium text-foreground">ficha pública del pueblo</span>. Usa cifras o textos
        breves (altitud, siglo, habitantes…).
      </p>

      {!pueblo?.id ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No se pudo obtener el pueblo. Inténtalo de nuevo más tarde.
        </div>
      ) : (
        <EnCifrasClient puebloId={pueblo.id} slug={slug} puebloNombre={pueblo.nombre} />
      )}
    </main>
  );
}
