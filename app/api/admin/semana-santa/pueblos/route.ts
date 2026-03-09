import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/admin/semana-santa/pueblos');
}

export async function POST(req: Request) {
  return proxyToBackend(req, 'POST', '/admin/semana-santa/pueblos');
}
