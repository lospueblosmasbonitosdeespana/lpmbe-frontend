import Link from 'next/link';
import Image from 'next/image';

type TiendaBannerSectionProps = {
  imageUrl?: string | null;
  title?: string;
  ctaText?: string;
};

export function TiendaBannerSection({
  imageUrl = '/hero/2.jpg',
  title = 'La Tienda',
  ctaText = 'Visita nuestra tienda',
}: TiendaBannerSectionProps) {
  const safeImage = imageUrl && imageUrl.trim() ? imageUrl.trim() : '/hero/2.jpg';

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Link
        href="/tienda"
        className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
      >
        {/* Imagen ancha */}
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted md:aspect-[3/1]">
          <Image
            src={safeImage}
            alt="Productos oficiales de Los Pueblos Más Bonitos de España"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Contenido superpuesto en la parte inferior */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-white md:text-3xl">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-white/90 md:text-base">
                  Productos oficiales: guías, mapas, merchandising y más
                </p>
              </div>
              <span className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                {ctaText} →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
