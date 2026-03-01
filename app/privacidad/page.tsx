import LegalPage from '@/app/_components/LegalPage';
export { dynamic, revalidate } from '@/app/_components/LegalPage';

export default function PrivacidadPage() {
  return <LegalPage staticKey="PRIVACIDAD" slug="privacidad" showLocationBlock />;
}
