import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token?.trim();
  const password = body?.password;

  if (!token || !password) {
    return NextResponse.json(
      { message: 'Token y contraseña requeridos' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[reset-password] proxy error:', err);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
