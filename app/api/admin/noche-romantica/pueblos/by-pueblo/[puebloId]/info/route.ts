import { proxyToBackend } from '@/lib/proxy-helpers';

// PUT /admin/noche-romantica/pueblos/by-pueblo/:puebloId/info
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'PUT', `/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/info`);
}
