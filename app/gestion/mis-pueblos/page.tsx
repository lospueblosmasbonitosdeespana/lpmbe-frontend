import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getAllPueblosServer } from '@/lib/pueblosAdmin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GestionPortalHero, type GestionPortalRoleTone } from '../_components/GestionPortalHero';
import MisPueblosListClient from '../_components/MisPueblosListClient';

function rolToHeroTone(rol: string): GestionPortalRoleTone {
  if (rol === 'ALCALDE') return 'alcalde';
  if (rol === 'ADMIN') return 'admin';
  return 'editor';
}

export default async function MisPueblosGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  const pueblos =
    me.rol === 'ADMIN' || me.rol === 'EDITOR'
      ? await getAllPueblosServer()
      : await getMisPueblosServer();

  const title = me.rol === 'ADMIN' || me.rol === 'EDITOR' ? 'Todos los pueblos' : 'Mis pueblos';
  const subtitle =
    me.rol === 'ADMIN'
      ? 'Como administrador puedes abrir la ficha pública o entrar al panel de cada pueblo.'
      : me.rol === 'EDITOR'
        ? 'Como editor puedes actualizar contenidos de cualquier pueblo de la red.'
        : 'Como alcalde solo verás los pueblos que tienes asignados.';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <GestionPortalHero title={title} subtitle={subtitle} roleTone={rolToHeroTone(me.rol)} />

      {pueblos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/40 via-background to-emerald-50/30 px-6 py-14 text-center dark:to-emerald-950/20">
          <p className="text-lg font-semibold text-foreground">No hay pueblos disponibles</p>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            Si crees que es un error, contacta con la asociación o revisa que tu cuenta tenga pueblos asignados.
          </p>
        </div>
      ) : (
        <MisPueblosListClient pueblos={pueblos} />
      )}

      <div className="mt-12 border-t border-border/60 pt-8 text-sm">
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground hover:underline"
          href="/gestion"
        >
          <span aria-hidden>←</span> Volver a gestión
        </Link>
      </div>
    </main>
  );
}
