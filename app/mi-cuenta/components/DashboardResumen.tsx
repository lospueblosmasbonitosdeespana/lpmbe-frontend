import NivelIcono from './NivelIcono';

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
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <NivelIcono nombreNivel={nombreNivel} />
        <div>
          <h1 className="text-2xl font-semibold">Mi cuenta</h1>
          <p className="text-sm text-gray-600">{nombreNivel}</p>
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold">{puntosTotales} puntos</p>
      </div>

      <div className="space-y-1">
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-black rounded"
            style={{ width: `${progreso}%` }}
          />
        </div>

        {siguienteNivel ? (
          <p className="text-xs text-gray-600">
            Próximo nivel: {siguienteNivel.nombre} (
            {siguienteNivel.puntos_necesarios} puntos)
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            Empieza a visitar pueblos para subir de nivel
          </p>
        )}
      </div>
    </section>
  );
}
