import { getMeServer } from "@/lib/me";
import { redirect } from "next/navigation";
import MultiexperienciasPuebloClient from "./MultiexperienciasPuebloClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MultiexperienciasPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect("/entrar");
  const isAdmin = me.rol === "ADMIN";
  return <MultiexperienciasPuebloClient slug={slug} isAdmin={isAdmin} />;
}
