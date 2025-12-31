"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EliminarNotificacionButton from "../../../components/EliminarNotificacionButton";

type Notificacion = {
  id: number;
  tipo: string;
  titulo?: string | null;
  contenido?: string | null;
  createdAt: string;
};

type Props = {
  notificaciones: Notificacion[];
  slug: string;
};

function getEditUrl(tipo: string, id: number, slug: string): string | null {
  const tipoUpper = tipo.toUpperCase();
  if (tipoUpper === "NOTICIA") {
    return `/gestion/pueblos/${slug}/noticias/${id}/editar`;
  }
  if (tipoUpper === "EVENTO") {
    return `/gestion/pueblos/${slug}/eventos/${id}/editar`;
  }
  if (tipoUpper === "ALERTA_PUEBLO" || tipoUpper === "ALERTA") {
    return `/gestion/pueblos/${slug}/alertas/${id}/editar`;
  }
  if (tipoUpper === "SEMAFORO") {
    return `/gestion/pueblos/${slug}/semaforo`;
  }
  return null;
}

export default function NotificacionesBlock({ notificaciones, slug }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(notificaciones);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-md border p-4 text-sm">
      <div className="font-medium text-gray-800">Últimas notificaciones</div>
      <div className="mt-2 space-y-3">
        {items.map((n) => {
          const editUrl = getEditUrl(n.tipo, n.id, slug);
          return (
            <div key={n.id} className="border-b pb-2 last:border-b-0">
              <div className="text-xs text-gray-500">
                {new Date(n.createdAt).toLocaleString("es-ES")}
              </div>
              <div className="mt-1 text-xs">
                Tipo: <strong>{n.tipo}</strong>
              </div>
              {n.titulo && (
                <div className="mt-1 font-semibold">{n.titulo}</div>
              )}
              {n.contenido && (
                <div className="mt-1 text-gray-600">{n.contenido}</div>
              )}
              <div className="mt-2 flex gap-4 text-xs">
                {editUrl && (
                  <Link href={editUrl} className="hover:underline">
                    Editar
                  </Link>
                )}
                <EliminarNotificacionButton
                  id={n.id}
                  confirmText="¿Eliminar esta notificación? Esto no se puede deshacer."
                  onDeleted={(id) => {
                    setItems((prev) => prev.filter((x) => x.id !== id));
                    router.refresh();
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


