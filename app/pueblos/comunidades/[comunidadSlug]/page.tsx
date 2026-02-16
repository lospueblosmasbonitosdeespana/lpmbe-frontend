import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPueblosLite, type PuebloLite } from "@/lib/api";
import { findCcaaBySlug, norm } from "../../../_components/pueblos/ccaa.config";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead, Title } from "@/app/components/ui/typography";

export default async function ComunidadDetallePage({
  params,
}: {
  params: Promise<{ comunidadSlug: string }>;
}) {
  const { comunidadSlug } = await params;
  const ccaa = findCcaaBySlug(comunidadSlug);
  if (!ccaa) return notFound();
  const locale = await getLocale();
  const pueblos = await getPueblosLite(locale);
  const dentro = pueblos.filter((p) => norm(p.comunidad ?? "") === norm(ccaa.name));

  if (dentro.length === 0) {
    return (
      <main>
        <Section spacing="none" background="default">
          <Container className="pt-4">
            <Breadcrumbs items={[{ label: "Pueblos", href: "/pueblos" }, { label: "Comunidades", href: "/pueblos/comunidades" }, { label: ccaa.name }]} />
          </Container>
        </Section>
        <Section spacing="lg" background="default">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
            <Container className="relative">
              <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
                <div className="mb-6 flex items-center justify-center gap-4">
                  {ccaa.flagSrc && (
                    <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-card">
                      <Image src={ccaa.flagSrc} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  )}
                  <Display>{ccaa.name}</Display>
                </div>
                <Lead className="mb-8 text-muted-foreground">0 pueblos</Lead>
              </div>
            </Container>
          </div>
        </Section>
        <Section spacing="lg" background="default">
          <Container>
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Todavía no hay pueblos de la Asociación en esta región.
              </p>
              <Link
                href="/pueblos/comunidades"
                className="mt-6 inline-block font-medium text-primary hover:underline"
              >
                ← Volver a comunidades
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const map = new Map<string, PuebloLite[]>();
  for (const p of dentro) {
    const prov = (p.provincia ?? "Sin provincia").trim() || "Sin provincia";
    if (!map.has(prov)) map.set(prov, []);
    map.get(prov)!.push(p);
  }

  const provincias = Array.from(map.entries())
    .map(([provincia, items]) => ({
      provincia,
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }))
    .sort((a, b) => a.provincia.localeCompare(b.provincia, "es"));

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Pueblos", href: "/pueblos" }, { label: "Comunidades", href: "/pueblos/comunidades" }, { label: ccaa.name }]} />
        </Container>
      </Section>
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <div className="mb-6 flex items-center justify-center gap-4">
                {ccaa.flagSrc && (
                  <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-card">
                    <Image src={ccaa.flagSrc} alt="" fill className="object-cover" sizes="80px" />
                  </div>
                )}
                <Display>{ccaa.name}</Display>
              </div>
              <Lead className="mb-4 text-muted-foreground">{dentro.length} pueblos</Lead>
              <Link
                href="/pueblos/comunidades"
                className="text-sm font-medium text-primary hover:underline"
              >
                Cambiar comunidad
              </Link>
            </div>
          </Container>
        </div>
      </Section>
      <Section spacing="lg" background="default">
        <Container>
          <div className="space-y-10">
            {provincias.map(({ provincia, items }) => (
              <section key={provincia}>
                <div className="mb-4 flex items-baseline justify-between">
                  <Title as="h2">{provincia}</Title>
                  <span className="text-sm text-muted-foreground">
                    {items.length} pueblo{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pueblos/${p.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="font-semibold text-foreground group-hover:text-primary">{p.nombre}</div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

