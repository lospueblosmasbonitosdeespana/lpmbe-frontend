import { proxyToBackend } from '@/lib/proxy-helpers';

function backendPath(params: { path: string[] }) {
  return `/admin/grandes-eventos/${params.path.join('/')}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, 'GET', backendPath(await params));
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, 'POST', backendPath(await params));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, 'PATCH', backendPath(await params));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, 'DELETE', backendPath(await params));
}
