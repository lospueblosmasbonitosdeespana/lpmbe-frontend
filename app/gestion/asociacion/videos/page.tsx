import { getMeServer } from "@/lib/me";
import { redirect } from "next/navigation";
import VideosAsociacionClient from "./VideosAsociacionClient";

export const dynamic = "force-dynamic";

export default async function VideosAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect("/entrar");
  if (me.rol !== "ADMIN") redirect("/cuenta");

  return <VideosAsociacionClient />;
}
