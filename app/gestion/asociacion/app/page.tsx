import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconSmartphone } from '../_components/asociacion-hero-icons';

export default async function AppGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="App"
      subtitle="Pop-ups, ofertas y página /app en la web · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconSmartphone />}
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-4">
        <Link
          href="/gestion/asociacion/app/pagina-web"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Página app en la web</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Contenido público de /app: textos, capturas y enlaces App Store y Google Play.
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/app/promos"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Pop-ups y ofertas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crear pop-ups, fechas, home o al abrir, frecuencia y retraso.
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/app/evento-activo"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Evento activo del botón estacional</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Semana Santa, Noche Romántica o Navidad en la home de la app.
          </p>
        </Link>
      </div>
    </GestionAsociacionSubpageShell>
  );
}
