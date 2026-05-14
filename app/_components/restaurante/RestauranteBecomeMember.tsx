import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { Gift } from 'lucide-react';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  joinNowLabel: string;
  learnMoreLabel: string;
  joinNowHref?: string;
  learnMoreHref?: string;
}

export default function RestauranteBecomeMember({
  eyebrow,
  title,
  description,
  joinNowLabel,
  learnMoreLabel,
  joinNowHref = '/club/hazte-socio',
  learnMoreHref = '/club',
}: Props) {
  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-forest rounded-2xl px-8 py-14 md:py-20 text-center">
          <div className="size-16 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto mb-7">
            <Gift className="size-8 text-gold" />
          </div>

          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-4">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-white text-balance mb-6">{title}</h2>
          <p className="text-white/70 max-w-xl mx-auto leading-relaxed mb-10">{description}</p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="rounded-lg py-3 px-8 bg-gold text-foreground hover:bg-gold-dark font-semibold text-base h-auto"
            >
              <Link href={joinNowHref}>{joinNowLabel}</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-lg py-3 px-8 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white hover:border-white/50 text-base h-auto"
            >
              <Link href={learnMoreHref}>{learnMoreLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
