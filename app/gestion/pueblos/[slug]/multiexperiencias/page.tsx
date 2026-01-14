import MultiexperienciasPuebloClient from "./MultiexperienciasPuebloClient";

export default async function MultiexperienciasPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MultiexperienciasPuebloClient slug={slug} />;
}
