import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

/**
 * Helper genérico para proxy de API: reenvía la petición al backend y devuelve la respuesta.
 * Incluye timeout de 15 s y 1 retry automático en 502/503/504 o error de red.
 */
export async function proxyToBackend(
  req: Request,
  method: string,
  backendPath: string,
  options: { auth?: boolean; parseBody?: boolean } = {},
) {
  const { auth = true, parseBody = true } = options;

  let token: string | null = null;
  if (auth) {
    token = await getToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: string | undefined;
  if (parseBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
    const raw = await req.json().catch(() => null);
    if (raw !== null) body = JSON.stringify(raw);
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}${backendPath}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const upstream = await fetchWithTimeout(upstreamUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      let errBody: Record<string, unknown> = { error: text };
      try {
        const parsed = JSON.parse(text);
        errBody = typeof parsed === 'object' && parsed !== null
          ? { ...parsed, error: parsed.error ?? parsed.message ?? text }
          : errBody;
      } catch { /* keep errBody */ }
      return NextResponse.json(errBody, { status: upstream.status });
    }

    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'upstream_timeout', upstream: upstreamUrl, detail: 'La petición al backend superó el tiempo de espera' },
        { status: 504 },
      );
    }
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'upstream_fetch_failed', upstream: upstreamUrl, detail: error?.message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: error?.message ?? 'Error interno', upstream: upstreamUrl },
      { status: 500 },
    );
  }
}
