import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/me";
import GlobalPromotionClient from "./GlobalPromotionClient";

export const dynamic = "force-dynamic";

export default async function GlobalPromotionPage() {
  const me = await getMeServer();

  if (!me) redirect("/entrar");
  if (me.rol !== "ADMIN") redirect("/cuenta");

  return <GlobalPromotionClient />;
}
