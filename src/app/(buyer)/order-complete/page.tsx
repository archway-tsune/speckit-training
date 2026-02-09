'use client';

import { Suspense } from 'react';
import { OrderCompletePage } from '@/domains/orders/ui';

export default function OrderCompletePageRoute() {
  return (
    <Suspense>
      <OrderCompletePage />
    </Suspense>
  );
}
