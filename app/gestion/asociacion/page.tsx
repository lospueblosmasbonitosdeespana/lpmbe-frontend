import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function GestionAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión · Asociación</h1>
      <p className="mt-2 text-sm text-gray-600">
        Noticias, eventos y alertas globales (visibles a nivel nacional).
      </p>

      <div className="mt-8 rounded-md border p-4">
        <div className="font-medium">Accesos</div>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/home">
              Configuración del Home
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/rutas">
              Rutas
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/contenidos">
              Contenidos (páginas, noticias, eventos)
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/alertas">
              Alertas globales
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/club">
              Club de amigos
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/ajustes">
              Ajustes de marca (logo y nombre)
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/el-sello">
              El Sello (CMS)
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/el-sello/documentos">
              Documentos (PDFs)
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion">← Volver</Link>
      </div>
    </main>
  );
}

