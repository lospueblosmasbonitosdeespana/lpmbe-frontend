import { proxyToBackend } from '@/lib/proxy-helpers';

const PATH = '/admin/grandes-eventos';

export async function GET(req: Request) {
  return proxyToBackend(req, 'GET', PATH);
}

export async function POST(req: Request) {
  return proxyToBackend(req, 'POST', PATH);
}
