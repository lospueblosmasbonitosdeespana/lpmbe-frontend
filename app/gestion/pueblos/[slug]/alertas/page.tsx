import Link from "next/link";
import { headers } from "next/headers";

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

  const alertas = items
    .filter((n) => n.tipo === "ALERTA_PUEBLO" && getPuebloSlug(n) === slug)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Alertas del pueblo</h1>
          <div className="mt-2 text-lg text-gray-600">
            Pueblo: <span className="font-semibold text-gray-900">{slug}</span>
          </div>
        </div>

        <Link
          href={`/gestion/pueblos/${slug}/alertas/nueva`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-900 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-50"
        >
          + Nueva alerta
        </Link>
      </div>

      <div className="mt-8">
        {alertas.length === 0 ? (
          <div className="rounded-xl border border-slate-300 bg-white px-6 py-5 text-gray-700">
            No hay alertas todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-300 bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-lg font-bold text-gray-900">{a.titulo}</div>
                  {a.createdAt ? (
                    <div className="whitespace-nowrap text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleString("es-ES")}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-gray-900">{a.contenido}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href={`/gestion/pueblos/${slug}`} className="font-semibold text-gray-900 hover:underline">
          ← Volver
        </Link>
      </div>
    </div>
  );
}
