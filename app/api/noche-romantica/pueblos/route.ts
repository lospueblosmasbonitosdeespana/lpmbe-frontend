import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /noche-romantica/pueblos (público)
export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/noche-romantica/pueblos', { auth: false });
}
