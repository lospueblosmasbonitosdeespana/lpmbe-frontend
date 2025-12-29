'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfileForm({ initialNombre }: { initialNombre: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialNombre);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setError(null);

    const value = nombre.trim();
    if (!value) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/usuarios/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: value }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo guardar');
        return;
      }

      setOk('Guardado');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSave} className="rounded-md border p-4">
      <div className="font-medium">Perfil</div>

      <div className="mt-3 space-y-2">
        <label className="block text-sm">Nombre</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
        />
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="mt-2 text-sm text-green-700">{ok}</p> : null}

      <button
        className="mt-4 rounded-md border px-3 py-2"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}





