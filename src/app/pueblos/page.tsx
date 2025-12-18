import { getPueblos } from '@/lib/api/pueblos';
import Link from 'next/link';

export default async function PueblosPage() {
  const pueblos = await getPueblos();

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>
        Pueblos
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 24,
        }}
      >
        {pueblos.map((p: any) => (
          <Link
            key={p.id}
            href={`/pueblos/${p.slug}`}
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: 16,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong style={{ fontSize: 18 }}>
              {p.nombre}
            </strong>

            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              {p.provincia}
            </div>

            <div style={{ fontSize: 13, color: '#999' }}>
              {p.comunidad}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}