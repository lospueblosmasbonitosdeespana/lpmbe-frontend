import FotosPuebloClient from "./FotosPuebloClient";

export default async function FotosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FotosPuebloClient slug={slug} />;
}
