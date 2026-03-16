import { permanentRedirect } from 'next/navigation';

export default function ArticulosPublicPage() {
  permanentRedirect('/actualidad?tipo=ARTICULO');
}
