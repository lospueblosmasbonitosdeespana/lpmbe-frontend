import PuebloVisitadoItem from './PuebloVisitadoItem';

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
  items: PuebloVisitado[];
};

export default function PueblosVisitadosList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No has visitado ningún pueblo aún.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <PuebloVisitadoItem key={item.puebloId} item={item} />
      ))}
    </ul>
  );
}



