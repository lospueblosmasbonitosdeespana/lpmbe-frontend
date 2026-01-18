import Link from 'next/link';
import NotificacionesPreferencias from './preferencias';

export default function NotificacionesPage() {
  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header con link a bandeja */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Preferencias de notificaciones</h1>
        <Link
          href="/mi-cuenta/bandeja"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          📬 Ver mis notificaciones
        </Link>
      </div>

      <p className="text-gray-600">
        Selecciona los pueblos y tipos de notificación que quieres recibir.
      </p>

      <NotificacionesPreferencias />
    </section>
  );
}
