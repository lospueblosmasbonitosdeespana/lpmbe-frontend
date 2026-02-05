import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ContactoPrivacidadClient from './ContactoPrivacidadClient';

export const dynamic = 'force-dynamic';

export default async function ContactoPrivacidadPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Contacto, privacidad y otros</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edita los datos de contacto y el contenido de las páginas estáticas (privacidad, aviso legal, cookies).
      </p>

      <ContactoPrivacidadClient />

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/gestion/asociacion">
          ← Volver a gestión
        </Link>
      </div>
    </main>
  );
}
