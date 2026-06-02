'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ChevronRight, Plus } from 'lucide-react';
import { getUser, syncPropertiesFromRemote, getBookings, cancelExpiredBookings } from '@/lib/store';
import { Property } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

function toStr(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function getMonthStats(reservations: { checkIn: string; checkOut: string }[], year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ms = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const me = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  const active = reservations.filter(r => r.checkIn <= me && r.checkOut > ms);
  let days = 0;
  for (const r of active) {
    const s = r.checkIn < ms ? ms : r.checkIn;
    const e = r.checkOut > me ? me : toStr(addDays(new Date(r.checkOut), -1));
    days += Math.max(0, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);
  }
  return { occupancy: Math.round(Math.min(days, daysInMonth) / daysInMonth * 100), count: active.length };
}

export default function CalendarListPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/calendar'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    syncPropertiesFromRemote().then(props => { setProperties(props.filter(p => p.host?.id === user.id)); setLoading(false); });
  }, [router]);

  const active = properties.filter(p => p.available && !p.isDraft);
  cancelExpiredBookings();
  const allBookings = getBookings().filter(b => b.status === 'confirmed' || b.status === 'pending');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.calendar')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('host.reservations_title')}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : active.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">{t('host.no_listings')}</p>
          <p className="text-sm text-gray-400 mb-5">{t('submit.publish_btn')}</p>
          <Link href="/host/submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] transition-colors">
            <Plus size={15} /> {t('host.new_listing')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(property => {
            const res = allBookings.filter(b => b.propertyId === property.id);
            const { occupancy, count } = getMonthStats(res, today.getFullYear(), today.getMonth());
            return (
              <button
                key={property.id}
                onClick={() => router.push(`/host/calendar/property?id=${property.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#0F4C8A] transition-all text-left group"
              >
                <img src={property.images[0]} alt={property.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{property.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{property.location}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 rounded-full bg-gray-200 w-20 overflow-hidden">
                        <div className="h-full bg-[#0F4C8A] rounded-full" style={{ width: `${occupancy}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#0F4C8A]">{occupancy}%</span>
                    </div>
                    <span className="text-xs text-gray-500">{count} rés. ce mois</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-[#0F4C8A] transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
