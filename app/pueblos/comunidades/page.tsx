import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { CCAA, norm } from "../../_components/pueblos/ccaa.config";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  comunidad?: string | null;
};

async function getPueblos(): Promise<Pueblo[]> {
  const res = await fetch(`${getApiUrl()}/pueblos`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function ComunidadesPage() {
  const pueblos = await getPueblos();

  const countByComunidad = new Map<string, number>();
  for (const p of pueblos) {
    const c = (p.comunidad ?? "").trim();
    if (!c) continue;
    countByComunidad.set(c, (countByComunidad.get(c) ?? 0) + 1);
  }

  const visible = CCAA.filter((c) => {
    if (c.slug === "murcia") return true;
    const total =
      Array.from(countByComunidad.entries()).find(([name]) => norm(name) === norm(c.name))?.[1] ?? 0;
    return total > 0;
  });

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Pueblos", href: "/pueblos" }, { label: "Comunidades autónomas" }]} />
        </Container>
      </Section>

      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">Comunidades autónomas</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Elige una comunidad autónoma para ver provincias y pueblos.
              </Lead>
            </div>
          </Container>
        </div>
      </Section>

      <Section spacing="lg" background="default">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => {
              const total =
                Array.from(countByComunidad.entries()).find(([name]) => norm(name) === norm(c.name))?.[1] ?? 0;

              return (
                <Link
                  key={c.slug}
                  href={`/pueblos/comunidades/${c.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {c.flagSrc ? (
                      <Image
                        src={c.flagSrc}
                        alt={`Bandera de ${c.name}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary">{c.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {total > 0 ? `${total} pueblo${total === 1 ? "" : "s"}` : "Todavía sin pueblos"}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>
    </main>
  );
}
