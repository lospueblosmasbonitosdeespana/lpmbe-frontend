import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /admin/noche-romantica/pueblos/by-pueblo/:puebloId
export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'GET', `/admin/noche-romantica/pueblos/by-pueblo/${puebloId}`);
}
