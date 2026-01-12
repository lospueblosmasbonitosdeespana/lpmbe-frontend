import DescripcionPuebloClient from "./DescripcionPuebloClient";

export default async function DescripcionPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <DescripcionPuebloClient slug={slug} />;
}
