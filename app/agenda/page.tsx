import { permanentRedirect } from 'next/navigation';

export default function AgendaPublicPage() {
  permanentRedirect('/actualidad?tipo=EVENTO');
}
