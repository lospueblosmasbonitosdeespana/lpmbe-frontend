import Link from 'next/link';
import { Gift } from 'lucide-react';

interface Props {
  t: (key: string) => string;
}

export default function PremiumMembershipCTA({ t }: Props) {
  return (
    <section className="px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 md:p-14 text-center">
          <div className="size-14 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-5">
            <Gift className="size-7 text-gold" />
          </div>

          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            {t('becomeMemberTitle')}
          </h2>

          <p className="text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">
            {t('becomeMemberDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/club"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-8 py-3 text-base font-semibold text-foreground hover:bg-gold-dark transition-colors"
            >
              {t('joinNow')}
            </Link>
            <Link
              href="/club"
              className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/30 px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              {t('learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
