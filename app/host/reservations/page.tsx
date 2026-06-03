'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle, XCircle, Users, Clock, BookOpen } from 'lucide-react';
import {
  getUser, syncPropertiesFromRemote, syncBookingsFromRemote, updateBookingStatus, cancelExpiredBookings,
} from '@/lib/store';
import { Booking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}

type Tab = 'all' | 'pending' | 'confirmed' | 'past';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'En attente',  cls: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmée',   cls: 'bg-green-100 text-green-700' },
  refused:   { label: 'Refusée',     cls: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500' },
  paid:      { label: 'Payée',       cls: 'bg-blue-100 text-blue-700' },
};

function BookingCard({
  booking: b,
  onValidate,
  onRefuse,
}: {
  booking: Booking;
  onValidate?: () => void;
  onRefuse?: () => void;
}) {
  const { t } = useLanguage();
  const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.cancelled;
  const createdAt = new Date(b.createdAt);
  const createdStr = `${createdAt.getDate()} ${MONTHS_FR[createdAt.getMonth()]} à ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-4">
        <img src={b.propertyImage} alt={b.propertyTitle} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{b.propertyTitle}</p>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            {b.guestAvatar ? (
              <img src={b.guestAvatar} alt={b.guestName} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center text-[8px] font-bold">{b.guestName.charAt(0)}</div>
            )}
            <span className="text-xs font-medium text-gray-700">{b.guestName}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#0F4C8A] font-medium mb-1">
            <Calendar size={11} className="shrink-0" />
            <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
            <span className="text-gray-400 font-normal">· {b.nights} {b.nights > 1 ? t('common.nights') : t('common.night')}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={11} className="shrink-0" />
              <span>{b.guests} {b.guests > 1 ? t('common.guest_plural') : t('common.guest')}</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{b.total} DT</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 text-[10px] text-gray-400">
        {t('host.received')} {createdStr}
      </div>

      {b.status === 'confirmed' && b.paymentDeadline && (
        <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <Clock size={13} className="shrink-0" />
          {b.paymentDeadline > Date.now() ? t('host.payment_awaiting') : t('host.payment_expired')}
        </div>
      )}

      {onValidate && onRefuse && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onRefuse}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle size={15} className="text-red-500" /> {t('host.refuse')}
          </button>
          <button
            onClick={onValidate}
            className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={15} /> {t('host.validate')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function HostReservationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'host') { router.push('/'); return; }
    cancelExpiredBookings();
    Promise.all([syncPropertiesFromRemote(), syncBookingsFromRemote()]).then(([props, allBookings]) => {
      const myIds = new Set(props.filter(p => p.host?.id === user.id).map(p => p.id));
      const sorted = allBookings
        .filter(b => myIds.has(b.propertyId))
        .sort((a, b) => b.createdAt - a.createdAt);
      setBookings(sorted);
      setLoading(false);
    });
  }, [router]);

  function handleValidate(id: string) {
    const now = Date.now();
    updateBookingStatus(id, 'confirmed', { paymentDeadline: now + 6 * 3600000 });
    setBookings(prev => prev.map(b => b.id === id
      ? { ...b, status: 'confirmed' as const, paymentDeadline: now + 6 * 3600000, respondedAt: now }
      : b
    ));
  }

  function handleRefuse(id: string) {
    const now = Date.now();
    updateBookingStatus(id, 'refused');
    setBookings(prev => prev.map(b => b.id === id
      ? { ...b, status: 'refused' as const, respondedAt: now }
      : b
    ));
  }

  const today = new Date().toISOString().slice(0, 10);

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length,
    past: bookings.filter(b => b.status === 'refused' || b.status === 'cancelled' || ((b.status === 'confirmed' || b.status === 'paid') && b.checkOut < today)).length,
  };

  const tabBookings = tab === 'all' ? bookings
    : tab === 'pending' ? bookings.filter(b => b.status === 'pending')
    : tab === 'confirmed' ? bookings.filter(b => (b.status === 'confirmed' || b.status === 'paid') && b.checkOut >= today)
    : bookings.filter(b => b.status === 'refused' || b.status === 'cancelled' || ((b.status === 'confirmed' || b.status === 'paid') && b.checkOut < today));

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: t('host.tab_pending') },
    { key: 'confirmed', label: t('host.tab_confirmed') },
    { key: 'past', label: t('host.tab_past') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('host.reservations_title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{bookings.length} réservation{bookings.length !== 1 ? 's' : ''} au total</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
              tab === key ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                key === 'pending' ? 'bg-orange-100 text-orange-600' :
                key === 'confirmed' ? 'bg-green-100 text-green-600' :
                key === 'all' ? 'bg-[#E8F0FB] text-[#0F4C8A]' :
                'bg-gray-200 text-gray-500'
              }`}>{counts[key]}</span>
            )}
          </button>
        ))}
      </div>

      {tabBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 mb-1">
            {tab === 'all' ? 'Aucune réservation' : t(`host.no_bookings_${tab === 'past' ? 'past' : tab}`)}
          </p>
          {tab === 'pending' && (
            <p className="text-sm text-gray-400 mt-1">{t('host.new_requests')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tabBookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onValidate={b.status === 'pending' ? () => handleValidate(b.id) : undefined}
              onRefuse={b.status === 'pending' ? () => handleRefuse(b.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
