import Link from 'next/link';

export default function MiCuentaPage() {
  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="font-display text-2xl font-semibold">Mi Cuenta</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/mi-cuenta/puntos" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">Mis puntos</h2>
          <p className="text-sm text-gray-600">Nivel, progreso y recompensas</p>
        </Link>

        <Link href="/mi-cuenta/pueblos" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">Pueblos visitados</h2>
          <p className="text-sm text-gray-600">Listado y valoraciones</p>
        </Link>

        <Link href="/mi-cuenta/bandeja" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">📬 Centro de notificaciones</h2>
          <p className="text-sm text-gray-600">Ver mis notificaciones y alertas</p>
        </Link>

        <Link href="/mi-cuenta/notificaciones" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">⚙️ Preferencias de notificaciones</h2>
          <p className="text-sm text-gray-600">Configurar pueblos y tipos</p>
        </Link>

        <Link href="/mi-cuenta/perfil" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">Perfil</h2>
          <p className="text-sm text-gray-600">Datos personales y seguridad</p>
        </Link>

        <Link href="/mi-cuenta/club" className="p-4 border rounded hover:bg-gray-50 transition">
          <h2 className="font-medium">Club de Amigos</h2>
          <p className="text-sm text-gray-600">QR y recursos turísticos visitados</p>
        </Link>
      </div>
    </section>
  );
}
