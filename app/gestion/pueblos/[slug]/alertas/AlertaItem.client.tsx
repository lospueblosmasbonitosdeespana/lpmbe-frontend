"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import EliminarNotificacionButton from "@/app/components/EliminarNotificacionButton";

type Props = {
  alerta: {
    id: number;
    titulo: string;
    contenido: string;
    tipo: string;
    createdAt?: string | null;
    expiresAt?: string | null;
  };
  slug: string;
};

function formatFecha(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AlertaItem({ alerta, slug }: Props) {
  const router = useRouter();
  const fecha = formatFecha(alerta.createdAt);
  const fechaCaducidad = formatFecha(alerta.expiresAt);
  const caducada = alerta.expiresAt ? new Date(alerta.expiresAt).getTime() < Date.now() : false;
  const sinCaducidad = !alerta.expiresAt;

  return (
    <article className="group overflow-hidden rounded-2xl border border-amber-100/90 bg-white shadow-sm transition-all duration-300 hover:border-amber-200 hover:shadow-md">
      <div className="flex items-start gap-4 p-5">
        <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 ring-1 ring-amber-200/60 shadow-sm">
          <svg className="h-6 w-6 text-amber-700/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-tight text-foreground sm:text-lg">{alerta.titulo}</h3>
            {fecha && (
              <time dateTime={alerta.createdAt ?? undefined} className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {fecha}
              </time>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-full border border-amber-200/80 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800/90">
              Aviso municipal
            </span>
            {caducada ? (
              <span className="inline-block rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Caducada · ya no se muestra al público
              </span>
            ) : sinCaducidad ? (
              <span className="inline-block rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Sin caducidad
              </span>
            ) : fechaCaducidad ? (
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Activa hasta {fechaCaducidad}
              </span>
            ) : null}
          </div>
          {alerta.contenido?.trim() ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{alerta.contenido}</p>
          ) : (
            <p className="mt-3 text-sm italic text-muted-foreground/70">Sin texto adicional.</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-amber-100/80 bg-gradient-to-b from-amber-50/40 to-transparent px-5 py-3">
        <Link
          href={`/gestion/pueblos/${slug}/alertas/${alerta.id}/editar`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:from-primary/90 hover:to-primary/80 active:scale-[0.98]"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
          Editar
        </Link>
        <EliminarNotificacionButton
          id={alerta.id}
          onDeleted={() => router.refresh()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
        />
      </div>
    </article>
  );
}

