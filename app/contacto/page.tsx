import LegalPage from '@/app/_components/LegalPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContactoPage() {
  return <LegalPage staticKey="CONTACTO" slug="contacto" />;
}
