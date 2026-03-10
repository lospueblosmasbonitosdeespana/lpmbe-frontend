import { headers } from "next/headers";
import { redirect } from "next/navigation";

const APP_STORE_URL =
  "https://apps.apple.com/es/app/los-pueblos-m%C3%A1s-bonitos-de-esp/id6755147967";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=app.rork.pueblos_bonitos_app";

export const dynamic = "force-dynamic";

function detectPlatform(userAgent: string): "ios" | "android" | "other" {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

export default async function AppRedirectPage() {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? "";
  const platform = detectPlatform(userAgent);

  if (platform === "ios") redirect(APP_STORE_URL);
  if (platform === "android") redirect(PLAY_STORE_URL);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Descargar app oficial</h1>
      <p className="mt-3 text-muted-foreground">
        Elige tu tienda para descargar la app de Los Pueblos Mas Bonitos de
        Espana.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <a
          href={APP_STORE_URL}
          className="rounded-lg bg-black px-4 py-3 text-center text-white"
        >
          App Store
        </a>
        <a
          href={PLAY_STORE_URL}
          className="rounded-lg bg-primary px-4 py-3 text-center text-primary-foreground"
        >
          Google Play
        </a>
      </div>
    </main>
  );
}
