'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Plane, Car, Map, Zap, MoreHorizontal, Star, MapPin } from 'lucide-react';
import { syncServicesFromRemote } from '@/lib/store';
import { Service, ServiceType } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import { wilayasTunisie } from '@/lib/data';

const TYPE_ICONS: Record<ServiceType | 'all', React.ElementType> = {
  all: Search, transfert: Plane, voiture: Car, guide: Map, activite: Zap, autre: MoreHorizontal,
};
const TYPE_COLORS: Record<ServiceType, string> = {
  transfert: 'bg-blue-100 text-blue-700',
  voiture: 'bg-purple-100 text-purple-700',
  guide: 'bg-green-100 text-green-700',
  activite: 'bg-orange-100 text-orange-700',
  autre: 'bg-gray-100 text-gray-600',
};

function ServicesInner() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncServicesFromRemote().then(all => { setServices(all.filter(s => s.available)); setLoading(false); });
  }, []);

  const types: (ServiceType | 'all')[] = ['all', 'transfert', 'voiture', 'guide', 'activite', 'autre'];

  const filtered = services.filter(s => {
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (wilayaFilter && s.wilaya !== wilayaFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('service.browse_title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} service{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un service..." className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" />
        </div>
        <select value={wilayaFilter} onChange={e => setWilayaFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
          <option value="">Tous les gouvernorats</option>
          {wilayasTunisie.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {types.map(type => {
          const Icon = TYPE_ICONS[type];
          const isActive = typeFilter === type;
          return (
            <button key={type} onClick={() => setTypeFilter(type)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              isActive ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}>
              <Icon size={14} />
              {type === 'all' ? t('service.all_types') : t(`service.type_${type}`)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-[4/3] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">{t('service.no_results')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => {
            const Icon = TYPE_ICONS[s.type];
            const colorCls = TYPE_COLORS[s.type];
            return (
              <Link key={s.id} href={`/services/${s.id}`} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video overflow-hidden bg-gray-100 relative">
                  {s.images[0] ? (
                    <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={36} className="text-gray-300" />
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${colorCls}`}>
                    <Icon size={10} /> {t(`service.type_${s.type}`)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{s.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin size={11} /> {s.location}, {s.wilaya}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0F4C8A]">{s.price} DT</span>
                      <span className="text-gray-400 text-xs ml-1">{t(`service.price_unit_${s.priceUnit}`)}</span>
                    </div>
                    {s.reviewCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span>{s.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  return <Suspense><ServicesInner /></Suspense>;
}
