import { getTranslations } from 'next-intl/server';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ConfirmarReservaPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const t = await getTranslations('reservas.confirmar');

  let ok = false;
  let mensaje = '';

  if (!token) {
    mensaje = t('sinToken');
  } else {
    try {
      const backendUrl = process.env.BACKEND_URL || 'https://lpmbe-backend-production.up.railway.app';
      const res = await fetch(`${backendUrl}/reservas/confirmar/${token}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        ok = true;
        mensaje = data.mensaje || t('confirmadoOk');
      } else {
        mensaje = data.message || t('tokenInvalido');
      }
    } catch {
      mensaje = t('errorConexion');
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: ok ? '#dcfce7' : '#fee2e2' }}>
          {ok ? (
            <CheckCircle2 className="text-emerald-600" size={32} />
          ) : (
            <XCircle className="text-red-500" size={32} />
          )}
        </div>

        <h1 className="text-2xl font-serif text-stone-900 mb-3">
          {ok ? t('tituloOk') : t('tituloError')}
        </h1>
        <p className="text-stone-600 mb-8">{mensaje}</p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
        >
          {t('volver')}
        </Link>
      </div>
    </main>
  );
}
