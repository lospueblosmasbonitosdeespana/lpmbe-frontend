export async function getPueblos() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pueblos`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Error al cargar pueblos');
  }

  return res.json();
}

