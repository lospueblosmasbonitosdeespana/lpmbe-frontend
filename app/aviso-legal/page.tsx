import LegalPage from '@/app/_components/LegalPage';
export { dynamic, revalidate } from '@/app/_components/LegalPage';

export default function AvisoLegalPage() {
  return <LegalPage staticKey="AVISO_LEGAL" slug="aviso-legal" />;
}
