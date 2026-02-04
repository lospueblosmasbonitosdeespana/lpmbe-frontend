import { getProducts } from '@/src/lib/tiendaApi';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Grid } from '@/app/components/ui/grid';
import { Display, Lead, Eyebrow, Headline } from '@/app/components/ui/typography';
import { ProductCard } from '@/app/_components/tienda/ProductCard';
import type { Product } from '@/src/types/tienda';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/* ===========================================
   SHOP HERO
   =========================================== */

function ShopHero() {
  return (
    <Section spacing="none" className="relative">
      <Container className="relative py-16 md:py-24">
        <div className="max-w-2xl">
          <Eyebrow className="mb-4">Tienda oficial</Eyebrow>
          <Display className="mb-6">Productos con alma de pueblo</Display>
          <Lead className="text-foreground/80">
            Productos oficiales de Los Pueblos Más Bonitos de España. Descubre
            artesanía, gastronomía y cultura de los rincones más bellos.
          </Lead>
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   BENEFITS BAR
   =========================================== */

const benefits = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6"
      >
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Envío gratuito',
    description: 'En pedidos superiores a 50€',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Pago seguro',
    description: 'Transacciones encriptadas',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'Producto artesanal',
    description: 'Hecho en España',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    title: 'Origen certificado',
    description: 'De los pueblos más bonitos',
  },
];

function BenefitsBar() {
  return (
    <Section spacing="sm" background="muted">
      <Container>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 text-primary">{benefit.icon}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {benefit.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   MAIN PAGE
   =========================================== */

export default async function TiendaPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Error cargando productos';
  }

  const activeProducts = products
    .filter((p) => p.activo)
    .sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return a.orden - b.orden;
    });

  const destacados = activeProducts.filter((p) => p.destacado);
  const restantes = activeProducts.filter((p) => !p.destacado);

  return (
    <>
      <ShopHero />
      <BenefitsBar />

      <Section spacing="lg">
        <Container>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {!error && activeProducts.length === 0 && (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-muted-foreground">
                No hay productos disponibles en este momento.
              </p>
            </div>
          )}

          {!error && activeProducts.length > 0 && (
            <>
              {destacados.length > 0 && (
                <div className={cn(restantes.length > 0 && 'mb-12')}>
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <Eyebrow className="mb-2">Selección especial</Eyebrow>
                      <Headline as="h2">Productos destacados</Headline>
                    </div>
                  </div>
                  <Grid columns={4} gap="md">
                    {destacados.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </Grid>
                </div>
              )}

              {restantes.length > 0 && (
                <div>
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <Eyebrow className="mb-2">Explora</Eyebrow>
                      <Headline as="h2">
                        {destacados.length > 0
                          ? 'Todos los productos'
                          : 'Productos'}
                      </Headline>
                    </div>
                  </div>
                  <Grid columns={4} gap="md">
                    {restantes.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </Grid>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
