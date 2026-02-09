import { proxyToBackend } from '@/lib/proxy-helpers';

// POST /admin/noche-romantica/pueblos/by-pueblo/:puebloId/negocios
export async function POST(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const { puebloId } = await params;
  return proxyToBackend(req, 'POST', `/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/negocios`);
}
