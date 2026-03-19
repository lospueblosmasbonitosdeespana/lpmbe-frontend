import { NextResponse } from "next/server";

/**
 * Warm-up para reducir cold starts (Railway) y TTFB alto en auditorías (URLs “rotas” = timeout/-1).
 * Vercel Cron: ver `vercel.json` y variable CRON_SECRET en el proyecto.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCronAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const secret = process.env.CRON_SECRET;
  if (secret) {
    return request.headers.get("authorization") === `Bearer ${secret}`;
  }
  // Sin CRON_SECRET, Vercel suele enviar este header en invocaciones programadas
  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const backend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://lospueblosmasbonitosdeespana.org";

  const t = 25_000;
  const tasks: Promise<unknown>[] = [
    fetch(`${site}/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(t),
      headers: { "user-agent": "LPMBE-cron-warm/1" },
    }).catch(() => null),
  ];
  if (backend) {
    tasks.push(
      fetch(`${backend}/ping`, {
        cache: "no-store",
        signal: AbortSignal.timeout(t),
        headers: { "user-agent": "LPMBE-cron-warm/1" },
      }).catch(() => null),
    );
  }
  await Promise.all(tasks);

  return NextResponse.json({
    ok: true,
    warmed: backend ? ["home", "backend-ping"] : ["home"],
  });
}
