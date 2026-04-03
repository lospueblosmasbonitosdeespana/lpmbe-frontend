import Link from "next/link";
import { headers } from "next/headers";
import AlertaItem from "./AlertaItem.client";
import { GestionPuebloSubpageShell } from "../../_components/GestionPuebloSubpageShell";
import { HeroIconBell } from "../../_components/gestion-pueblo-hero-icons";

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
    <GestionPuebloSubpageShell
      slug={slug}
      title="Alertas del pueblo"
      subtitle={
        <>
          Avisos públicos para visitantes ·{" "}
          <span className="font-semibold text-white/95">{puebloNombre}</span>
        </>
      }
      heroIcon={<HeroIconBell />}
      heroAction={
        <Link
          href={`/gestion/pueblos/${slug}/alertas/nueva`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva alerta
        </Link>
      }
      heroBadges={
        <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <span className="text-lg font-bold">{count}</span>
          <span className="ml-1.5 text-xs text-white/70">{count === 1 ? "alerta" : "alertas"}</span>
        </div>
      }
    >
      {alertasOrdenadas.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-14 text-center ring-1 ring-slate-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-inner ring-1 ring-amber-200/50">
            <svg className="h-7 w-7 text-amber-600/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No hay alertas todavía</p>
          <p className="mt-1.5 mx-auto max-w-sm text-sm text-muted-foreground">
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
    </GestionPuebloSubpageShell>
  );
}
