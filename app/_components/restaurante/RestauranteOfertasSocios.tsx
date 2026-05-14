import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Crown, Wine, Sparkles, Gift, Percent, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type OfertaPublic = {
  id: number;
  tipoOferta: string;
  titulo: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  valorFijoCents?: number | null;
  condicionTexto?: string | null;
  destacada?: boolean;
};

const TIPO_ICON: Record<string, LucideIcon> = {
  REGALO: Gift,
  DESCUENTO: Percent,
  BEBIDA: Wine,
  EXPERIENCIA: Sparkles,
  COMIDA: UtensilsCrossed,
};

interface Props {
  eyebrow: string;
  title: string;
  ofertas: OfertaPublic[];
  destacadaLabel: string;
  nuevaLabel: string;
  forMembersLabel: string;
}

function getHighlight(o: OfertaPublic, forMembersLabel: string): string {
  if (o.descuentoPorcentaje && o.descuentoPorcentaje > 0) return `−${o.descuentoPorcentaje}%`;
  if (o.valorFijoCents != null) {
    const eur = (o.valorFijoCents / 100).toFixed(2);
    return `${eur}€`;
  }
  if (o.tipoOferta === 'REGALO') return 'Gratis';
  if (o.tipoOferta === 'EXPERIENCIA') return 'Bajo reserva';
  return forMembersLabel;
}

export default function RestauranteOfertasSocios({
  eyebrow,
  title,
  ofertas,
  destacadaLabel,
  nuevaLabel,
  forMembersLabel,
}: Props) {
  if (ofertas.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="size-4 text-gold" />
            <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold">{eyebrow}</p>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground text-balance">{title}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ofertas.slice(0, 3).map((o, i) => {
            const Icon = TIPO_ICON[o.tipoOferta] ?? Sparkles;
            const showDestacada = !!o.destacada;
            const showNueva = !showDestacada && i === ofertas.length - 1;
            const highlight = getHighlight(o, forMembersLabel);
            return (
              <Card
                key={o.id}
                className="border border-border bg-card hover:border-gold/30 transition-all duration-300 group relative overflow-hidden"
              >
                {(showDestacada || showNueva) && (
                  <div className="absolute top-4 right-4">
                    {showDestacada ? (
                      <Badge className="bg-gold text-foreground border-0 rounded-full text-xs font-semibold">
                        {destacadaLabel}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gold/60 text-gold rounded-full text-xs">
                        {nuevaLabel}
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="pb-2 pt-6">
                  <div className="size-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                    <Icon className="size-5 text-gold" />
                  </div>
                  <h3 className="font-serif text-lg text-foreground leading-snug">{o.titulo}</h3>
                </CardHeader>

                <CardContent>
                  {o.descripcion && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {o.descripcion}
                    </p>
                  )}
                  <p className="font-serif text-2xl text-gold font-semibold">{highlight}</p>
                  {o.condicionTexto && (
                    <p className="text-xs text-muted-foreground mt-2">{o.condicionTexto}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
