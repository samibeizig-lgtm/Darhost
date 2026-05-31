'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, CheckCircle, XCircle, Users, Clock, BookOpen } from 'lucide-react';
import {
  getUser, syncPropertiesFromRemote, syncBookingsFromRemote, updateBookingStatus, cancelExpiredBookings,
} from '@/lib/store';
import { Booking } from '@/lib/types';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}

type Tab = 'pending' | 'confirmed' | 'past';

const TAB_LABELS: Record<Tab, string> = { pending: 'En attente', confirmed: 'Confirmées', past: 'Passées' };

function BookingCard({
  booking: b,
  onValidate,
  onRefuse,
}: {
  booking: Booking;
  onValidate?: () => void;
  onRefuse?: () => void;
}) {
  const STATUS = {
    pending:   { label: 'En attente', cls: 'bg-orange-100 text-orange-700' },
    confirmed: { label: 'Confirmée',  cls: 'bg-green-100 text-green-700' },
    refused:   { label: 'Refusée',    cls: 'bg-red-100 text-red-600' },
    cancelled: { label: 'Annulée',    cls: 'bg-gray-100 text-gray-500' },
    paid:      { label: 'Payée',      cls: 'bg-blue-100 text-blue-700' },
  };
  const cfg = STATUS[b.status];
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

          {/* Guest */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <img src={b.guestAvatar} alt={b.guestName} className="w-4 h-4 rounded-full object-cover" />
            <span className="text-xs font-medium text-gray-700">{b.guestName}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-1 text-xs text-[#0F4C8A] font-medium mb-1">
            <Calendar size={11} className="shrink-0" />
            <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
            <span className="text-gray-400 font-normal">· {b.nights} nuit{b.nights > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={11} className="shrink-0" />
              <span>{b.guests} voyageur{b.guests > 1 ? 's' : ''}</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">{b.total} DT</span>
          </div>
        </div>
      </div>

      {/* Received at */}
      <div className="px-4 pb-3 text-[10px] text-gray-400">
        Reçue le {createdStr}
      </div>

      {/* Pending actions */}
      {onValidate && onRefuse && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onRefuse}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle size={15} className="text-red-500" /> Refuser
          </button>
          <button
            onClick={onValidate}
            className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={15} /> Valider
          </button>
        </div>
      )}

      {/* Confirmed payment status */}
      {b.status === 'confirmed' && b.paymentDeadline && (
        <div className="mx-4 mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-center gap-2">
          <Clock size={13} className="shrink-0" />
          {b.paymentDeadline > Date.now()
            ? 'En attente de paiement du voyageur (6h)'
            : 'Délai de paiement expiré'}
        </div>
      )}
    </div>
  );
}

export default function HostReservationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'host') { router.push('/'); return; }
    cancelExpiredBookings();
    Promise.all([syncPropertiesFromRemote(), syncBookingsFromRemote()]).then(([props, allBookings]) => {
      const myIds = new Set(props.map(p => p.id));
      setBookings(allBookings.filter(b => myIds.has(b.propertyId)));
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

  const pending   = bookings.filter(b => b.status === 'pending');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const past      = bookings.filter(b => b.status === 'refused' || b.status === 'cancelled');

  const counts: Record<Tab, number> = { pending: pending.length, confirmed: confirmed.length, past: past.length };
  const tabBookings = tab === 'pending' ? pending : tab === 'confirmed' ? confirmed : past;

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
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez les demandes de vos voyageurs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {(['pending', 'confirmed', 'past'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
              tab === t ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t]}
            {counts[t] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                t === 'pending' ? 'bg-orange-100 text-orange-600' :
                t === 'confirmed' ? 'bg-green-100 text-green-600' :
                'bg-gray-200 text-gray-500'
              }`}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {tabBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 mb-1">
            Aucune réservation {tab === 'pending' ? 'en attente' : tab === 'confirmed' ? 'confirmée' : 'passée'}
          </p>
          {tab === 'pending' && (
            <p className="text-sm text-gray-400 mt-1">Les nouvelles demandes apparaîtront ici</p>
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
