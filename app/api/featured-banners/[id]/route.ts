import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
