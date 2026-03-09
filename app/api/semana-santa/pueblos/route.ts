import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/semana-santa/pueblos', { auth: false });
}
