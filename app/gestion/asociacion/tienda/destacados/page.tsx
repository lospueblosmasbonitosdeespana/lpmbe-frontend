import { getMeServer } from "@/lib/me";
import { redirect } from "next/navigation";
import FeaturedBannersAdminClient from "./FeaturedBannersAdminClient";

export default async function FeaturedBannersPage() {
  const me = await getMeServer();
  if (!me) redirect("/entrar");
  if (me.rol !== "ADMIN") redirect("/cuenta");

  return <FeaturedBannersAdminClient />;
}
