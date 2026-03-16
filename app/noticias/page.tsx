import { permanentRedirect } from 'next/navigation';

export default function NoticiasPublicPage() {
  permanentRedirect('/actualidad?tipo=NOTICIA');
}
