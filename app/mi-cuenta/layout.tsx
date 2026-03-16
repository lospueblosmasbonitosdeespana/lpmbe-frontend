import type { Metadata } from 'next';
import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/me";
import MiCuentaBreadcrumbs from "./components/MiCuentaBreadcrumbs";
import { Container } from "@/app/components/ui/container";

export const metadata: Metadata = {
  title: 'Mi cuenta',
  robots: { index: false, follow: false },
};

export default async function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMeServer();
  if (!me) redirect("/entrar");

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background py-4">
        <Container>
          <MiCuentaBreadcrumbs />
        </Container>
      </section>
      {children}
    </main>
  );
}
