import { proxyToBackend } from '@/lib/proxy-helpers';

export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', '/admin/navidad/pueblos');
}

export async function POST(req: Request) {
  return proxyToBackend(req, 'POST', '/admin/navidad/pueblos');
}
