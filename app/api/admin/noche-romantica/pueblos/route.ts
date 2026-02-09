import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /admin/noche-romantica/pueblos
export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/admin/noche-romantica/pueblos');
}

// POST /admin/noche-romantica/pueblos
export async function POST(req: Request) {
  return proxyToBackend(req, 'POST', '/admin/noche-romantica/pueblos');
}
