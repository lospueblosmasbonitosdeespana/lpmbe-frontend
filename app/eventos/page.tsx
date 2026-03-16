import { permanentRedirect } from 'next/navigation';

export default function EventosPublicPage() {
  permanentRedirect('/actualidad?tipo=EVENTO');
}
