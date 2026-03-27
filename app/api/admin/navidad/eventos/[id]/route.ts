import { proxyToBackend } from '@/lib/proxy-helpers';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, 'PUT', `/admin/navidad/eventos/${id}`);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, 'DELETE', `/admin/navidad/eventos/${id}`);
}
