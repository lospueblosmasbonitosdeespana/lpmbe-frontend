import GranEventoAlbumPage from '@/app/_components/grandes-eventos/GranEventoAlbumPage';

export const revalidate = 30;

export default function Page({ params }: { params: { slug: string } }) {
  return <GranEventoAlbumPage slug={params.slug} backHref={`/encuentros/${params.slug}`} />;
}
