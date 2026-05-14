import Image from 'next/image'
import { Button } from '@/app/components/ui/button'
import type { Product } from './comercio-config'

interface ProductsSectionProps {
  products: Product[]
}

export function ProductsSection({ products }: ProductsSectionProps) {
  if (products.length === 0) return null

  const featuredProduct = products.find((p) => p.featured)
  const regularProducts = products.filter((p) => !p.featured)

  return (
    <section id="productos" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Nuestros quesos
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Productos destacados
          </h2>
        </div>

        {/* Products grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Featured product - spans 2 columns */}
          {featuredProduct && (
            <div className="group relative overflow-hidden rounded-xl bg-card shadow-sm md:col-span-2 md:row-span-2">
              <div className="grid h-full md:grid-cols-2">
                <div className="relative aspect-square md:aspect-auto">
                  <Image
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 md:p-8">
                  {/* Badges */}
                  {featuredProduct.badges.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {featuredProduct.badges.map((badge, i) => (
                        <span
                          key={i}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            badge.variant === 'highlight'
                              ? 'bg-accent text-accent-foreground'
                              : badge.variant === 'new'
                                ? 'bg-highlight text-highlight-foreground'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">
                    {featuredProduct.name}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {featuredProduct.description}
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {featuredProduct.format}
                  </p>
                  <p className="mb-6 font-serif text-3xl font-bold text-accent">
                    {featuredProduct.price} €
                  </p>
                  {featuredProduct.availableOnline ? (
                    <Button className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
                      Comprar
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-fit" disabled>
                      Disponible en obrador
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Regular products */}
          {regularProducts.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-xl bg-card shadow-sm"
            >
              <div className="relative aspect-square">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Badges overlay */}
                {product.badges.length > 0 && (
                  <div className="absolute right-3 top-3 flex flex-col gap-2">
                    {product.badges.map((badge, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          badge.variant === 'highlight'
                            ? 'bg-accent text-accent-foreground'
                            : badge.variant === 'new'
                              ? 'bg-highlight text-highlight-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="mb-1 font-serif text-xl font-bold text-foreground">
                  {product.name}
                </h3>
                <p className="mb-2 text-sm text-muted-foreground line-clamp-1">
                  {product.description}
                </p>
                <p className="mb-2 text-sm text-muted-foreground">
                  {product.format}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-serif text-2xl font-bold text-accent">
                    {product.price} €
                  </p>
                  {product.availableOnline ? (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Comprar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Solo en obrador
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
