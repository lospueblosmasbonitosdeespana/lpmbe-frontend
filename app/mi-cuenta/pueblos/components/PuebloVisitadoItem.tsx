import Link from 'next/link';
import Image from 'next/image';
import RatingSelector from './RatingSelector';
import { getComunidadFlagSrc } from '@/lib/flags';
import { Caption } from '@/app/components/ui/typography';

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
    <li className="py-4 first:pt-0">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Link
            href={`/pueblos/${item.pueblo.slug}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {item.pueblo.nombre}
          </Link>
          {flagSrc && (
            <span className="shrink-0" title={`Bandera de ${item.pueblo.comunidad}`}>
              <Image
                src={flagSrc}
                alt={`Bandera de ${item.pueblo.comunidad}`}
                width={24}
                height={18}
                className="rounded-sm border border-border object-cover"
              />
            </span>
          )}
        </div>
        <Caption>
          {item.pueblo.provincia} / {item.pueblo.comunidad}
        </Caption>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Origen: {item.origen}</span>
          <span>{formatFecha(item.ultima_fecha)}</span>
        </div>
        <div className="pt-1">
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

