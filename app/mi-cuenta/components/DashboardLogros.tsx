'use client';

import { useTranslations } from 'next-intl';
import { Title, Caption } from '@/app/components/ui/typography';

const LOGROS_PLACEHOLDER = [
  { nombre: 'Primera Huella GPS', icono: '📍', categoria: 'EXPLORADOR' },
  { nombre: 'Explorador de 5 Pueblos', icono: '🗺️', categoria: 'EXPLORADOR' },
  { nombre: 'Explorador de 10 Pueblos', icono: '🏔️', categoria: 'EXPLORADOR' },
  { nombre: 'Primer Escaneo Club', icono: '📱', categoria: 'CLUB' },
  { nombre: 'Primera Compra', icono: '🛍️', categoria: 'COMPRADOR' },
  { nombre: 'Explorador del Norte', icono: '🧭', categoria: 'EXPLORADOR' },
  { nombre: 'Explorador del Sur', icono: '☀️', categoria: 'EXPLORADOR' },
  { nombre: 'Embajador Nacional', icono: '🏆', categoria: 'ESPECIAL' },
];

export default function DashboardLogros() {
  const t = useTranslations('points');

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Title size="lg">{t('achievementsTitle')}</Title>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {t('comingSoon')}
        </span>
      </div>
      <Caption className="block">
        {t('achievementsDesc')}
      </Caption>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LOGROS_PLACEHOLDER.map((logro) => (
          <div
            key={logro.nombre}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 opacity-50"
          >
            <span className="text-2xl grayscale">{logro.icono}</span>
            <span className="text-center text-xs font-medium text-muted-foreground leading-tight">
              {logro.nombre}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
