import { properties } from '@/lib/data';
import PropertyDetail from './PropertyDetail';

export function generateStaticParams() {
  const fromData = properties.map((p) => ({ id: p.id }));
  return fromData.length > 0 ? fromData : [{ id: '_' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <PropertyDetail id={params.id} />;
}
