import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import MisReservasClient from './MisReservasClient';

export const dynamic = 'force-dynamic';

export default async function MisReservasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) redirect('/entrar?next=/mi-cuenta/reservas');

  const t = await getTranslations('reservas');
  return (
    <MisReservasClient
      labels={{
        titulo: t('mias.titulo'),
        subtitulo: t('mias.subtitulo'),
        vacio: t('mias.vacio'),
        volver: t('mias.volver'),
        cancelar: t('mias.cancelar'),
        cancelarConfirm: t('mias.cancelarConfirm'),
        verNegocio: t('mias.verNegocio'),
        socio: t('mias.socio'),
        beneficio: t('exito.socio.beneficioLabel'),
        estado: {
          PENDIENTE: t('estado.PENDIENTE'),
          CONFIRMADA: t('estado.CONFIRMADA'),
          RECHAZADA: t('estado.RECHAZADA'),
          CANCELADA: t('estado.CANCELADA'),
          NO_SHOW: t('estado.NO_SHOW'),
          COMPLETADA: t('estado.COMPLETADA'),
        },
        notaNegocio: t('mias.notaNegocio'),
      }}
    />
  );
}
