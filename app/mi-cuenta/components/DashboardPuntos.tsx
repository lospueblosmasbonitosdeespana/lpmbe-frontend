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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Desglose de puntos</h2>

      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span>Visitas</span>
          <span>{visita}</span>
        </li>
      </ul>
    </section>
  );
}
