import Link from "next/link";

type PuebloCardProps = {
  slug: string;
  nombre: string;
  provincia?: string | null;
  foto?: string | null;
};

export function PuebloCard({ slug, nombre, provincia, foto }: PuebloCardProps) {
  return (
    <Link
      href={`/pueblos/${slug}`}
      className="group block overflow-hidden bg-gray-100"
    >
      <div className="relative h-[170px] w-full overflow-hidden bg-gray-200">
        {foto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={foto}
            alt={nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-300">
            <span className="text-xs text-gray-500">Sin imagen</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/15" />
      </div>

      <div className="px-4 py-4">
        <div className="text-sm font-semibold">{nombre}</div>
        <div className="mt-1 text-xs text-gray-600">{provincia || ""}</div>
      </div>
    </Link>
  );
}

