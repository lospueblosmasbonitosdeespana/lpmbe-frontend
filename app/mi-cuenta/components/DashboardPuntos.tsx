type Props = {
  puntosPorTipo?: {
    VISITA?: number;
    RUTA?: number;
    EVENTO?: number;
    MULTIEXPERIENCIA?: number;
  } | null;
};

export default function DashboardPuntos({ puntosPorTipo }: Props) {
  const visita = puntosPorTipo?.VISITA ?? 0;
  const ruta = puntosPorTipo?.RUTA ?? 0;
  const evento = puntosPorTipo?.EVENTO ?? 0;
  const multi = puntosPorTipo?.MULTIEXPERIENCIA ?? 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Desglose de puntos</h2>

      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span>Visitas</span>
          <span>{visita}</span>
        </li>
        <li className="flex justify-between">
          <span>Rutas</span>
          <span>{ruta}</span>
        </li>
        <li className="flex justify-between">
          <span>Eventos</span>
          <span>{evento}</span>
        </li>
        <li className="flex justify-between">
          <span>Multiexperiencias</span>
          <span>{multi}</span>
        </li>
      </ul>
    </section>
  );
}
