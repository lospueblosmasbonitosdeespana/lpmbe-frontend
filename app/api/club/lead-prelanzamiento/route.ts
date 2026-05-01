import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${getApiUrl()}/club/lead-prelanzamiento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}

