import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/src/lib/tiendaApi";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Grid } from "@/app/components/ui/grid";
import { Display, Headline, Lead, Body, Eyebrow, Title } from "@/app/components/ui/typography";
import { ProductCard, type ProductCardData } from "@/app/_components/tienda/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/src/types/tienda";

export const dynamic = "force-dynamic";

/* ===========================================
   SHOP HERO
   =========================================== */

function ShopHero() {
  return (
    <Section spacing="none" className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <Container className="relative py-16 md:py-24">
        <div className="max-w-2xl">
          <Eyebrow className="mb-4">Tienda oficial</Eyebrow>
          <Display className="mb-6">Productos con alma de pueblo</Display>
          <Lead className="text-foreground/80">
            Descubre artesanía, gastronomía y cultura de los rincones más bellos de España. 
            Cada compra apoya directamente a los artesanos locales.
          </Lead>

          {/* Search bar */}
          <div className="mt-8 flex max-w-md">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full rounded-l-md border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="rounded-r-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Buscar
            </button>
          </div>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: "Envío gratuito",
    description: "En pedidos superiores a 50€",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Pago seguro",
    description: "Transacciones encriptadas",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: "Producto artesanal",
    description: "Hecho en España",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    title: "Origen certificado",
    description: "De los pueblos más bonitos",
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
                <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   FEATURED BANNER
   =========================================== */

interface FeaturedBannerProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  align?: "left" | "right";
}

function FeaturedBanner({ title, description, cta, href, align = "left" }: FeaturedBannerProps) {
  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative flex min-h-[320px] overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10",
          align === "right" && "flex-row-reverse"
        )}
      >
        {/* Content */}
        <div className="flex w-full flex-col justify-center p-8 md:p-12">
          <Eyebrow className="mb-3">Destacado</Eyebrow>
          <Title as="h3" className="mb-3">
            {title}
          </Title>
          <Body className="mb-6 text-muted-foreground">{description}</Body>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
            {cta}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ===========================================
   NEWSLETTER CTA
   =========================================== */

function NewsletterCTA() {
  return (
    <Section spacing="lg" background="primary" className="text-primary-foreground">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-4 text-primary-foreground/70">Newsletter</Eyebrow>
          <Headline as="h2" className="mb-4 text-primary-foreground">
            10% de descuento en tu primera compra
          </Headline>
          <Body className="mb-8 text-primary-foreground/80">
            Suscríbete a nuestra newsletter y recibe un código de descuento exclusivo, además de novedades sobre
            productos artesanales de los pueblos más bonitos.
          </Body>
          <div className="flex justify-center gap-3">
            <input
              type="email"
              placeholder="Tu email"
              className="w-full max-w-xs rounded-md border-0 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
            />
            <button className="rounded-md bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90">
              Suscribirme
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   HELPER: Convert Product to ProductCardData
   =========================================== */

function productToCardData(product: Product): ProductCardData {
  const finalPrice = product.finalPrice ?? product.precio;
  const hasDiscount = product.discount || product.discountPercent;

  return {
    slug: product.slug,
    name: product.nombre,
    price: Number(finalPrice),
    originalPrice: hasDiscount ? Number(product.precio) : undefined,
    image: product.imagenUrl || "/placeholder.svg",
    category: product.categoria || "Sin categoría",
    badge: product.destacado ? "bestseller" : undefined,
  };
}

/* ===========================================
   MAIN PAGE
   =========================================== */

export default async function TiendaPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: any) {
    error = e?.message ?? "Error cargando productos";
  }

  // Filter and sort products
  const activeProducts = products.filter((p) => p.activo);
  const featuredProducts = activeProducts
    .filter((p) => p.destacado)
    .sort((a, b) => a.orden - b.orden)
    .slice(0, 4)
    .map(productToCardData);

  const allProductCards = activeProducts.sort((a, b) => a.orden - b.orden).map(productToCardData);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <ShopHero />

      {/* Benefits */}
      <BenefitsBar />

      {error && (
        <Section spacing="lg">
          <Container>
            <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
          </Container>
        </Section>
      )}

      {!error && activeProducts.length === 0 && (
        <Section spacing="lg">
          <Container>
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-gray-600">No hay productos disponibles</p>
            </div>
          </Container>
        </Section>
      )}

      {!error && activeProducts.length > 0 && (
        <>
          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <Section spacing="lg" background="card">
              <Container>
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <Eyebrow className="mb-2">Selección especial</Eyebrow>
                    <Headline as="h2">Productos destacados</Headline>
                  </div>
                </div>
                <Grid columns={4} gap="md">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.slug} product={product} />
                  ))}
                </Grid>
              </Container>
            </Section>
          )}

          {/* Featured Banner 1 */}
          <Section spacing="lg">
            <Container>
              <FeaturedBanner
                title="Libro: Los Pueblos Más Bonitos de España"
                description="Un viaje fotográfico por los 126 pueblos que conforman nuestra asociación. Edición de coleccionista con más de 400 fotografías."
                cta="Descubrir libro"
                href="/tienda"
                align="left"
              />
            </Container>
          </Section>

          {/* All Products */}
          <Section spacing="lg">
            <Container>
              <div className="mb-8">
                <Eyebrow className="mb-2">Catálogo completo</Eyebrow>
                <Headline as="h2">Todos los productos</Headline>
                <Lead className="mt-2">{allProductCards.length} productos disponibles</Lead>
              </div>
              <Grid columns={4} gap="md">
                {allProductCards.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </Grid>
            </Container>
          </Section>

          {/* Featured Banner 2 */}
          <Section spacing="lg" background="muted">
            <Container>
              <FeaturedBanner
                title="Colección Gastronomía"
                description="Los mejores productos de la tierra: aceites, mieles, embutidos y vinos de denominación de origen de nuestros pueblos."
                cta="Explorar colección"
                href="/tienda"
                align="right"
              />
            </Container>
          </Section>
        </>
      )}

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </main>
  );
}
