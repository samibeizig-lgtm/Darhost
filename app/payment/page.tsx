'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Lock, Shield, Plane, Car, Map, Zap, MoreHorizontal } from 'lucide-react';
import { getUser, getBookings, updateBookingStatus, getServiceBookings, updateServiceBookingStatus } from '@/lib/store';
import { Booking, ServiceBooking, ServiceType } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}

const SERVICE_ICONS: Record<ServiceType, React.ElementType> = {
  transfert: Plane, voiture: Car, guide: Map, activite: Zap, autre: MoreHorizontal,
};

function useCountdown(deadline: number | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!deadline) return;
    const dl = deadline;
    function tick() {
      const diff = dl - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return { timeLeft, expired };
}

// Shared card UI
function CardForm({ total, paying, onPay, title }: { total: number; paying: boolean; onPay: () => void; title: string }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#0F4C8A]" />
            <span className="text-sm font-bold text-gray-900">Paiement par carte</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 px-1.5 bg-[#1A1F71] rounded flex items-center">
              <span className="text-white font-extrabold italic text-xs tracking-tight">VISA</span>
            </div>
            <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
              <circle cx="11" cy="10" r="9" fill="#EB001B" />
              <circle cx="21" cy="10" r="9" fill="#F79E1B" />
              <path d="M16 3.8a9 9 0 0 1 0 12.4A9 9 0 0 1 16 3.8z" fill="#FF5F00" />
            </svg>
          </div>
        </div>
        <div className="px-4 py-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('payment.card_number')}</label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50">
              <CreditCard size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-400 tracking-widest">•••• •••• •••• ••••</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('payment.expiry')}</label>
              <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">MM / AA</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('payment.cvv')}</label>
              <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">•••</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('payment.cardholder')}</label>
            <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">PRÉNOM NOM</div>
          </div>
        </div>
      </div>

      <button
        onClick={onPay}
        disabled={paying}
        className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#0F4C8A] text-white rounded-2xl font-bold text-base hover:bg-[#0A3566] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
      >
        {paying ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('payment.processing')}</>
        ) : (
          <><Lock size={16} />{t('payment.pay_btn')} {total} DT</>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Shield size={12} /> Paiement sécurisé</span>
        <span className="flex items-center gap-1"><Lock size={12} /> Chiffrement SSL</span>
      </div>
    </>
  );
}

function PaymentInner() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useSearchParams();
  const bookingId = params.get('id') ?? '';
  const isService = bookingId.startsWith('sbk-');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [serviceBooking, setServiceBooking] = useState<ServiceBooking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const { timeLeft, expired } = useCountdown(booking?.paymentDeadline);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/payment?id=' + bookingId); return; }
    if (!bookingId) { setNotFound(true); return; }

    if (isService) {
      const all = getServiceBookings();
      const b = all.find(b => b.id === bookingId);
      if (!b) { setNotFound(true); return; }
      setServiceBooking(b);
      if (b.status === 'paid') setPaid(true);
    } else {
      const all = getBookings();
      const b = all.find(b => b.id === bookingId);
      if (!b) { setNotFound(true); return; }
      setBooking(b);
      if (b.status === 'paid') setPaid(true);
    }
  }, [bookingId, isService, router]);

  async function handlePay() {
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    if (isService && serviceBooking) {
      updateServiceBookingStatus(serviceBooking.id, 'paid');
    } else if (booking) {
      updateBookingStatus(booking.id, 'paid');
    }
    setPaid(true);
    setPaying(false);
  }

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
        <p className="text-sm text-gray-500 mb-6">Cette réservation n&apos;existe pas ou a été supprimée.</p>
        <Link href="/reservations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm">
          Mes réservations
        </Link>
      </div>
    );
  }

  if (!booking && !serviceBooking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = isService ? (serviceBooking?.total ?? 0) : (booking?.total ?? 0);
  const itemTitle = isService ? (serviceBooking?.serviceTitle ?? '') : (booking?.propertyTitle ?? '');
  const currentStatus = isService ? serviceBooking?.status : booking?.status;

  // Paid state
  if (paid || currentStatus === 'paid') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
        <p className="text-sm text-gray-500 mb-2">Votre réservation pour <strong>{itemTitle}</strong> est confirmée.</p>
        {!isService && booking && (
          <p className="text-sm text-gray-500 mb-8">
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
          </p>
        )}
        {isService && serviceBooking && (
          <p className="text-sm text-gray-500 mb-8">{fmtDate(serviceBooking.date)} · {serviceBooking.persons} pers.</p>
        )}
        <Link href="/reservations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
          Voir mes réservations
        </Link>
      </div>
    );
  }

  // Cancelled / refused
  if (currentStatus === 'cancelled' || currentStatus === 'refused') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Réservation {currentStatus === 'refused' ? 'refusée' : 'annulée'}</h1>
        <p className="text-sm text-gray-500 mb-8">Cette réservation ne peut plus être payée.</p>
        <Link href="/reservations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
          Mes réservations
        </Link>
      </div>
    );
  }

  // Not confirmed yet
  if (currentStatus !== 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <AlertCircle size={48} className="text-orange-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Paiement indisponible</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isService ? 'Ce service n\'est pas encore confirmé par le prestataire.' : 'Cette réservation n\'est pas encore confirmée par l\'hôte.'}
        </p>
        <Link href="/reservations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm">
          Mes réservations
        </Link>
      </div>
    );
  }

  // Property: check expiry window
  if (!isService && booking) {
    const isExpiredWindow = expired || (booking.paymentDeadline && booking.paymentDeadline < Date.now());
    if (isExpiredWindow) {
      updateBookingStatus(booking.id, 'cancelled');
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle size={40} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Délai expiré</h1>
          <p className="text-sm text-gray-500 mb-8">Le délai de paiement de 6 heures est dépassé. Cette réservation a été annulée automatiquement.</p>
          <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
            Chercher un logement
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-8">
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <p className="font-bold text-gray-900 text-sm">{t('payment.title')}</p>
          <p className="text-xs text-gray-500 truncate max-w-[240px]">{itemTitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-green-600">
          <Lock size={13} />
          <span className="text-xs font-semibold">SSL</span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Property countdown */}
        {!isService && timeLeft && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Clock size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Temps restant pour payer</p>
              <p className="text-2xl font-bold text-amber-800 font-mono">{timeLeft}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {isService && serviceBooking ? (
            <div className="flex gap-3 p-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                {serviceBooking.serviceImage ? (
                  <img src={serviceBooking.serviceImage} alt={serviceBooking.serviceTitle} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  (() => { const Icon = SERVICE_ICONS[serviceBooking.serviceType]; return <Icon size={28} className="text-gray-300" />; })()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-sm leading-tight mb-1">{serviceBooking.serviceTitle}</h2>
                <p className="text-xs text-gray-500 mb-1">{serviceBooking.serviceLocation}</p>
                <p className="text-xs text-[#0F4C8A] font-medium">{fmtDate(serviceBooking.date)}{serviceBooking.endDate ? ` → ${fmtDate(serviceBooking.endDate)}` : ''}</p>
                <p className="text-xs text-gray-500 mt-0.5">{serviceBooking.persons} pers. · {serviceBooking.providerName}</p>
              </div>
            </div>
          ) : booking ? (
            <div className="flex gap-3 p-4">
              <img src={booking.propertyImage} alt={booking.propertyTitle} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-sm leading-tight mb-1">{booking.propertyTitle}</h2>
                <p className="text-xs text-gray-500 mb-1">{booking.propertyLocation}</p>
                <p className="text-xs text-[#0F4C8A] font-medium">
                  {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : null}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>{t('payment.total')}</span>
              <span className="text-[#0F4C8A]">{total} DT</span>
            </div>
          </div>
        </div>

        <CardForm total={total} paying={paying} onPay={handlePay} title={itemTitle} />
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentInner />
    </Suspense>
  );
}
