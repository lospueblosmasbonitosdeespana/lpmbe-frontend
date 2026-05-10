import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** POST /api/preload-validation/[token]/approve — público. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const body = await req.text();
  const res = await fetch(
    `${getApiUrl()}/preload-validation/${token}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body || '{}',
      cache: 'no-store',
    },
  );
  const text = await res.text();
  return new NextResponse(text || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
