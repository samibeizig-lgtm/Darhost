'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, Plane, Car, Map, Zap, MoreHorizontal } from 'lucide-react';
import { getUser, getUserServices, syncServicesFromRemote } from '@/lib/store';
import { Service, ServiceType } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const TYPE_ICONS: Record<ServiceType, React.ElementType> = {
  transfert: Plane, voiture: Car, guide: Map, activite: Zap, autre: MoreHorizontal,
};
const TYPE_COLORS: Record<ServiceType, string> = {
  transfert: 'bg-blue-100 text-blue-700',
  voiture: 'bg-purple-100 text-purple-700',
  guide: 'bg-green-100 text-green-700',
  activite: 'bg-orange-100 text-orange-700',
  autre: 'bg-gray-100 text-gray-600',
};

export default function PrestataireServices() {
  const { t } = useLanguage();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/prestataire/services'); return; }
    if (u.role !== 'prestataire') { router.push('/'); return; }
    setChecked(true);
    syncServicesFromRemote().then(all => setServices(all.filter(s => s.providerId === u.id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('prestataire.my_services')}</h1>
        <Link href="/prestataire/submit" className="flex items-center gap-2 px-4 py-2.5 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] transition-colors">
          <Plus size={16} /> {t('prestataire.new_service')}
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="font-semibold text-gray-700 mb-1">{t('prestataire.no_services')}</h3>
          <p className="text-gray-400 text-sm mb-6">{t('prestataire.no_services_sub')}</p>
          <Link href="/prestataire/submit" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] transition-colors">
            <Plus size={18} /> {t('prestataire.new_service')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => {
            const Icon = TYPE_ICONS[s.type];
            const colorCls = TYPE_COLORS[s.type];
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-video overflow-hidden bg-gray-100">
                  {s.images[0] ? (
                    <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={32} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">{s.title}</h3>
                    <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colorCls}`}>
                      <Icon size={10} /> {t(`service.type_${s.type}`)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{s.location}, {s.wilaya}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F4C8A]">{s.price} DT <span className="font-normal text-gray-400 text-xs">{t(`service.price_unit_${s.priceUnit}`)}</span></span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.available ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
