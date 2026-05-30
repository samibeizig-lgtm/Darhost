import { properties } from '@/lib/data';
import PropertyDetail from './PropertyDetail';

export const runtime = 'edge';

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export default function Page({ params }: { params: { id: string } }) {
  return <PropertyDetail id={params.id} />;
}
