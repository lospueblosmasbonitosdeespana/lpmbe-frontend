/**
 * Fetch robusto con timeout y retry automático.
 * Diseñado para llamadas al backend (Railway) que pueden tardar por cold start.
 *
 * Límites seguros para Vercel (maxDuration: 30s en vercel.json):
 *   - DEFAULT_TIMEOUT_MS = 8s por intento
 *   - MAX_RETRIES = 1 (2 intentos máximo)
 *   - Peor caso total: 2 × 8s + 0.8s delay = ~17s → bien dentro de los 30s
 */

const DEFAULT_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 800;
const MAX_RETRIES = 1;

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit & { timeoutMs?: number; retries?: number },
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES, ...fetchInit } = init ?? {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Retry transient server/rate-limit responses common during crawls.
      if ((res.status === 429 || (res.status >= 500 && res.status <= 504)) && attempt < retries) {
        await delay(RETRY_DELAY_MS);
        continue;
      }

      return res;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      if (attempt < retries) {
        await delay(RETRY_DELAY_MS);
        continue;
      }
    }
  }

  throw lastError ?? new Error(`Fetch failed after ${retries + 1} attempts: ${url}`);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
