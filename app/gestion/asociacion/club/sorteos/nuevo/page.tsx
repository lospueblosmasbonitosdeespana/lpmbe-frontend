'use client';

import Link from 'next/link';
import { SorteoForm, type SorteoFormValue } from '../_form';

const initial: SorteoFormValue = {
  titulo: '',
  slug: '',
  descripcion: '',
  premio: '',
  imagenUrl: null,
  basesLegales:
    'Bases legales del sorteo:\n\n1. Organizador: Los Pueblos más Bonitos de España.\n2. Pueden participar todos los socios activos del Club a la fecha del sorteo.\n3. La inscripción es gratuita y se realiza desde el panel del Club.\n4. El sorteo se realizará por método aleatorio reproducible (semilla pública) sobre los participantes elegibles.\n5. El ganador será notificado por email y dispondrá de 15 días para reclamar el premio.\n6. La participación implica la aceptación íntegra de estas bases.\n',
  organizador: 'Los Pueblos más Bonitos de España',
  provinciaFiltro: null,
  interesesFiltro: [],
  edadMinima: null,
  tiposSuscripcion: [],
  validacionesMinimas: 0,
  inicioAt: '',
  finAt: '',
  numGanadores: 1,
  estado: 'BORRADOR',
};

export default function NuevoSorteoPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club/sorteos"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
      >
        ← Volver a sorteos
      </Link>
      <h1 className="mb-6 text-3xl font-bold">Nuevo sorteo</h1>
      <SorteoForm mode="create" initial={initial} />
    </main>
  );
}
