import { proxyToBackend } from '@/lib/proxy-helpers';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'PUT', `/admin/navidad/pueblos/by-pueblo/${puebloId}/info`);
}
