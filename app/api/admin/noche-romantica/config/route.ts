import { proxyToBackend } from '@/lib/proxy-helpers';

// GET /admin/noche-romantica/config
export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/admin/noche-romantica/config');
}

// PUT /admin/noche-romantica/config
export async function PUT(req: Request) {
  return proxyToBackend(req, 'PUT', '/admin/noche-romantica/config');
}
