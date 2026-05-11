import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileText, AlertTriangle } from 'lucide-react';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { HERO_GRADIENT } from '../../../../../_lib/premiosUI';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface FilaBaremo {
  accion: string;
  puntos: string;
  nota?: string;
}

const BAREMO: FilaBaremo[] = [
  {
    accion: 'Publicar un evento (Contenido · tipo EVENTO)',
    puntos: '1',
    nota: 'Debe estar en estado PUBLICADA y creado por un usuario no-ADMIN.',
  },
  {
    accion: 'Publicar una noticia (Contenido · tipo NOTICIA)',
    puntos: '1',
    nota: 'Debe estar en estado PUBLICADA y creada por un usuario no-ADMIN.',
  },
  {
    accion: 'Publicar un artículo (Contenido · tipo ARTICULO)',
    puntos: '2',
    nota: 'Los artículos son contenido de mayor elaboración.',
  },
  {
    accion: 'Publicar una página (Contenido · tipo PAGINA)',
    puntos: '2',
    nota: 'Página genérica del sistema de contenidos.',
  },
  {
    accion: 'Crear una página temática (Cultura, Naturaleza, Patrimonio, etc.)',
    puntos: '3',
    nota: 'Modelo Page. Debe estar publicada.',
  },
  {
    accion: 'Crear un POI (punto de interés) en el mapa',
    puntos: '2',
    nota: 'Cada POI nuevo suma.',
  },
  {
    accion: 'Crear una multiexperiencia con al menos 4 paradas',
    puntos: '4',
    nota: 'Se suman paradas del legado (overrides) + paradas nuevas (custom activas). Una MX con menos de 4 paradas no se considera un producto turístico válido y no puntúa.',
  },
  {
    accion: 'Compartir un documento con el resto de la red',
    puntos: '2',
    nota: 'Si el alcalde quita el "compartido", se pierden los puntos.',
  },
  {
    accion: 'Landing de Semana Santa con descripción y foto',
    puntos: '1',
    nota: 'Edición Semana Santa del año en curso, creada por no-ADMIN.',
  },
  {
    accion: 'Cada procesión / acto de Semana Santa',
    puntos: '0,5',
    nota: 'Cada ítem de la agenda de Semana Santa del pueblo.',
  },
  {
    accion: 'Subir un vídeo nuevo del pueblo',
    puntos: '1',
    nota: 'Atribución vía AuditLog (CREAR − ELIMINAR de no-ADMIN).',
  },
  {
    accion: 'Subir una audioguía nueva del pueblo',
    puntos: '1',
    nota: 'Atribución vía AuditLog (CREAR − ELIMINAR de no-ADMIN).',
  },
  {
    accion: 'Activar una webcam nueva del pueblo',
    puntos: '1',
    nota: 'Atribución vía AuditLog (CREAR − ELIMINAR de no-ADMIN).',
  },
];

const BONUS: FilaBaremo[] = [
  {
    accion: 'Tener al menos 1 recurso propio del pueblo',
    puntos: '+5',
    nota: 'Solo cuentan recursos cargados por el ayuntamiento (creadoPor=ALCALDE). Lo que cargue el admin o la IA NO suma. Único e independiente del nº de recursos.',
  },
  {
    accion: 'Tener al menos 6 servicios en el mapa del pueblo',
    puntos: '+5',
    nota: 'Lavabos, parking, turismo, farmacia, supermercado, autobús, etc.',
  },
];

export default async function BaremoPremio7Page({
  searchParams,
}: {
  searchParams: Promise<{ edicionId?: string; from?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  const rolesPermitidos = new Set(['ADMIN', 'ALCALDE', 'EDITOR', 'COLABORADOR']);
  if (!rolesPermitidos.has(me.rol)) redirect('/mi-cuenta');

  const esAdmin = me.rol === 'ADMIN';
  const { edicionId, from } = await searchParams;
  // `from` sólo se acepta si es una ruta interna relativa (evita open-redirect).
  const fromSanitizado =
    from && from.startsWith('/') && !from.startsWith('//') ? from : null;
  const backHref =
    fromSanitizado ??
    (esAdmin
      ? edicionId
        ? `/gestion/asociacion/datos/premios/7?edicionId=${edicionId}`
        : '/gestion/asociacion/datos/premios/7'
      : '/mi-cuenta');
  const backLabel = fromSanitizado
    ? 'Volver'
    : esAdmin
      ? 'Volver al Premio 07'
      : 'Volver a mi cuenta';

  return (
    <GestionAsociacionSubpageShell
      title="Baremo · Pueblo Más Trabajador"
      subtitle="Cuánto vale cada cosa que hace el pueblo en la web"
      backHref={backHref}
      backLabel={backLabel}
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
          style={{ background: HERO_GRADIENT }}
        >
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
            >
              <ArrowLeft className="h-3 w-3" />
              {backLabel}
            </Link>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Premio 07 · Baremo de puntuación
                </span>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  ¿Cuánto vale cada cosa?
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-white/85">
                  Transparencia total: este es el baremo con el que se calcula el Pueblo
                  Más Trabajador. Sólo computan las acciones realizadas por el pueblo
                  (alcalde, editor o colaborador). Lo que hace un ADMIN{' '}
                  <strong>no cuenta nunca</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reglas generales */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Reglas generales
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-900">
            <li>
              <strong>Sólo cuenta el trabajo del pueblo</strong> (alcalde / editor /
              colaborador). Lo hecho por un ADMIN no puntúa.
            </li>
            <li>
              <strong>Se descarta todo el legacy</strong>: eventos y noticias arrastrados
              desde la web antigua no cuentan.
            </li>
            <li>
              <strong>Acumulativo desde el arranque de la web nueva</strong>, no se
              resetea por edición.
            </li>
            <li>
              <strong>Si se borra un contenido, se pierden los puntos</strong>. El cálculo
              mira lo que está vivo hoy: no hay forma de "hacer trampas" creando y
              borrando.
            </li>
            <li>
              <strong>Noche Romántica no computa este año</strong>. <strong>Navidad</strong>{' '}
              está pendiente de definir.
            </li>
          </ul>
        </div>

        {/* Tabla de puntuación principal */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/40 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
              <FileText className="h-4 w-4" />
              Acciones que puntúan
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Acción</th>
                <th className="px-5 py-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {BAREMO.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/40 last:border-0 align-top hover:bg-muted/20"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{row.accion}</div>
                    {row.nota && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{row.nota}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-800 ring-1 ring-emerald-200">
                      {row.puntos} pt{row.puntos !== '1' ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bonus */}
        <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-card shadow-sm">
          <div className="border-b border-indigo-200 bg-indigo-50/60 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-900">
              <Sparkles className="h-4 w-4" />
              Bonus por estado del pueblo
            </h2>
            <p className="mt-1 text-xs text-indigo-900/70">
              Son puntos que dependen de un umbral. Se dan una sola vez (si tienes 1
              recurso, 5 pts; si tienes 50, también 5 pts).
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Condición</th>
                <th className="px-5 py-3 text-right">Bonus</th>
              </tr>
            </thead>
            <tbody>
              {BONUS.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/40 last:border-0 align-top hover:bg-muted/20"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{row.accion}</div>
                    {row.nota && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{row.nota}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2.5 py-1 text-sm font-bold tabular-nums text-indigo-800 ring-1 ring-indigo-200">
                      {row.puntos} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nota final */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          <p>
            Este baremo es la fuente única de verdad junto con el archivo{' '}
            <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-foreground">
              backend/docs/PUNTUACION_P7.md
            </code>
            . Si cambias los puntos aquí, cámbialos también en el cálculo del backend (
            <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-foreground">
              calc07TrabajadorContenidoPueblo
            </code>
            ) y en la descripción del premio (
            <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-foreground">
              premios.types.ts
            </code>
            ).
          </p>
        </div>
      </div>
    </GestionAsociacionSubpageShell>
  );
}
