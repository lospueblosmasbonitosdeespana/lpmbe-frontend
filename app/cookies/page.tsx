import LegalPage from '@/app/_components/LegalPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CookiesPage() {
  return <LegalPage staticKey="COOKIES" slug="cookies" />;
}
