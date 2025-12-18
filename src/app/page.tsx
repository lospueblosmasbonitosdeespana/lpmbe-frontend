export default async function PueblosPage() {
  const res = await fetch('http://localhost:3000/pueblos', {
    cache: 'no-store',
  });

  const pueblos = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1>Pueblos</h1>

      <ul>
        {pueblos.map((p: any) => (
          <li key={p.id}>{p.nombre}</li>
        ))}
      </ul>
    </main>
  );
}