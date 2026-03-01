import LegalPage from '@/app/_components/LegalPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AvisoLegalPage() {
  return <LegalPage staticKey="AVISO_LEGAL" slug="aviso-legal" />;
}
