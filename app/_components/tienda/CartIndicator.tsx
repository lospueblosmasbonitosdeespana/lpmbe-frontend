'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/src/store/cart';

export default function CartIndicator() {
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());

  // Solo activar el contador tras montar en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Contador seguro: 0 en SSR, real en CSR tras mount
  const safeCount = mounted ? itemCount : 0;
  
  // Title consistente: solo cambia tras mount
  const title = mounted && safeCount > 0 ? `Carrito (${safeCount})` : 'Carrito';

  return (
    <Link
      href="/tienda/carrito"
      className="relative text-gray-700 hover:text-gray-900"
      title={title}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
      {/* Badge solo visible tras mount y si hay items */}
      {mounted && safeCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {safeCount > 9 ? '9+' : safeCount}
        </span>
      )}
    </Link>
  );
}
