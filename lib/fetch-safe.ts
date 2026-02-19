/**
 * Fetch robusto con timeout y retry automático.
 * Diseñado para llamadas al backend (Railway) que pueden tardar por cold start.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
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

      if (res.status >= 502 && res.status <= 504 && attempt < retries) {
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
