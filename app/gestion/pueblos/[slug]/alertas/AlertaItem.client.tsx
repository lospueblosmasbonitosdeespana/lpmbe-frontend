"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import EliminarNotificacionButton from "../../../../components/EliminarNotificacionButton";

type Props = {
  alerta: {
    id: number;
    titulo: string;
    contenido: string;
    tipo: string;
    createdAt?: string | null;
  };
  slug: string;
};

export default function AlertaItem({ alerta, slug }: Props) {
  const router = useRouter();
  
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold">{alerta.titulo}</h3>

      <small className="block mt-1">
        {alerta.tipo} · {new Date(alerta.createdAt || "").toLocaleDateString("es-ES")}
      </small>

      <p className="mt-2">{alerta.contenido}</p>

      <div className="mt-2">
        <Link
          href={`/gestion/pueblos/${slug}/alertas/${alerta.id}/editar`}
          className="underline"
        >
          Editar
        </Link> ·{" "}
        <EliminarNotificacionButton
          id={alerta.id}
          onDeleted={() => router.refresh()}
        />
      </div>

      <hr className="mt-4" />
    </div>
  );
}

