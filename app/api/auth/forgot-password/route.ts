import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json({ message: 'Email requerido' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[forgot-password] proxy error:', err);
    return NextResponse.json({ ok: true }); // no revelar errores internos
  }
}
