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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <path d="M2 8c0-2.2.7-4.3 2-6" />
            <path d="M22 8c0-2.2-.7-4.3-2-6" />
          </svg>
          Ver mis notificaciones
        </Link>
      </div>

      <p className="text-gray-600">
        Selecciona los pueblos y tipos de notificación que quieres recibir.
      </p>

      <NotificacionesPreferencias />
    </section>
  );
}
