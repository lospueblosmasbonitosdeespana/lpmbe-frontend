import { getMeServer } from "@/lib/me";
import { getMisPueblosServer } from "@/lib/misPueblos";
import { getPuebloBySlug } from "@/lib/api";
import { redirect } from "next/navigation";
import VideosPuebloClient from "./VideosPuebloClient";

export const dynamic = "force-dynamic";

export default async function VideosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect("/entrar");
  if (me.rol !== "ALCALDE" && me.rol !== "ADMIN") redirect("/cuenta");

  if (me.rol === "ALCALDE") {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect("/gestion/mis-pueblos");
  }

  const pueblo = await getPuebloBySlug(slug);
  return (
    <VideosPuebloClient
      slug={slug}
      puebloId={pueblo.id}
      puebloNombre={pueblo.nombre}
    />
  );
}
