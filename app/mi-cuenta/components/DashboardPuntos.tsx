import { Title, Caption } from '@/app/components/ui/typography';

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
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <Title size="lg">Desglose de puntos</Title>

      <ul className="space-y-3">
        <li className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">Visitas</span>
          <span className="font-semibold tabular-nums">{visita}</span>
        </li>
      </ul>
    </section>
  );
}
