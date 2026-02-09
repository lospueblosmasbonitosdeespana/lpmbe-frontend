import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /noche-romantica/pueblos/:puebloSlug (público)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloSlug: string }> },
) {
  const { puebloSlug } = await params;
  return proxyToBackend(req, 'GET', `/noche-romantica/pueblos/${puebloSlug}`, { auth: false });
}
