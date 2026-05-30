'use client';

import { useEffect, useState } from 'react';
import PropertyDetail from '../[id]/PropertyDetail';
import { getSubmittedProperties, importSharedProperty } from '@/lib/store';
import { Property } from '@/lib/types';

function decodeShareData(encoded: string): Property | null {
  try {
    const binString = atob(encoded);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return JSON.parse(new TextDecoder().decode(bytes)) as Property;
  } catch {
    return null;
  }
}

export default function PropertyFallback() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const propertyId = parts[parts.length - 1];
    if (!propertyId || propertyId === 'fallback') return;

    const submitted = getSubmittedProperties();
    if (submitted.find((p) => p.id === propertyId)) {
      setId(propertyId);
      return;
    }

    // Try to decode property from URL hash (cross-device share link)
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const property = decodeShareData(hash.slice(7));
      if (property) {
        importSharedProperty(property);
      }
    }

    setId(propertyId);
  }, []);

  if (!id) return null;
  return <PropertyDetail id={id} />;
}
