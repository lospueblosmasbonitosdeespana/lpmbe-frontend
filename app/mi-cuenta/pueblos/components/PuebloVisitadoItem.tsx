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
    <li className="border-b border-gray-200 pb-3">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/pueblos/${item.pueblo.slug}`}
            className="text-base font-semibold hover:underline"
          >
            {item.pueblo.nombre}
          </Link>
          <p className="text-xs text-gray-600">
            {item.pueblo.provincia} / {item.pueblo.comunidad}
          </p>
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <span>Origen: {item.origen}</span>
            <span>{formatFecha(item.ultima_fecha)}</span>
          </div>
          <div className="mt-2">
            <RatingSelector
              puebloId={item.pueblo.id}
              initialRating={item.rating ?? null}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

