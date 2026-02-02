import EnCifrasClient from "./EnCifrasClient";

export default async function EnCifrasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EnCifrasClient slug={slug} />;
}
