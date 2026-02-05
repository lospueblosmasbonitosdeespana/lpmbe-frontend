import NivelIcono from './NivelIcono';
import { Headline, Caption } from '@/app/components/ui/typography';

type Nivel = {
  nombre: string;
  nivel: number;
};

type SiguienteNivel = {
  nombre: string;
  nivel: number;
  puntos_necesarios: number;
};

type Props = {
  nivelActual?: Nivel | null;
  siguienteNivel?: SiguienteNivel | null;
  puntosTotales: number;
  progreso: number;
};

export default function DashboardResumen({
  nivelActual,
  siguienteNivel,
  puntosTotales,
  progreso,
}: Props) {
  const nombreNivel = nivelActual?.nombre ?? 'Nivel inicial';

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <NivelIcono nombreNivel={nombreNivel} className="shrink-0" />
        <div>
          <Headline as="h1" className="mb-0.5">Mi cuenta</Headline>
          <Caption>{nombreNivel}</Caption>
        </div>
      </div>

      <div>
        <p className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          {puntosTotales} puntos
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
          />
        </div>

        {siguienteNivel ? (
          <Caption>
            Próximo nivel: {siguienteNivel.nombre} (
            {siguienteNivel.puntos_necesarios} puntos)
          </Caption>
        ) : (
          <Caption>
            Empieza a visitar pueblos para subir de nivel
          </Caption>
        )}
      </div>
    </section>
  );
}
