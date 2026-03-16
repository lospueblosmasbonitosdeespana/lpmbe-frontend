import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planifica tu fin de semana',
  description:
    'Eventos de los pueblos y de la asociación en los próximos 7 días, organizados por región.',
};

export default function PlanificaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
