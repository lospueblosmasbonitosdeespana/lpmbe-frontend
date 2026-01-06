import Link from 'next/link';
import RatingSelector from './RatingSelector';

type PuebloVisitado = {
  puebloId: number;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  origen: 'GPS' | 'MANUAL';
  ultima_fecha: string;
  rating?: number | null;
};

type Props = {
  item: PuebloVisitado;
};

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return fecha;
  }
}

export default function PuebloVisitadoItem({ item }: Props) {
  return (
    <li className="border-b border-gray-200 pb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link
            href={`/pueblos/${item.pueblo.slug}`}
            className="text-lg font-semibold hover:underline"
          >
            {item.pueblo.nombre}
          </Link>
          <p className="text-sm text-gray-600">
            {item.pueblo.provincia} / {item.pueblo.comunidad}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Origen: {item.origen}</span>
            <span>Última visita: {formatFecha(item.ultima_fecha)}</span>
          </div>
          <RatingSelector
            puebloId={item.pueblo.id}
            initialRating={item.rating ?? null}
          />
        </div>
      </div>
    </li>
  );
}

