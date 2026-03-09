import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloSlug: string }> },
) {
  const { puebloSlug } = await params;
  return proxyToBackend(req, 'GET', `/semana-santa/pueblos/${puebloSlug}`, { auth: false });
}
