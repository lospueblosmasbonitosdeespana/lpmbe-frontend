import { Phone, Mail, MessageCircle, Calendar, Globe, ExternalLink } from 'lucide-react';

const DIA_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface HorarioDia {
  diaSemana: number;
  abierto: boolean;
  horaAbre: string | null;
  horaCierra: string | null;
}

interface Props {
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  horariosSemana?: HorarioDia[];
  socialLinks: { key: string; url: string; label: string }[];
  contactDescription?: string;
  scheduleNote?: string;
  t: (key: string) => string;
}

function groupSchedule(horarios: HorarioDia[]): { range: string; hours: string }[] {
  if (!horarios || horarios.length === 0) return [];
  // Ordenar por día de semana
  const sorted = [...horarios].sort((a, b) => {
    // Convertir domingo (0) al final si llega así
    const order = (d: number) => (d === 0 ? 7 : d);
    return order(a.diaSemana) - order(b.diaSemana);
  });

  const groups: { range: string; hours: string }[] = [];
  let currentStart = sorted[0];
  let currentEnd = sorted[0];

  const sameHours = (a: HorarioDia, b: HorarioDia) =>
    a.abierto === b.abierto && a.horaAbre === b.horaAbre && a.horaCierra === b.horaCierra;

  const formatHours = (d: HorarioDia) =>
    d.abierto ? `${d.horaAbre ?? '—'} – ${d.horaCierra ?? '—'}` : 'Cerrado';

  const dayName = (d: number) => DIA_NOMBRES[d === 0 ? 6 : d - 1] ?? `Día ${d}`;

  for (let i = 1; i < sorted.length; i++) {
    if (sameHours(sorted[i], currentEnd)) {
      currentEnd = sorted[i];
    } else {
      groups.push({
        range: currentStart.diaSemana === currentEnd.diaSemana
          ? dayName(currentStart.diaSemana)
          : `${dayName(currentStart.diaSemana)} – ${dayName(currentEnd.diaSemana)}`,
        hours: formatHours(currentStart),
      });
      currentStart = sorted[i];
      currentEnd = sorted[i];
    }
  }
  groups.push({
    range: currentStart.diaSemana === currentEnd.diaSemana
      ? dayName(currentStart.diaSemana)
      : `${dayName(currentStart.diaSemana)} – ${dayName(currentEnd.diaSemana)}`,
    hours: formatHours(currentStart),
  });
  return groups;
}

export default function PremiumContactSection({
  telefono, email, web, whatsapp, bookingUrl, horariosSemana, socialLinks, contactDescription, scheduleNote, t,
}: Props) {
  const methods: { icon: typeof Phone; label: string; value: string; href: string }[] = [];
  if (telefono) methods.push({ icon: Phone, label: t('phone'), value: telefono, href: `tel:${telefono.replace(/\s/g, '')}` });
  if (email) methods.push({ icon: Mail, label: t('email'), value: email, href: `mailto:${email}` });
  if (whatsapp) methods.push({ icon: MessageCircle, label: 'WhatsApp', value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, '')}` });
  if (web) {
    let displayValue = web;
    try { displayValue = new URL(web.startsWith('http') ? web : `https://${web}`).hostname; } catch {}
    methods.push({ icon: Globe, label: t('website'), value: displayValue, href: web.startsWith('http') ? web : `https://${web}` });
  }

  const grouped = horariosSemana ? groupSchedule(horariosSemana) : [];
  const hasHours = grouped.length > 0;

  if (methods.length === 0 && !hasHours && !bookingUrl) return null;

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className={`grid ${hasHours ? 'lg:grid-cols-2' : ''} gap-12 lg:gap-20`}>
          <div>
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-3">
              {t('contactSubtitle')}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
              {t('contactTitle')}
            </h2>
            {contactDescription && (
              <p className="text-muted-foreground leading-relaxed mb-8">
                {contactDescription}
              </p>
            )}

            {methods.length > 0 && (
              <div className="space-y-3">
                {methods.map((method, index) => (
                  <a
                    key={index}
                    href={method.href}
                    target={method.icon === Globe ? '_blank' : undefined}
                    rel={method.icon === Globe ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-gold/30 transition-all group"
                  >
                    <div className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                      <method.icon className="size-5 text-primary group-hover:text-gold transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{method.label}</p>
                      <p className="text-foreground font-medium truncate">{method.value}</p>
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
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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
                {grouped.map((g, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-border last:border-0">
                    <span className="text-foreground font-medium">{g.range}</span>
                    <span className="text-muted-foreground">{g.hours}</span>
                  </div>
                ))}
              </div>

              {scheduleNote && (
                <div className="mt-6 rounded-lg bg-muted/50 border border-border p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">Nota:</span>{' '}
                    {scheduleNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
