import { getProducts } from '@/src/lib/tiendaApi';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Grid } from '@/app/components/ui/grid';
import { Display, Lead, Eyebrow, Headline } from '@/app/components/ui/typography';
import { ProductCard } from '@/app/_components/tienda/ProductCard';
import { NewsletterCta } from '@/app/_components/tienda/NewsletterCta';
import type { Product } from '@/src/types/tienda';
import { cn } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function TiendaPage() {
  const t = await getTranslations('tienda');
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : t('errorLoading');
  }

  const activeProducts = products
    .filter((p) => p.activo)
    .sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return a.orden - b.orden;
    });

  const destacados = activeProducts.filter((p) => p.destacado);

  const benefitIcons = [
    <svg key="ship" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    <svg key="secure" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    <svg key="artisan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    <svg key="certified" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
  ];

  const benefits = [
    { icon: benefitIcons[0], title: t('benefitFreeShipping'), description: t('benefitFreeShippingDesc') },
    { icon: benefitIcons[1], title: t('benefitSecurePayment'), description: t('benefitSecurePaymentDesc') },
    { icon: benefitIcons[2], title: t('benefitArtisan'), description: t('benefitArtisanDesc') },
    { icon: benefitIcons[3], title: t('benefitCertified'), description: t('benefitCertifiedDesc') },
  ];

  return (
    <>
      {/* Hero */}
      <Section spacing="none" className="relative">
        <Container className="relative py-16 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow className="mb-4">{t('heroEyebrow')}</Eyebrow>
            <Display className="mb-6">{t('heroTitle')}</Display>
            <Lead className="text-foreground/80">{t('heroDesc')}</Lead>
          </div>
        </Container>
      </Section>

      {/* Benefits Bar */}
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

      <Section spacing="lg">
        <Container>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {!error && activeProducts.length === 0 && (
            <div className="rounded-lg bg-muted p-12 text-center">
              <p className="text-muted-foreground">{t('noProducts')}</p>
            </div>
          )}

          {!error && activeProducts.length > 0 && (
            <>
              {destacados.length > 0 && (
                <div className={cn(destacados.length > 0 ? 'mb-12' : '')}>
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <Eyebrow className="mb-2">{t('featuredEyebrow')}</Eyebrow>
                      <Headline as="h2">{t('featuredTitle')}</Headline>
                    </div>
                  </div>
                  <Grid columns={4} gap="md">
                    {destacados.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </Grid>
                </div>
              )}

              <div>
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <Eyebrow className="mb-2">{t('exploreEyebrow')}</Eyebrow>
                    <Headline as="h2">
                      {destacados.length > 0 ? t('allProducts') : t('products')}
                    </Headline>
                  </div>
                </div>
                <Grid columns={4} gap="md">
                  {activeProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </Grid>
              </div>
            </>
          )}
        </Container>
      </Section>

      <NewsletterCta />
    </>
  );
}
