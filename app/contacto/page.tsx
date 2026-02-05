import { headers } from "next/headers";
import { MapPin, Phone, Mail, FileText } from "lucide-react";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import {
  Display,
  Lead,
  Caption,
} from "@/app/components/ui/typography";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";

type SiteSettings = {
  contactAddress?: string | null;
  contactPhone?: string | null;
  contactPressPhone?: string | null;
  contactEmail?: string | null;
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/public/site-settings`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Settings not available");
    return res.json();
  } catch {
    return {};
  }
}

export default async function ContactoPage() {
  const settings = await fetchSiteSettings();

  const address = settings.contactAddress?.trim();
  const phone = settings.contactPhone?.trim();
  const pressPhone = settings.contactPressPhone?.trim();
  const email = settings.contactEmail?.trim();

  const hasContactInfo = !!(address || phone || pressPhone || email);

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Contacto" }]} />
        </Container>
      </Section>

      {/* Hero / Contact info arriba */}
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">Contacto</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Estamos aquí para ayudarte. Escríbenos o llámanos.
              </Lead>

              {hasContactInfo && (
                <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <MapPin className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">Dirección</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {address}
                      </p>
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <Phone className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">Teléfono</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {phone}
                      </p>
                    </a>
                  )}
                  {pressPhone && (
                    <a
                      href={`tel:${pressPhone.replace(/\s/g, "")}`}
                      className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <FileText className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">Prensa</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {pressPhone}
                      </p>
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <Mail className="mb-3 h-8 w-8 text-primary" />
                      <Caption className="mb-1 font-medium">Email</Caption>
                      <p className="text-center text-sm text-muted-foreground group-hover:text-foreground">
                        {email}
                      </p>
                    </a>
                  )}
                </div>
              )}

              {!hasContactInfo && (
                <p className="text-sm text-muted-foreground">
                  Los datos de contacto se configuran en la gestión de la asociación.
                </p>
              )}
            </div>
          </Container>
        </div>
      </Section>

      {/* Formulario Escríbenos */}
      <Section spacing="lg" background="default">
        <Container>
          <h2 className="mb-6 font-serif text-2xl font-medium">Escríbenos</h2>
          <ContactForm defaultEmail={email ?? undefined} />
        </Container>
      </Section>
    </main>
  );
}
