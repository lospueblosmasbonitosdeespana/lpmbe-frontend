import { NextResponse } from 'next/server';

/**
 * Ruta requerida por el validador de tipos de Next.js.
 * El endpoint real es DELETE /api/admin/multiexperiencias/[mxId]/paradas/legacy/[legacyLugarId]
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Use DELETE /api/admin/multiexperiencias/[mxId]/paradas/legacy/[legacyLugarId]' },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Use DELETE /api/admin/multiexperiencias/[mxId]/paradas/legacy/[legacyLugarId]' },
    { status: 404 }
  );
}
