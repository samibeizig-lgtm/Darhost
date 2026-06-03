'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Package, Calendar, User } from 'lucide-react';
import { getUser, syncServiceBookingsFromRemote, updateServiceBookingStatus } from '@/lib/store';
import { ServiceBooking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
function fmtDate(s: string) { const [,m,d]=s.split('-').map(Number); return `${d} ${MONTHS_FR[m-1]}`; }

export default function PrestataireReservations() {
  const { t } = useLanguage();
  const router = useRouter();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [tab, setTab] = useState<'pending'|'confirmed'|'past'>('pending');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/prestataire/reservations'); return; }
    if (u.role !== 'prestataire') { router.push('/'); return; }
    setChecked(true);
    syncServiceBookingsFromRemote(u.id).then(all => setBookings(all.filter(b => b.providerId === u.id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  const today = new Date().toISOString().slice(0,10);

  function respond(id: string, status: 'confirmed' | 'refused') {
    updateServiceBookingStatus(id, status);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'pending', label: t('prestataire.tab_pending') },
    { key: 'confirmed', label: t('prestataire.tab_confirmed') },
    { key: 'past', label: t('prestataire.tab_past') },
  ];

  const filtered = bookings.filter(b => {
    if (tab === 'pending') return b.status === 'pending';
    if (tab === 'confirmed') return b.status === 'confirmed' && b.date >= today;
    return b.status === 'refused' || b.status === 'cancelled' || (b.status === 'confirmed' && b.date < today);
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('prestataire.reservations')}</h1>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-500'}`}>
            {label}
            {key === 'pending' && bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-[#0F4C8A] text-white text-[9px] font-bold rounded-full">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">{t('prestataire.no_bookings')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center shrink-0 font-bold">
                  {b.guestName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{b.guestName}</p>
                  <p className="text-xs text-gray-500 truncate">{b.serviceTitle}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  b.status === 'pending' ? 'bg-orange-100 text-orange-700'
                  : b.status === 'confirmed' ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
                }`}>
                  {b.status === 'pending' ? t('prestataire.tab_pending') : b.status === 'confirmed' ? t('prestataire.tab_confirmed') : b.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(b.date)}{b.endDate ? ` → ${fmtDate(b.endDate)}` : ''}</span>
                <span className="flex items-center gap-1"><User size={12} /> {b.persons} pers.</span>
                <span className="font-semibold text-[#0F4C8A]">{b.total} DT</span>
              </div>
              {b.pickupLocation && <p className="text-xs text-gray-500 mb-1">📍 {b.pickupLocation}{b.dropoffLocation ? ` → ${b.dropoffLocation}` : ''}</p>}
              {b.notes && <p className="text-xs text-gray-400 italic mb-3">&quot;{b.notes}&quot;</p>}
              {b.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => respond(b.id, 'refused')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                    <XCircle size={15} /> {t('prestataire.refuse')}
                  </button>
                  <button onClick={() => respond(b.id, 'confirmed')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] transition-colors">
                    <CheckCircle size={15} /> {t('prestataire.validate')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
