'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, Clock, TrendingUp, ChevronRight, Briefcase } from 'lucide-react';
import { getUser, getUserServices, syncServiceBookingsFromRemote } from '@/lib/store';
import { ServiceBooking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
function fmtDate(s: string) { const [,m,d]=s.split('-').map(Number); return `${d} ${MONTHS_FR[m-1]}`; }

export default function PrestataireDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [checked, setChecked] = useState(false);
  const user = typeof window !== 'undefined' ? getUser() : null;

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/prestataire/dashboard'); return; }
    if (u.role !== 'prestataire') { router.push('/'); return; }
    setChecked(true);
    syncServiceBookingsFromRemote(u.id).then(all => {
      setBookings(all.filter(b => b.providerId === u.id));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  const services = user ? getUserServices(user.id) : [];
  const pending = bookings.filter(b => b.status === 'pending');
  const thisMonth = new Date().getMonth();
  const revenue = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.createdAt).getMonth() === thisMonth)
    .reduce((s, b) => s + b.total, 0);
  const recent = [...bookings].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);

  const stats = [
    { label: t('prestataire.total_services'), value: services.length, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
    { label: t('prestataire.pending_count'), value: pending.length, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: t('prestataire.revenue'), value: `${revenue.toLocaleString()} DT`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500">{t('prestataire.welcome')}</p>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name?.split(' ')[0]}</h1>
        </div>
        <Link href="/prestataire/submit" className="flex items-center gap-2 px-4 py-2.5 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] transition-colors">
          <Plus size={16} /> {t('prestataire.new_service')}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('prestataire.reservations')}</h2>
          <Link href="/prestataire/reservations" className="text-sm text-[#0F4C8A] font-medium hover:underline flex items-center gap-1">
            {t('prestataire.view_services')} <ChevronRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <Package size={32} className="mx-auto mb-3 text-gray-200" />
            {t('prestataire.no_bookings')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map(b => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center shrink-0 text-sm font-bold">
                  {b.guestName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.guestName}</p>
                  <p className="text-xs text-gray-500 truncate">{b.serviceTitle} · {fmtDate(b.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{b.total} DT</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.status === 'pending' ? 'bg-orange-100 text-orange-700'
                    : b.status === 'confirmed' ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>{b.status === 'pending' ? t('prestataire.tab_pending') : b.status === 'confirmed' ? t('prestataire.tab_confirmed') : b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/prestataire/services" className="block w-full py-3.5 text-center text-[#0F4C8A] font-semibold text-sm border border-[#0F4C8A]/30 rounded-2xl hover:bg-[#E8F0FB] transition-colors">
        {t('prestataire.view_services')}
      </Link>
    </div>
  );
}
