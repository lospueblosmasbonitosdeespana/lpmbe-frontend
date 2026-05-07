export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((init?.headers as Record<string, string>) ?? {}) };
  const body = init?.json !== undefined ? JSON.stringify(init.json) : (init?.body as BodyInit | undefined);
  const res = await fetch(`/api/admin/grandes-eventos${path}`, {
    ...init,
    credentials: 'include',
    headers,
    body,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
