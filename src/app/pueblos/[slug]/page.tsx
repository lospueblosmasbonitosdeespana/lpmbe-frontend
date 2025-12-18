type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PuebloPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32 }}>
        Pueblo: {slug}
      </h1>

      <p style={{ marginTop: 16, color: '#666' }}>
        Página de ficha del pueblo (slug dinámico).
      </p>
    </main>
  );
}