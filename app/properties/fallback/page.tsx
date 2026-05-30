'use client';

import { useEffect, useState } from 'react';
import PropertyDetail from '../[id]/PropertyDetail';

export default function PropertyFallback() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const propertyId = parts[parts.length - 1];
    if (propertyId && propertyId !== 'fallback') {
      setId(propertyId);
    }
  }, []);

  if (!id) return null;
  return <PropertyDetail id={id} />;
}
