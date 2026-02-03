'use client';

import { Suspense } from 'react';
import CheckoutReturnClient from '@/src/components/checkout/CheckoutReturnClient';

export default function CheckoutReturnPage() {
  return (
    <Suspense>
      <CheckoutReturnClient />
    </Suspense>
  );
}
