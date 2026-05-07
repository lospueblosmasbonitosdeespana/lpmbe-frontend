import GranEventoPage from '@/app/_components/grandes-eventos/GranEventoPage';

export const revalidate = 30;

const SLUG = 'rencontres-internationales-des-plus-beaux-villages-de-la-terre-2026';

/**
 * Ruta dedicada del primer Gran Evento. La URL coincide con el slug del evento
 * en BD para que el QR ya impreso siga funcionando. Para futuros eventos se
 * usa `/encuentros/[slug]` (mucho más cómodo de gestionar).
 */
export default function Page() {
  return <GranEventoPage slug={SLUG} />;
}
