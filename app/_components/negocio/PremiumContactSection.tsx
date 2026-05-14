import { Phone, Mail, MessageCircle, Calendar, Globe, ExternalLink } from 'lucide-react';

const DIA_NOMBRES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Props {
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  horariosSemana?: Array<{
    diaSemana: number;
    abierto: boolean;
    horaAbre: string | null;
    horaCierra: string | null;
  }>;
  socialLinks: { key: string; url: string; label: string }[];
  t: (key: string) => string;
}

export default function PremiumContactSection({
  telefono, email, web, whatsapp, bookingUrl, horariosSemana, socialLinks, t,
}: Props) {
  const methods: { icon: typeof Phone; label: string; value: string; href: string }[] = [];
  if (telefono) methods.push({ icon: Phone, label: t('phone'), value: telefono, href: `tel:${telefono.replace(/\s/g, '')}` });
  if (email) methods.push({ icon: Mail, label: t('email'), value: email, href: `mailto:${email}` });
  if (whatsapp) methods.push({ icon: MessageCircle, label: 'WhatsApp', value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, '')}` });
  if (web) methods.push({ icon: Globe, label: t('website'), value: new URL(web.startsWith('http') ? web : `https://${web}`).hostname, href: web.startsWith('http') ? web : `https://${web}` });

  const hasHours = horariosSemana && horariosSemana.length > 0;

  if (methods.length === 0 && !hasHours && !bookingUrl) return null;

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className={`grid ${hasHours ? 'lg:grid-cols-2' : ''} gap-12 lg:gap-20`}>
          <div>
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
              {t('contactSubtitle')}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-8">
              {t('contactTitle')}
            </h2>

            {methods.length > 0 && (
              <div className="space-y-4">
                {methods.map((method, index) => (
                  <a
                    key={index}
                    href={method.href}
                    target={method.icon === Globe ? '_blank' : undefined}
                    rel={method.icon === Globe ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-5 p-5 bg-card rounded-lg border border-border hover:border-gold/30 transition-all group"
                  >
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                      <method.icon className="size-5 text-primary group-hover:text-gold transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{method.label}</p>
                      <p className="text-foreground font-medium">{method.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {bookingUrl && (
              <div className="mt-8">
                <a
                  href={bookingUrl.startsWith('http') ? bookingUrl : `https://${bookingUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg bg-gold px-8 py-4 text-base font-semibold text-foreground hover:bg-gold-dark transition-colors"
                >
                  <Calendar className="size-5" />
                  {t('bookNow')}
                </a>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-gold/30 hover:text-gold transition-all"
                  >
                    <ExternalLink className="size-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {hasHours && (
            <div className="bg-card rounded-lg border border-border p-8 md:p-10">
              <h3 className="text-2xl font-serif text-foreground mb-8">
                {t('openingHours')}
              </h3>
              <div className="space-y-4">
                {horariosSemana!.map((h) => (
                  <div key={h.diaSemana} className="flex justify-between items-center pb-4 border-b border-border last:border-0">
                    <span className="text-foreground font-medium">{DIA_NOMBRES[h.diaSemana] ?? `Día ${h.diaSemana}`}</span>
                    <span className="text-muted-foreground">
                      {h.abierto
                        ? `${h.horaAbre ?? '—'} – ${h.horaCierra ?? '—'}`
                        : t('closed')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
