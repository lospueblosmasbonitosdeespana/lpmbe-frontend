import { proxyToBackend } from '@/lib/proxy-helpers';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'POST', `/admin/navidad/pueblos/by-pueblo/${puebloId}/eventos`);
}
