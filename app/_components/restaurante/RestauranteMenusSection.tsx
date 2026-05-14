import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  nombre: string;
  precio: number | string;
  precioNota?: string | null;
  descripcion?: string | null;
  chip?: string | null;
  cursos?: string[];
  destacado?: boolean;
  badge?: string | null;
}

interface Props {
  eyebrow: string;
  title: string;
  items: MenuItem[];
  reservarLabel: string;
  bookingUrl?: string | null;
  telefono?: string | null;
}

function formatPrecio(precio: number | string) {
  if (typeof precio === 'number') {
    return precio % 1 === 0 ? `${precio}€` : `${precio.toFixed(2)}€`;
  }
  return precio;
}

export default function RestauranteMenusSection({
  eyebrow,
  title,
  items,
  reservarLabel,
  bookingUrl,
  telefono,
}: Props) {
  if (items.length === 0) return null;
  const reservaHref = bookingUrl || (telefono ? `tel:${telefono}` : undefined);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className={cn('grid gap-6 items-start', items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
          {items.map((item) => {
            const isFeatured = !!item.destacado;
            return (
              <Card
                key={item.nombre}
                className={cn(
                  'bg-card flex flex-col transition-all duration-300',
                  isFeatured
                    ? 'border-2 border-gold/60 shadow-md relative md:-mt-4 md:mb-4'
                    : 'border border-border hover:border-gold/30',
                )}
              >
                {isFeatured && item.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gold text-foreground border-0 rounded-full px-4 py-0.5 text-xs font-semibold shadow-sm">
                      {item.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className={cn('pb-2', isFeatured && 'pt-8')}>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">
                    {item.nombre}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-serif text-4xl text-gold font-semibold">
                      {formatPrecio(item.precio)}
                    </p>
                    {item.precioNota && (
                      <p className="text-muted-foreground text-sm">{item.precioNota}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {item.descripcion && (
                    <p className={cn('text-muted-foreground text-sm leading-relaxed', item.cursos?.length ? 'mb-5' : 'mb-3')}>
                      {item.descripcion}
                    </p>
                  )}
                  {item.cursos && item.cursos.length > 0 && (
                    <ul className="space-y-2">
                      {item.cursos.map((c) => (
                        <li key={c} className="flex items-start gap-2">
                          <Check className="size-3.5 text-gold mt-0.5 shrink-0" />
                          <span className="text-sm text-foreground">{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.chip && (
                    <span className="inline-block text-xs bg-muted text-muted-foreground rounded-full px-3 py-1">
                      {item.chip}
                    </span>
                  )}
                </CardContent>

                <CardFooter>
                  {reservaHref ? (
                    <Button
                      asChild
                      variant={isFeatured ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-lg',
                        isFeatured
                          ? 'bg-forest text-white hover:bg-forest-dark'
                          : 'border-foreground/20 hover:border-gold/40 hover:text-gold',
                      )}
                    >
                      <a href={reservaHref} target={bookingUrl ? '_blank' : undefined} rel={bookingUrl ? 'noopener noreferrer' : undefined}>
                        {reservarLabel}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant={isFeatured ? 'default' : 'outline'}
                      className={cn(
                        'w-full rounded-lg',
                        isFeatured
                          ? 'bg-forest text-white hover:bg-forest-dark'
                          : 'border-foreground/20 hover:border-gold/40 hover:text-gold',
                      )}
                      disabled
                    >
                      {reservarLabel}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
