import Link from "next/link";

type Props = {
  titulo: string;
  fecha?: string;
  tipo?: string;
  href: string;
};

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function ActualidadItem({ titulo, fecha, tipo, href }: Props) {
  const label =
    tipo === "SEMAFORO" ? "Semáforo" :
    tipo === "ALERTA" ? "Alerta" :
    "Noticia";

  return (
    <Link
      href={href}
      className="flex items-start gap-4 border-b border-gray-100 py-4 hover:bg-gray-50"
    >
      <div className="w-20 shrink-0 text-xs text-gray-500">
        {formatDate(fecha)}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{titulo}</div>
        <div className="mt-1 text-xs text-gray-500">{label}</div>
      </div>
    </Link>
  );
}



