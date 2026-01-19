import { redirect } from 'next/navigation';

export default function ArticulosPublicPage() {
  // Redirect a actualidad con filtro de artículos
  redirect('/actualidad?tipo=ARTICULO');
}
