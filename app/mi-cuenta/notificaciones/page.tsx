import NotificacionesPreferencias from './preferencias';
import NotificacionesBandeja from './bandeja';

export default function NotificacionesPage() {
  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>

      <NotificacionesPreferencias />
      <NotificacionesBandeja />
    </section>
  );
}
