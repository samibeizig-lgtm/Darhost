'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, Home, LogIn, LogOut, Clock, Users, ChevronRight, Plus,
  X, Calendar, CheckCircle,
} from 'lucide-react';
import { getUser, syncPropertiesFromRemote, syncBookingsFromRemote, cancelExpiredBookings } from '@/lib/store';
import { Property, Booking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
const MONTH_NAMES_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function toStr(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDate(s: string) { const [,m,d] = s.split('-').map(Number); return `${d} ${MONTHS_FR[m-1]}`; }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'En attente',  cls: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmée',   cls: 'bg-green-100 text-green-700' },
  refused:   { label: 'Refusée',     cls: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500' },
  paid:      { label: 'Payée',       cls: 'bg-blue-100 text-blue-700' },
};

export default function HostDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostName, setHostName] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);

  const todayStr = toStr(new Date());
  const today = new Date();

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/dashboard'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    setHostName(user.name.split(' ')[0]);
    cancelExpiredBookings();
    Promise.all([syncPropertiesFromRemote(), syncBookingsFromRemote()]).then(([props, allBookings]) => {
      const myProps = props.filter(p => p.host?.id === user.id);
      setProperties(myProps);
      const myIds = new Set(myProps.map(p => p.id));
      setBookings(allBookings.filter(b => (b.status === 'confirmed' || b.status === 'paid') && myIds.has(b.propertyId)));
      setLoading(false);
    });
  }, [router]);

  const activeListings = properties.filter(p => p.available && !p.isDraft).length;
  const ongoing = bookings.filter(b => b.checkIn < todayStr && b.checkOut > todayStr);
  const checkInToday = bookings.filter(b => b.checkIn === todayStr);
  const checkOutToday = bookings.filter(b => b.checkOut === todayStr);
  const upcoming = bookings.filter(b => b.checkIn > todayStr).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = bookings
    .filter(b => b.checkIn.startsWith(monthPrefix) || b.checkOut > monthPrefix + '-01')
    .reduce((sum, b) => sum + b.total, 0);
  const todayEvents = [
    ...checkInToday.map(b => ({ ...b, evType: 'in' as const })),
    ...checkOutToday.map(b => ({ ...b, evType: 'out' as const })),
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('host.welcome')}, {hostName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{MONTH_NAMES_FR[today.getMonth()]} {today.getFullYear()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0F4C8A] text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="opacity-80" />
            <span className="text-xs font-medium opacity-80">{t('host.this_month')}</span>
          </div>
          <div className="text-2xl font-extrabold">{monthRevenue.toLocaleString('fr-TN')} DT</div>
          <div className="text-xs opacity-60 mt-0.5">{bookings.filter(b => b.checkIn.startsWith(monthPrefix)).length} {t('common.bookings_count')}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Home size={16} className="text-[#0F4C8A]" />
            <span className="text-xs font-medium text-gray-500">{t('host.active_listings')}</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{activeListings}</div>
          <Link href="/host/listings" className="text-xs text-[#0F4C8A] font-semibold mt-0.5 block hover:underline">{t('host.view_listings')}</Link>
        </div>
      </div>

      {todayEvents.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#0F4C8A]" />
            {t('host.today')}
          </h2>
          <div className="space-y-2">
            {todayEvents.map(b => (
              <button
                key={b.id + b.evType}
                onClick={() => setSelected(b)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-opacity hover:opacity-80 ${
                  b.evType === 'in' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                }`}
              >
                {b.evType === 'in' ? <LogIn size={18} className="text-green-600 shrink-0" /> : <LogOut size={18} className="text-orange-500 shrink-0" />}
                {b.guestAvatar
                  ? <img src={b.guestAvatar} alt={b.guestName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center font-bold shrink-0">{b.guestName.charAt(0)}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{b.guestName}</p>
                  <p className="text-xs text-gray-500 truncate">{b.propertyTitle}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  b.evType === 'in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>{b.evType === 'in' ? 'Check-in' : 'Check-out'}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {ongoing.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#0F4C8A]" />
            {t('host.ongoing')}
            <span className="ml-auto text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full">{ongoing.length}</span>
          </h2>
          <div className="space-y-2">
            {ongoing.map(b => <DashboardBookingCard key={b.id} b={b} onClick={() => setSelected(b)} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ChevronRight size={16} className="text-[#0F4C8A]" />
            {t('host.upcoming')}
            <span className="ml-auto text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full">{upcoming.length}</span>
          </h2>
          <div className="space-y-2">
            {upcoming.map(b => <DashboardBookingCard key={b.id} b={b} onClick={() => setSelected(b)} />)}
          </div>
        </section>
      )}

      {properties.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Home size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">{t('host.no_listings')}</p>
          <p className="text-sm text-gray-400 mb-5">{t('submit.identity_required')}</p>
          <Link href="/host/submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] transition-colors">
            <Plus size={15} />{t('host.new_listing')}
          </Link>
        </div>
      )}

      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DashboardBookingCard({ b, onClick }: { b: Booking; onClick: () => void }) {
  const isPaid = b.status === 'paid';
  const isPendingPayment = b.status === 'confirmed' && !!(b.paymentDeadline && b.paymentDeadline > Date.now());
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 bg-white border rounded-xl shadow-sm text-left transition-colors hover:border-[#0F4C8A]/40 ${
        isPendingPayment ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
      }`}
    >
      <img src={b.propertyImage} alt={b.propertyTitle} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{b.propertyTitle}</p>
          {isPaid && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Payée</span>
          )}
          {isPendingPayment && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock size={9} />En attente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {b.guestAvatar
            ? <img src={b.guestAvatar} alt={b.guestName} className="w-4 h-4 rounded-full object-cover" />
            : <div className="w-4 h-4 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center text-[8px] font-bold">{b.guestName.charAt(0)}</div>
          }
          <p className="text-xs text-gray-500 truncate">{b.guestName} · {b.guests} voy.</p>
        </div>
        <p className="text-xs text-[#0F4C8A] font-medium mt-0.5">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 text-sm">{b.total} DT</p>
        <p className="text-xs text-gray-400">{b.nights} nuit{b.nights > 1 ? 's' : ''}</p>
      </div>
    </button>
  );
}

function BookingDetailModal({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const createdAt = new Date(b.createdAt);
  const createdStr = `${createdAt.getDate()} ${MONTHS_FR[createdAt.getMonth()]} à ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;
  const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.cancelled;
  const isPaid = b.status === 'paid';
  const isConfirmedPending = b.status === 'confirmed' && !!(b.paymentDeadline && b.paymentDeadline > Date.now());

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Détails de la réservation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Reçue le {createdStr}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-10">
          <div className="flex gap-3">
            <img src={b.propertyImage} alt={b.propertyTitle} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{b.propertyTitle}</p>
              <p className="text-xs text-gray-500 mt-0.5">{b.propertyLocation}</p>
              <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            {b.guestAvatar
              ? <img src={b.guestAvatar} alt={b.guestName} className="w-10 h-10 rounded-full object-cover" />
              : <div className="w-10 h-10 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center font-bold text-base">{b.guestName.charAt(0)}</div>
            }
            <div>
              <p className="font-semibold text-gray-900 text-sm">{b.guestName}</p>
              <p className="text-xs text-gray-500">{b.guests} voyageur{b.guests > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <Calendar size={18} className="text-[#0F4C8A] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</p>
              <p className="text-xs text-gray-500">{b.nights} nuit{b.nights > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{b.pricePerNight} DT × {b.nights} nuit{b.nights > 1 ? 's' : ''}</span>
              <span>{b.pricePerNight * b.nights} DT</span>
            </div>
            {b.cleaningFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frais de ménage</span><span>{b.cleaningFee} DT</span>
              </div>
            )}
            {b.serviceFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frais de service</span><span>{b.serviceFee} DT</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>{b.total} DT</span>
            </div>
          </div>

          {isPaid && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <CheckCircle size={15} className="shrink-0" />Paiement reçu — séjour confirmé
            </div>
          )}
          {isConfirmedPending && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              <Clock size={15} className="shrink-0" />En attente de paiement du voyageur
            </div>
          )}
        </div>
      </div>
    </>
  );
}
