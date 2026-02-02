import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ShopCategoryData {
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

interface ShopCategoryCardProps {
  category: ShopCategoryData;
  className?: string;
}

export function ShopCategoryCard({ category, className }: ShopCategoryCardProps) {
  return (
    <Link
      href={`/tienda/categoria/${category.slug}`}
      className={cn("group block", className)}
    >
      <article className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        <Image
          src={category.image || "/placeholder.svg"}
          alt={category.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="text-[10px] uppercase tracking-widest text-card/70">
            {category.productCount} productos
          </span>
          <h3 className="mt-1 font-serif text-xl font-medium text-card">
            {category.name}
          </h3>
          <p className="mt-1 text-sm leading-snug text-card/80 line-clamp-2">
            {category.description}
          </p>
          
          {/* Arrow */}
          <div className="mt-3 flex items-center gap-2 text-card/90 transition-all group-hover:gap-3">
            <span className="text-sm font-medium">Explorar</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
