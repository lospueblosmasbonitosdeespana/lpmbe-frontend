import GestionBackLink from "../../_components/GestionBackLink";

export default async function GestionPuebloLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const backHref = `/gestion/pueblos/${slug}`;
  return (
    <>
      <GestionBackLink href={backHref} label="Volver a Gestión del pueblo" />
      {children}
    </>
  );
}
