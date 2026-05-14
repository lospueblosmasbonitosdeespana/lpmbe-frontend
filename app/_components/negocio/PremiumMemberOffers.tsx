import { Crown, Gift, Percent, Tag, Wine, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

type OfertaPublic = {
  id: number;
  tipoOferta: string;
  titulo: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  valorFijoCents?: number | null;
  aplicaA?: string | null;
  condicionTexto?: string | null;
  destacada: boolean;
};

interface Props {
  ofertas: OfertaPublic[];
  descuentoPorcentaje?: number | null;
  t: (key: string) => string;
}

const TIPO_ICONS: Record<string, typeof Gift> = {
  DESCUENTO: Percent,
  REGALO: Gift,
  MENU: UtensilsCrossed,
  BEBIDA: Wine,
  EXPERIENCIA: Sparkles,
  OTRO: Tag,
};

export default function PremiumMemberOffers({ ofertas, descuentoPorcentaje, t }: Props) {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Crown className="size-5 text-gold" />
              <p className="text-gold text-sm tracking-[0.2em] uppercase">
                {t('offersSubtitle')}
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground">
              {t('offersTitle')}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
              {t('offersDescription')}
            </p>
          </div>

          {descuentoPorcentaje != null && descuentoPorcentaje > 0 && (
            <Badge variant="gold" className="px-4 py-2 text-sm font-bold self-start md:self-auto">
              -{descuentoPorcentaje}% {t('forMembers')}
            </Badge>
          )}
        </div>

        <div className={`grid gap-8 ${ofertas.length >= 3 ? 'md:grid-cols-3' : ofertas.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {ofertas.map((oferta, index) => {
            const Icon = TIPO_ICONS[oferta.tipoOferta] ?? Gift;
            const showFeaturedBadge = index === 0 && ofertas.length > 1;
            const showNewBadge = index === ofertas.length - 1 && ofertas.length > 1;
            return (
              <div
                key={oferta.id}
                className="relative bg-card rounded-lg border border-border p-8 hover:border-gold/30 transition-all group flex flex-col"
              >
                {showFeaturedBadge && (
                  <Badge variant="gold" className="absolute -top-3 right-6">
                    {t('featured')}
                  </Badge>
                )}
                {showNewBadge && !showFeaturedBadge && (
                  <Badge variant="outline" className="absolute -top-3 right-6 bg-card border-gold/40 text-gold">
                    Nueva
                  </Badge>
                )}

                <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center mb-5">
                  <Icon className="size-6 text-gold" />
                </div>

                <h3 className="text-xl font-serif text-foreground mb-3">
                  {oferta.titulo}
                </h3>

                {oferta.descripcion && (
                  <p className="text-muted-foreground leading-relaxed mb-5 flex-1">
                    {oferta.descripcion}
                  </p>
                )}

                {(oferta.descuentoPorcentaje != null || oferta.valorFijoCents != null) && (
                  <div className="pt-4 border-t border-border">
                    {oferta.descuentoPorcentaje != null && (
                      <div className="flex items-center gap-2 text-gold font-semibold">
                        <Percent className="size-4" />
                        <span>-{oferta.descuentoPorcentaje}% para socios</span>
                      </div>
                    )}
                    {oferta.valorFijoCents != null && oferta.descuentoPorcentaje == null && (
                      <div className="flex items-center gap-2 text-gold font-semibold">
                        <Tag className="size-4" />
                        <span>{(oferta.valorFijoCents / 100).toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {oferta.condicionTexto && (
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    {oferta.condicionTexto}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
