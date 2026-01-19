'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: '14px',
        color: '#666',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      type="button"
      className="link-volver"
    >
      ← Volver
    </button>
  );
}
