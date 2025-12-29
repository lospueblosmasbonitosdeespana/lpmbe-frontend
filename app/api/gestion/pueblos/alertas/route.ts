import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const puebloSlug =
    url.searchParams.get("puebloSlug") ??
    url.searchParams.get("slug") ??
    "";

  if (!puebloSlug) {
    return NextResponse.json(
      { message: "Falta puebloSlug" },
      { status: 400 }
    );
  }

  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "No autenticado" },
      { status: 401 }
    );
  }

  const API_BASE = getApiUrl();

  // 1) Intento endpoint específico (si existe en backend)
  const specific = await fetch(`${API_BASE}/pueblos/${puebloSlug}/alertas`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (specific.ok) {
    const data = await specific.json();
    return NextResponse.json(data);
  }

  // Si NO es 404, no lo tragamos: devolvemos el error real
  if (specific.status !== 404) {
    const text = await specific.text().catch(() => "");
    return NextResponse.json(
      {
        message: "Error upstream (endpoint específico)",
        status: specific.status,
        body: text.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  // 2) Fallback a /notificaciones
  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        message: "Error upstream (/notificaciones)",
        status: upstream.status,
        body: text.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  const list = await upstream.json();

  const alertas = (Array.isArray(list) ? list : []).filter((n: any) => {
    const tipo = n.tipo ?? n.type;
    const slug =
      n.puebloSlug ??
      n.slug ??
      n.pueblo?.slug ??
      null;

    return tipo === "ALERTA_PUEBLO" && slug === puebloSlug;
  });

  return NextResponse.json(alertas);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const puebloSlug = body?.puebloSlug;
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';

  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });
  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });

  const API_BASE = getApiUrl();

  // 1) Intento endpoint por pueblo
  const upstream1 = await fetch(`${API_BASE}/pueblos/${puebloSlug}/alertas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ titulo, contenido: contenido || null }),
    cache: 'no-store',
  });

  if (upstream1.status !== 404) {
    const data = await upstream1.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream1.status });
  }

  // 2) Fallback /notificaciones
  const upstream2 = await fetch(`${API_BASE}/notificaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tipo: 'ALERTA_PUEBLO',
      puebloSlug,
      titulo,
      contenido: contenido || null,
    }),
    cache: 'no-store',
  });

  const data2 = await upstream2.json().catch(() => ({}));
  return NextResponse.json(data2, { status: upstream2.status });
}





