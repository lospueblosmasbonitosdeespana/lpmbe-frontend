import { proxyToBackend } from '@/lib/proxy-helpers';

// PUT /admin/noche-romantica/actividades/:id
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, 'PUT', `/admin/noche-romantica/actividades/${id}`);
}

// DELETE /admin/noche-romantica/actividades/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, 'DELETE', `/admin/noche-romantica/actividades/${id}`);
}
