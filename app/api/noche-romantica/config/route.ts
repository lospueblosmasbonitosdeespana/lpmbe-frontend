import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /noche-romantica/config (público)
export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/noche-romantica/config', { auth: false });
}
