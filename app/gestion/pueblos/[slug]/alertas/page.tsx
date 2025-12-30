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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Alertas del pueblo</h1>
        <p className="mt-1">Pueblo: <strong>{slug}</strong></p>
        <p className="mt-3">
          <Link href={`/gestion/pueblos/${slug}/alertas/nueva`} className="underline">+ Nueva alerta</Link>
        </p>
      </header>

      {alertasOrdenadas.length === 0 ? (
        <p className="py-4">No hay alertas todavía.</p>
      ) : (
        <div>
          {alertasOrdenadas.map((a) => (
            <AlertaItem key={a.id} alerta={a} slug={slug} />
          ))}
        </div>
      )}

      <div>
        <Link href={`/gestion/pueblos/${slug}`}>← Volver</Link>
      </div>
    </main>
  );
}
