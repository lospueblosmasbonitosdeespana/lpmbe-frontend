import { getProducts } from "@/src/lib/tiendaApi";
import type { Product } from "@/src/types/tienda";
import { TiendaPageClient } from "./TiendaPageClient";
import type { ProductCardData } from "@/app/_components/tienda/ProductCard";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";

export const dynamic = "force-dynamic";

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
    fullProduct: product, // ✅ Pasar producto completo para el carrito
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

  if (error) {
    return (
      <main className="min-h-screen">
        <Section spacing="lg">
          <Container>
            <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
          </Container>
        </Section>
      </main>
    );
  }

  // Filter and sort products
  const activeProducts = products.filter((p) => p.activo);
  const featuredProducts = activeProducts
    .filter((p) => p.destacado)
    .sort((a, b) => a.orden - b.orden)
    .slice(0, 4)
    .map(productToCardData);

  const allProductCards = activeProducts.sort((a, b) => a.orden - b.orden).map(productToCardData);

  return <TiendaPageClient allProducts={allProductCards} featuredProducts={featuredProducts} />;
}
