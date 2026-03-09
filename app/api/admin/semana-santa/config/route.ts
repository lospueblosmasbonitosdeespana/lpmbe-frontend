import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/admin/semana-santa/config');
}

export async function PUT(req: Request) {
  return proxyToBackend(req, 'PUT', '/admin/semana-santa/config');
}
