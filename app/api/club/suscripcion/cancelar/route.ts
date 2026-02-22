import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/club/suscripcion/cancelar
 * Cancela la renovación automática de la membresía del Club de Amigos.
 * La membresía sigue activa hasta la fecha de expiración actual.
 *
 * Cuando se integre Stripe, este endpoint cancelará la suscripción recurrente
 * via Stripe API (stripe.subscriptions.update con cancel_at_period_end: true).
 * Por ahora, delega al backend que marca cancelAutorenovacion=true en BD.
 */
export async function POST() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/suscripcion/cancelar`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Si el backend aún no tiene este endpoint (404/501), devolver respuesta controlada
    if (upstream.status === 404 || upstream.status === 501) {
      return NextResponse.json(
        { error: 'not_implemented', message: 'La cancelación de renovación estará disponible cuando se activen los pagos.' },
        { status: 501 }
      );
    }

    if (!upstream.ok) {
      const errorData = await upstream.json().catch(() => ({}));
      const errorText = errorData?.message ?? errorData?.error ?? 'Error';
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'upstream_fetch_failed', upstream: upstreamUrl },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: error?.message ?? 'Error interno' }, { status: 500 });
  }
}
