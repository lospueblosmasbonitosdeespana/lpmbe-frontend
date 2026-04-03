// app/gestion/page.tsx
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconMapa, IconAsociacion } from './_components/GestionIcons';
import DestacadosBadge from './_components/DestacadosBadge';
import { GestionEntradaCard, GestionEntradaSection } from './_components/GestionEntradaCard';
import { GestionPortalHero, type GestionPortalRoleTone } from './_components/GestionPortalHero';

function rolToHeroTone(rol: string): GestionPortalRoleTone {
  if (rol === 'ALCALDE') return 'alcalde';
  if (rol === 'ADMIN') return 'admin';
  if (rol === 'EDITOR') return 'editor';
  return 'colaborador';
}

export default async function GestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR' && me.rol !== 'COLABORADOR') {
    redirect('/cuenta');
  }

  const subtitle =
    me.rol === 'COLABORADOR'
      ? 'Gestiona el recurso turístico que tienes asignado.'
      : me.rol === 'ALCALDE'
        ? 'Gestiona los contenidos de tus pueblos asignados.'
        : me.rol === 'EDITOR'
          ? 'Edita contenidos, fotos y rutas de los pueblos.'
          : 'Gestión de contenidos y configuración global.';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <GestionPortalHero title="Gestión" subtitle={subtitle} roleTone={rolToHeroTone(me.rol)} />

      {me.rol === 'COLABORADOR' && (
        <GestionEntradaSection eyebrow="Mi recurso" tone="recurso">
          <GestionEntradaCard
            href="/colaborador"
            title="Mis recursos"
            description="Ver métricas y validar QRs del recurso asignado"
            variant="recurso"
            icon={<IconMapa />}
          />
        </GestionEntradaSection>
      )}

      {(me.rol === 'ALCALDE' || me.rol === 'ADMIN' || me.rol === 'EDITOR') && (
        <GestionEntradaSection eyebrow={me.rol === 'ALCALDE' ? 'Mis pueblos' : 'Pueblos'} tone="pueblos">
          <GestionEntradaCard
            href="/gestion/mis-pueblos"
            title={me.rol === 'ALCALDE' ? 'Mis pueblos' : 'Pueblos'}
            description={
              me.rol === 'ALCALDE'
                ? 'Gestiona los pueblos que tienes asignados'
                : 'Ver y gestionar todos los pueblos'
            }
            variant="map"
            icon={<IconMapa />}
          />
          <GestionEntradaCard
            href="/gestion/documentos-compartidos"
            title="Documentos compartidos"
            description="Papelería, ordenanzas y recursos que otros ayuntamientos han compartido con la red"
            variant="docs"
            icon={
              <div className="relative">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <DestacadosBadge />
              </div>
            }
          />
        </GestionEntradaSection>
      )}

      {me.rol === 'ADMIN' && (
        <GestionEntradaSection eyebrow="Asociación (global)" tone="asociacion" className="mt-12 sm:mt-14">
          <GestionEntradaCard
            href="/gestion/asociacion"
            title="Asociación"
            description="Configuración global, contenidos, tienda y más"
            variant="asociacion"
            icon={<IconAsociacion />}
          />
        </GestionEntradaSection>
      )}

      <div className="mt-12 border-t border-border/60 pt-8 text-sm">
        <Link
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground hover:underline"
          href="/cuenta"
        >
          <span aria-hidden>←</span> Volver a cuenta
        </Link>
      </div>
    </main>
  );
}
