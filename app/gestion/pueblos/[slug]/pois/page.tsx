import PoisPuebloClient from "./PoisPuebloClient";

export default async function PoisPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PoisPuebloClient slug={slug} />;
}
