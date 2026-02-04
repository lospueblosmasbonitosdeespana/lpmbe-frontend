'use client';

import dynamic from 'next/dynamic';

const CartIndicator = dynamic(() => import('./CartIndicator').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-6 w-6" aria-hidden />
  ),
});

export default function CartIndicatorWrapper() {
  return <CartIndicator />;
}
