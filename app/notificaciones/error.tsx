"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Ha ocurrido un error en Notificaciones</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message || error)}</pre>
      <button onClick={() => reset()}>Reintentar</button>
    </div>
  );
}




