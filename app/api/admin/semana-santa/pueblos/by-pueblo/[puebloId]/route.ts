import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'GET', `/admin/semana-santa/pueblos/by-pueblo/${puebloId}`);
}
