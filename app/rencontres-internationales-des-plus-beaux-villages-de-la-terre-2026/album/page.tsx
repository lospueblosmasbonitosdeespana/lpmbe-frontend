import GranEventoAlbumPage from '@/app/_components/grandes-eventos/GranEventoAlbumPage';

export const revalidate = 30;

const SLUG = 'rencontres-internationales-des-plus-beaux-villages-de-la-terre-2026';
const BACK = '/rencontres-internationales-des-plus-beaux-villages-de-la-terre-2026';

export default function Page() {
  return <GranEventoAlbumPage slug={SLUG} backHref={BACK} />;
}
