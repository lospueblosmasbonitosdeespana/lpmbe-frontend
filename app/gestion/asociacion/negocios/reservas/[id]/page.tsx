import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import ReservasNegocioClient from './ReservasNegocioClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nombre?: string; tipo?: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * Bandeja de solicitudes de reserva para un negocio concreto.
 * Acceso: ADMIN | ALCALDE (del pueblo del negocio) | COLABORADOR del negocio.
 * El nombre/tipo del negocio se pueden pasar como query params para no
 * tener que hacer un fetch adicional desde la página listado.
 */
export default async function ReservasNegocioPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { nombre, tipo } = await searchParams;
  const negocioId = Number(id);
  if (!Number.isFinite(negocioId) || negocioId <= 0) {
    redirect('/gestion/asociacion');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirect(`/entrar?next=/gestion/asociacion/negocios/reservas/${id}`);

  return (
    <ReservasNegocioClient
      negocioId={negocioId}
      negocioNombre={nombre || 'Negocio'}
      negocioTipo={tipo || null}
    />
  );
}
