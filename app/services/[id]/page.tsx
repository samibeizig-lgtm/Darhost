import ServiceDetail from './ServiceDetail';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function ServicePage() {
  return <ServiceDetail />;
}
