'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Cuenta atrás hasta las 0:00h del día siguiente a fechaEvento (el beso es a medianoche del día después).
 */
export default function CountdownBeso({
  fechaEvento,
  light,
}: {
  fechaEvento: string | null;
  /** true = texto blanco para usar sobre hero/fondo oscuro */
  light?: boolean;
}) {
  const t = useTranslations('nocheRomantica');
  const [text, setText] = useState<string>('');

  useEffect(() => {
    if (!fechaEvento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaEvento)) {
      setText('');
      return;
    }

    const getTarget = () => {
      const d = new Date(fechaEvento + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const update = () => {
      const target = getTarget();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setText(t('countdownBesoDone'));
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;

      setText(
        t('countdownBeso')
          .replace('{days}', String(days))
          .replace('{hours}', String(hours))
      );
    };

    update();
    const interval = setInterval(update, 60 * 1000);
    return () => clearInterval(interval);
  }, [fechaEvento, t]);

  if (!text) return null;

  return (
    <p
      className={`mt-4 text-center text-lg font-medium md:text-xl drop-shadow-md ${light ? 'text-white' : 'text-rose-800'}`}
    >
      {text}
    </p>
  );
}
