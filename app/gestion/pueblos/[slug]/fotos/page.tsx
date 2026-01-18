import PhotoManager from "@/app/components/PhotoManager";
import { getMeServer } from "@/lib/me";
import { getMisPueblosServer } from "@/lib/misPueblos";
import { redirect } from "next/navigation";

export default async function FotosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Auth check
  const me = await getMeServer();
  if (!me) redirect("/entrar");
  if (me.rol !== "ALCALDE" && me.rol !== "ADMIN") redirect("/cuenta");

  // Si es ALCALDE, verificar que el pueblo está en su lista
  if (me.rol === "ALCALDE") {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect("/gestion/mis-pueblos");
  }

  // Obtener ID del pueblo
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Error</h1>
        <p>No se pudo cargar el pueblo.</p>
      </div>
    );
  }

  const pueblo = await res.json();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}>
          Fotos del pueblo
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
          {pueblo.nombre}
        </p>
      </div>

      <PhotoManager entity="pueblo" entityId={pueblo.id} />
    </div>
  );
}
