'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';

type Modo = 'todos' | 'revisar';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  horarios: string | null;
  lat: number | null;
  lng: number | null;
  web: string | null;
  precioCents: number | null;
  validacionTipo: string;
  precargadoConfianza: string | null;
};

type Pueblo = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
};

type Resp =
  | {
      pueblo: Pueblo;
      recursos: Recurso[];
      yaUsado: boolean;
      expiresAt: string;
    }
  | { message?: string; statusCode?: number };

/**
 * Página pública (sin login) que el alcalde abre desde el email para
 * validar los recursos pre-cargados. Dos modos:
 *   - "todos":   un click → todos activos.
 *   - "revisar": checkboxes → activa selección, descarta el resto.
 */
export default function AprobarRecursosClient({
  token,
  modoInicial,
}: {
  token: string;
  modoInicial: Modo;
}) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<
    | null
    | { activados: number; descartados?: number }
  >(null);

  useEffect(() => {
    fetch(`/api/preload-validation/${token}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json()) as Resp;
        if (!res.ok) {
          const msg =
            ('message' in (json as any) && (json as any).message) ||
            `Error ${res.status}`;
          throw new Error(typeof msg === 'string' ? msg : `Error ${res.status}`);
        }
        return json as Extract<Resp, { pueblo: Pueblo }>;
      })
      .then((d) => {
        setData(d);
        // Por defecto todos seleccionados
        setSeleccionados(new Set(d.recursos.map((r) => r.id)));
      })
      .catch((e: any) => setError(e?.message ?? 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [token]);

  function toggleId(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function aprobarTodos() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/preload-validation/${token}/approve-all`, {
        method: 'POST',
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.message || `Error ${res.status}`);
        return;
      }
      setResultado({ activados: Number(j?.activados ?? 0) });
    });
  }

  async function aprobarSeleccion() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/preload-validation/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceIds: Array.from(seleccionados) }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.message || `Error ${res.status}`);
        return;
      }
      setResultado({
        activados: Number(j?.activados ?? 0),
        descartados: Number(j?.descartados ?? 0),
      });
    });
  }

  if (loading) {
    return <Layout title="Cargando…" />;
  }

  if (error) {
    return (
      <Layout title="No se puede mostrar esta página">
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="mt-4 text-sm">
          Si crees que es un error, escribe a{' '}
          <a
            className="text-amber-700 underline"
            href="mailto:ayuntamientos@lospueblosmasbonitosdeespana.org"
          >
            ayuntamientos@lospueblosmasbonitosdeespana.org
          </a>
          .
        </p>
      </Layout>
    );
  }

  if (!data || !('pueblo' in data)) {
    return <Layout title="Datos no disponibles" />;
  }

  if (resultado) {
    return (
      <Layout title={`¡Listo, gracias por validar ${data.pueblo.nombre}!`}>
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            Has activado <strong>{resultado.activados}</strong> recurso
            {resultado.activados === 1 ? '' : 's'}.
          </p>
          {typeof resultado.descartados === 'number' &&
          resultado.descartados > 0 ? (
            <p className="mt-1">
              Hemos descartado {resultado.descartados} que no marcaste.
            </p>
          ) : null}
          <p className="mt-3 text-emerald-800">
            En unos días recibirás por correo postal los QR estáticos para los
            recursos turísticos visitables.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/entrar"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            Editar fotos, descuentos y regalos
          </Link>
          <Link
            href={`/pueblos/${data.pueblo.slug}`}
            className="rounded-md border border-border/60 bg-white px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Ver mi pueblo en la web
          </Link>
        </div>
      </Layout>
    );
  }

  if (data.yaUsado) {
    return (
      <Layout title="Este enlace ya fue usado">
        <p className="text-sm text-muted-foreground">
          Los recursos de <strong>{data.pueblo.nombre}</strong> ya han sido
          validados anteriormente con este enlace.
        </p>
        <p className="mt-3 text-sm">
          Si necesitas hacer cambios, entra a tu cuenta:{' '}
          <Link href="/entrar" className="text-amber-700 underline">
            iniciar sesión
          </Link>
          .
        </p>
      </Layout>
    );
  }

  const recursos = data.recursos;

  return (
    <Layout
      title={`Validar recursos turísticos · ${data.pueblo.nombre}`}
      subtitulo={`${data.pueblo.provincia} · ${data.pueblo.comunidad} · ${recursos.length} recurso${recursos.length === 1 ? '' : 's'} pre-cargado${recursos.length === 1 ? '' : 's'}`}
    >
      {/* Selector de modo */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModo('todos')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            modo === 'todos'
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-border/60 bg-white hover:bg-muted'
          }`}
        >
          Aprobar todos
        </button>
        <button
          type="button"
          onClick={() => setModo('revisar')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            modo === 'revisar'
              ? 'border-amber-600 bg-amber-600 text-white'
              : 'border-border/60 bg-white hover:bg-muted'
          }`}
        >
          Revisar uno a uno
        </button>
      </div>

      {modo === 'todos' ? (
        <>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p>
              Vas a activar los <strong>{recursos.length}</strong> recursos pre-cargados
              de <strong>{data.pueblo.nombre}</strong> tal cual aparecen abajo.
            </p>
            <p className="mt-2 text-emerald-800">
              Después podrás editarlos uno a uno desde tu cuenta (foto, descuento,
              regalo, horarios…).
            </p>
          </div>
          <ul className="my-5 space-y-2 text-sm">
            {recursos.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-border/60 bg-white p-3"
              >
                <ResumenRecurso r={r} />
              </li>
            ))}
          </ul>
          <button
            onClick={aprobarTodos}
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
          >
            {pending
              ? 'Activando…'
              : `✅ Aprobar y activar ${recursos.length} recurso${recursos.length === 1 ? '' : 's'}`}
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Marca los recursos que quieres activar. Los <strong>desmarcados</strong>{' '}
              se descartarán definitivamente.
            </p>
          </div>
          <div className="mb-3 flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSeleccionados(new Set(recursos.map((r) => r.id)))}
              className="rounded-md border border-border/60 bg-white px-2 py-1 hover:bg-muted"
            >
              Marcar todos
            </button>
            <button
              type="button"
              onClick={() => setSeleccionados(new Set())}
              className="rounded-md border border-border/60 bg-white px-2 py-1 hover:bg-muted"
            >
              Desmarcar todos
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {recursos.map((r) => {
              const checked = seleccionados.has(r.id);
              return (
                <li
                  key={r.id}
                  className={`rounded-md border p-3 transition ${
                    checked
                      ? 'border-amber-300 bg-white'
                      : 'border-border/60 bg-muted/40 opacity-70'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(r.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <ResumenRecurso r={r} />
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
          {error ? (
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}
          <button
            onClick={aprobarSeleccion}
            disabled={pending}
            className="mt-5 w-full rounded-lg bg-amber-600 px-6 py-3 text-base font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 sm:w-auto"
          >
            {pending
              ? 'Procesando…'
              : `Aprobar selección (${seleccionados.size}) y descartar el resto`}
          </button>
        </>
      )}
    </Layout>
  );
}

function ResumenRecurso({ r }: { r: Recurso }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <span className="font-semibold text-foreground">{r.nombre}</span>
        <span className="text-xs uppercase tracking-wide text-amber-700">
          {r.tipo}
        </span>
      </div>
      {r.descripcion ? (
        <p className="mt-1 text-xs text-muted-foreground">{r.descripcion}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {r.horarios ? <span>🕒 {r.horarios}</span> : null}
        {typeof r.precioCents === 'number' && r.precioCents > 0 ? (
          <span>💶 {(r.precioCents / 100).toFixed(2)} €</span>
        ) : null}
        {r.web ? (
          <a
            href={r.web}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-amber-700 underline"
          >
            web oficial
          </a>
        ) : null}
        {typeof r.lat === 'number' && typeof r.lng === 'number' ? (
          <a
            href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-amber-700 underline"
          >
            ver en mapa
          </a>
        ) : null}
        {r.precargadoConfianza === 'MEDIUM' ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-900">
            Confianza geo media
          </span>
        ) : null}
      </div>
    </>
  );
}

function Layout({
  title,
  subtitulo,
  children,
}: {
  title: string;
  subtitulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-lg font-bold text-white">
            ✓
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Los Pueblos Más Bonitos de España · Club
            </p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              {title}
            </h1>
            {subtitulo ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitulo}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm sm:p-6">
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          ¿Dudas? Escribe a{' '}
          <a
            className="text-amber-700 underline"
            href="mailto:ayuntamientos@lospueblosmasbonitosdeespana.org"
          >
            ayuntamientos@lospueblosmasbonitosdeespana.org
          </a>
        </p>
      </div>
    </main>
  );
}
