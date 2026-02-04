import { NextResponse } from 'next/server';

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  await params;
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 }
  );
}
