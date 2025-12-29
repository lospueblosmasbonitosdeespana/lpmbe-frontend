import { getApiUrl } from "@/lib/api";
import NotificacionesList from "../_components/notificaciones/NotificacionesList";

export const dynamic = "force-dynamic";

type SearchParams = {
  tipo?: string;
};

type NotificacionTipo = "NOTICIA" | "SEMAFORO" | "ALERTA";

function validateTipo(tipo: string): NotificacionTipo | undefined {
  const upper = tipo.toUpperCase();
  if (upper === "NOTICIA" || upper === "SEMAFORO" || upper === "ALERTA") {
    return upper as NotificacionTipo;
  }
  return undefined;
}

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = searchParams
    ? await Promise.resolve(searchParams)
    : ({} as SearchParams);

  const tipoRaw = (sp.tipo ?? "").trim();
  const tipo = tipoRaw ? validateTipo(tipoRaw) : undefined;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Centro de notificaciones
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Noticias, alertas y estado de semáforos.
        </p>
      </div>

      <NotificacionesList tipo={tipo} />
    </main>
  );
}

