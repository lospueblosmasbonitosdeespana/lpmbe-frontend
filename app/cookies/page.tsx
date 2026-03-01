import LegalPage from '@/app/_components/LegalPage';
export { dynamic, revalidate } from '@/app/_components/LegalPage';

export default function CookiesPage() {
  return <LegalPage staticKey="COOKIES" slug="cookies" />;
}
