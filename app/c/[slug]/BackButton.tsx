'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="link-volver bg-transparent border-0 p-0 text-sm text-muted-foreground cursor-pointer font-inherit"
      type="button"
    >
      ← Volver
    </button>
  );
}
