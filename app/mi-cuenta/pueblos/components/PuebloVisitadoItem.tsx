import Link from 'next/link';
import Image from 'next/image';
import RatingSelector from './RatingSelector';
import { getComunidadFlagSrc } from '@/lib/flags';

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
  onRatingSaved?: (puebloId: number, rating: number) => void;
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

export default function PuebloVisitadoItem({ item, onRatingSaved }: Props) {
  const flagSrc = getComunidadFlagSrc(item.pueblo.comunidad);

  return (
    <li className="border-b border-gray-200 pb-3">
      <div>
        <Link
          href={`/pueblos/${item.pueblo.slug}`}
          className="text-base font-semibold hover:underline"
        >
          {item.pueblo.nombre}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-600">
            {item.pueblo.provincia} / {item.pueblo.comunidad}
          </p>
          {flagSrc && (
            <span className="flex-shrink-0" title={`Bandera de ${item.pueblo.comunidad}`}>
              <Image
                src={flagSrc}
                alt={`Bandera de ${item.pueblo.comunidad}`}
                width={28}
                height={21}
                className="rounded-sm object-cover border border-gray-200"
              />
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-500">
          <span>Origen: {item.origen}</span>
          <span>{formatFecha(item.ultima_fecha)}</span>
        </div>
        <div className="mt-2">
          <RatingSelector
            puebloId={item.pueblo.id}
            initialRating={item.rating ?? null}
            onRatingSaved={onRatingSaved}
          />
        </div>
      </div>
    </li>
  );
}

