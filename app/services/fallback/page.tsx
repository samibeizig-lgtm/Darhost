'use client';

import { useEffect, useState } from 'react';
import ServiceDetail from '../[id]/ServiceDetail';

export default function ServiceFallback() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const serviceId = parts[parts.length - 1];
    if (!serviceId || serviceId === 'fallback') return;
    setId(serviceId);
  }, []);

  if (!id) return null;
  return <ServiceDetail id={id} />;
}
