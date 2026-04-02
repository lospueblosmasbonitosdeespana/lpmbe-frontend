import Link from "next/link";
import { headers } from "next/headers";
import AlertaItem from "./AlertaItem.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Notif = {
  id: number;
  tipo: string;
  titulo: string;
  contenido: string;
  puebloSlug?: string | null;
  slug?: string | null;
  pueblo?: { slug?: string | null } | null;
  createdAt?: string;
};

function getPuebloSlug(n: Notif) {
  return n.puebloSlug || n.slug || n.pueblo?.slug || null;
}

function formatPuebloLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const cookie = h.get("cookie") ?? "";

  const url = new URL("/api/gestion/pueblos/alertas", baseUrl);
  url.searchParams.set("puebloSlug", slug);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.log("[ALERTAS PUEBLO] fetch FAIL", {
      url: url.toString(),
      status: res.status,
      body: body.slice(0, 500),
      hasCookie: cookie.length > 0,
    });
    throw new Error("Error cargando alertas");
  }

  const data = await res.json();
  const items: Notif[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

  const alertas = items.filter(
    (n) => n.tipo === "ALERTA_PUEBLO" && getPuebloSlug(n) === slug
  );

  const alertasOrdenadas = [...alertas].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  const puebloNombre = formatPuebloLabel(slug);
  const count = alertasOrdenadas.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/gestion/pueblos/${slug}`}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión del pueblo
      </Link>

      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white mb-8"
        style={{ background: "linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)" }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-inner">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Alertas del pueblo</h1>
                <p className="mt-0.5 text-sm text-white/80">
                  Avisos públicos para visitantes · <span className="font-semibold text-white/95">{puebloNombre}</span>
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/gestion/pueblos/${slug}/alertas/nueva`}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40 active:scale-95 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva alerta
          </Link>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 ring-1 ring-white/15">
            <span className="text-lg font-bold">{count}</span>
            <span className="ml-1.5 text-xs text-white/70">{count === 1 ? "alerta" : "alertas"}</span>
          </div>
        </div>
      </div>

      {alertasOrdenadas.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-14 text-center ring-1 ring-slate-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-inner ring-1 ring-amber-200/50">
            <svg className="h-7 w-7 text-amber-600/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No hay alertas todavía</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            Crea la primera para informar a los visitantes sobre incidencias, eventos o avisos del municipio.
          </p>
          <Link
            href={`/gestion/pueblos/${slug}/alertas/nueva`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Crear primera alerta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {alertasOrdenadas.map((a) => (
            <AlertaItem key={a.id} alerta={a} slug={slug} />
          ))}
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-border/60">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}
