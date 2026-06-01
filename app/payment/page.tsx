'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Lock, Shield } from 'lucide-react';
import { getUser, getBookings, updateBookingStatus } from '@/lib/store';
import { Booking } from '@/lib/types';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}

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

function PaymentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get('id') ?? '';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const { timeLeft, expired } = useCountdown(booking?.paymentDeadline);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/payment?id=' + bookingId); return; }
    if (!bookingId) { setNotFound(true); return; }
    const all = getBookings();
    const b = all.find(b => b.id === bookingId);
    if (!b) { setNotFound(true); return; }
    setBooking(b);
    if (b.status === 'paid') setPaid(true);
  }, [bookingId, router]);

  async function handlePay() {
    if (!booking) return;
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    updateBookingStatus(booking.id, 'paid');
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

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (paid || booking.status === 'paid') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
        <p className="text-sm text-gray-500 mb-2">Votre réservation pour <strong>{booking.propertyTitle}</strong> est confirmée.</p>
        <p className="text-sm text-gray-500 mb-8">
          {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
        </p>
        <Link href="/reservations" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
          Voir mes réservations
        </Link>
      </div>
    );
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Réservation annulée</h1>
        <p className="text-sm text-gray-500 mb-8">Le délai de paiement de 6 heures est dépassé.</p>
        <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
          Chercher un logement
        </Link>
      </div>
    );
  }

  if (booking.status !== 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center pb-24 md:pb-16">
        <AlertCircle size={48} className="text-orange-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Paiement indisponible</h1>
        <p className="text-sm text-gray-500 mb-6">Cette réservation n&apos;est pas encore confirmée par l&apos;hôte.</p>
        <Link href="/reservations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm">
          Mes réservations
        </Link>
      </div>
    );
  }

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

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-8">
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <p className="font-bold text-gray-900 text-sm">Paiement sécurisé</p>
          <p className="text-xs text-gray-500 truncate max-w-[240px]">{booking.propertyTitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-green-600">
          <Lock size={13} />
          <span className="text-xs font-semibold">SSL</span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {timeLeft && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Clock size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Temps restant pour payer</p>
              <p className="text-2xl font-bold text-amber-800 font-mono">{timeLeft}</p>
            </div>
          </div>
        )}

        {/* Résumé réservation */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex gap-3 p-4">
            <img
              src={booking.propertyImage}
              alt={booking.propertyTitle}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-sm leading-tight mb-1">{booking.propertyTitle}</h2>
              <p className="text-xs text-gray-500 mb-1">{booking.propertyLocation}</p>
              <p className="text-xs text-[#0F4C8A] font-medium">
                {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{booking.nights} nuit{booking.nights > 1 ? 's' : ''} × {Math.round(booking.total / booking.nights)} DT</span>
              <span>{booking.total} DT</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
              <span>Total à payer</span>
              <span className="text-[#0F4C8A]">{booking.total} DT</span>
            </div>
          </div>
        </div>

        {/* Click to Pay */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[#0F4C8A]" />
              <span className="text-sm font-bold text-gray-900">Paiement par carte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/40px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/60px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4" />
            </div>
          </div>
          <div className="px-4 py-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Numéro de carte</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50">
                <CreditCard size={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-400 tracking-widest">•••• •••• •••• ••••</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiration</label>
                <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">MM / AA</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">CVV</label>
                <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">•••</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom sur la carte</label>
              <div className="px-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm text-gray-400">PRÉNOM NOM</div>
            </div>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#0F4C8A] text-white rounded-2xl font-bold text-base hover:bg-[#0A3566] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {paying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Traitement en cours…
            </>
          ) : (
            <>
              <Lock size={16} />
              Payer {booking.total} DT
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Shield size={12} /> Paiement sécurisé</span>
          <span className="flex items-center gap-1"><Lock size={12} /> Chiffrement SSL</span>
        </div>

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
