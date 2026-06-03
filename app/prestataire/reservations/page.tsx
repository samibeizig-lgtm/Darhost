'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Package, Calendar, Users, Clock } from 'lucide-react';
import { getUser, syncServiceBookingsFromRemote, updateServiceBookingStatus } from '@/lib/store';
import { ServiceBooking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
function fmtDate(s: string) { const [,m,d]=s.split('-').map(Number); return `${d} ${MONTHS_FR[m-1]}`; }

type Tab = 'all' | 'pending' | 'confirmed' | 'past';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'En attente',  cls: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmée',   cls: 'bg-green-100 text-green-700' },
  refused:   { label: 'Refusée',     cls: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500' },
  paid:      { label: 'Payée',       cls: 'bg-blue-100 text-blue-700' },
};

export default function PrestataireReservations() {
  const { t } = useLanguage();
  const router = useRouter();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/prestataire/reservations'); return; }
    if (u.role !== 'prestataire') { router.push('/'); return; }
    setChecked(true);
    syncServiceBookingsFromRemote(u.id).then(all => {
      const sorted = all
        .filter(b => b.providerId === u.id)
        .sort((a, b) => b.createdAt - a.createdAt);
      setBookings(sorted);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  const today = new Date().toISOString().slice(0, 10);

  function respond(id: string, status: 'confirmed' | 'refused') {
    updateServiceBookingStatus(id, status);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => (b.status === 'confirmed' || b.status === 'paid') && b.date >= today).length,
    past: bookings.filter(b => b.status === 'refused' || b.status === 'cancelled' || ((b.status === 'confirmed' || b.status === 'paid') && b.date < today)).length,
  };

  const filtered = tab === 'all' ? bookings
    : tab === 'pending' ? bookings.filter(b => b.status === 'pending')
    : tab === 'confirmed' ? bookings.filter(b => (b.status === 'confirmed' || b.status === 'paid') && b.date >= today)
    : bookings.filter(b => b.status === 'refused' || b.status === 'cancelled' || ((b.status === 'confirmed' || b.status === 'paid') && b.date < today));

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: t('prestataire.tab_pending') },
    { key: 'confirmed', label: t('prestataire.tab_confirmed') },
    { key: 'past', label: t('prestataire.tab_past') },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('prestataire.reservations')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{bookings.length} réservation{bookings.length !== 1 ? 's' : ''} au total</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
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

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 mb-1">{t('prestataire.no_bookings')}</p>
          {tab === 'pending' && <p className="text-sm text-gray-400 mt-1">Les nouvelles demandes apparaîtront ici</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.cancelled;
            const createdAt = new Date(b.createdAt);
            const createdStr = `${createdAt.getDate()} ${MONTHS_FR[createdAt.getMonth()]} à ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;

            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center shrink-0 font-bold text-lg">
                    {b.guestName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">{b.guestName}</p>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1.5">{b.serviceTitle}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(b.date)}{b.endDate ? ` → ${fmtDate(b.endDate)}` : ''}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {b.persons} pers.</span>
                      <span className="font-semibold text-[#0F4C8A]">{b.total} DT</span>
                    </div>
                  </div>
                </div>

                {b.pickupLocation && (
                  <div className="px-4 pb-2 text-xs text-gray-500">
                    📍 {b.pickupLocation}{b.dropoffLocation ? ` → ${b.dropoffLocation}` : ''}
                  </div>
                )}
                {b.notes && (
                  <div className="px-4 pb-2 text-xs text-gray-400 italic">&quot;{b.notes}&quot;</div>
                )}

                <div className="px-4 pb-2 text-[10px] text-gray-400">Reçue le {createdStr}</div>

                {(b.status === 'confirmed' || b.status === 'paid') && (
                  <div className="mx-4 mb-3 px-3 py-2 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 flex items-center gap-2">
                    <Clock size={13} className="shrink-0" />
                    {b.status === 'paid' ? 'Paiement reçu — service confirmé' : 'En attente de paiement du voyageur'}
                  </div>
                )}

                {b.status === 'pending' && (
                  <div className="flex gap-2 px-4 pb-4">
                    <button
                      onClick={() => respond(b.id, 'refused')}
                      className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={15} className="text-red-500" /> {t('prestataire.refuse')}
                    </button>
                    <button
                      onClick={() => respond(b.id, 'confirmed')}
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={15} /> {t('prestataire.validate')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
