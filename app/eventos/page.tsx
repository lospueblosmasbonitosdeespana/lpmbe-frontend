import { redirect } from 'next/navigation';

export default function EventosPublicPage() {
  // Redirect a actualidad con filtro de eventos
  redirect('/actualidad?tipo=EVENTO');
}
