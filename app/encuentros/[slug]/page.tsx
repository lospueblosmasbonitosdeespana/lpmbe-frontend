import GranEventoPage from '@/app/_components/grandes-eventos/GranEventoPage';

export const revalidate = 30;

/**
 * Ruta dinámica para nuevos Grandes Eventos. Cada evento tiene su URL en
 * /encuentros/[slug] y se gestiona desde /gestion/asociacion/grandes-eventos.
 */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GranEventoPage slug={slug} albumHref={`/encuentros/${slug}/album`} />;
}
