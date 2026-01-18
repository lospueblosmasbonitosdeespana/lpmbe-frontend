import { redirect } from 'next/navigation';

export default function NoticiasPublicPage() {
  // Redirect a actualidad con filtro de noticias
  redirect('/actualidad?tipo=NOTICIA');
}
