import GestionBackLink from "../_components/GestionBackLink";

export default function GestionAsociacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GestionBackLink href="/gestion/asociacion" label="Volver a Gestión · Asociación" />
      {children}
    </>
  );
}
