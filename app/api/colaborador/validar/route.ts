import { proxyToBackend } from '@/lib/proxy-helpers';

export async function POST(req: Request) {
  return proxyToBackend(req, 'POST', '/club/validador/scan');
}
