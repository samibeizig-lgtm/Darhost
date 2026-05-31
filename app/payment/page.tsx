'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Building2, Hash } from 'lucide-react';
import { getUser, getBookings, updateBookingStatus } from '@/lib/store';
import { TUNISIAN_BANKS, validateRib, formatRibDisplay } from '@/lib/banks';
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
  const [selectedBank, setSelectedBank] = useState('');
  const [rib, setRib] = useState('');
  const [ribError, setRibError] = useState<string | null>(null);
  const [ribValid, setRibValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);

  const bank = TUNISIAN_BANKS.find(b => b.code === selectedBank);
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

  function handleRibChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 20);
    setRib(digits);
    if (!selectedBank) {
      setRibError('Choisissez votre banque avant de saisir le RIB');
      setRibValid(false);
      return;
    }
    if (digits.length < 20) { setRibError(null); setRibValid(false); return; }
    const err = validateRib(digits, selectedBank);
    setRibError(err);
    setRibValid(!err);
  }

  function handleBankChange(code: string) {
    setSelectedBank(code);
    setRibError(null);
    setRibValid(false);
    if (rib.length === 20 && code) {
      const err = validateRib(rib, code);
      setRibError(err);
      setRibValid(!err);
    }
  }

  async function handleSubmit() {
    if (!booking || !ribValid) return;
    setSubmitting(true);
    updateBookingStatus(booking.id, 'paid');
    await new Promise(r => setTimeout(r, 700));
    setPaid(true);
    setSubmitting(false);
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
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

  if (booking.status === 'cancelled' || (expired && booking.status !== 'confirmed')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Réservation annulée</h1>
        <p className="text-sm text-gray-500 mb-8">Le délai de paiement de 6 heures est dépassé. Cette réservation a été annulée.</p>
        <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-bold text-sm hover:bg-[#0A3566] transition-colors">
          Chercher un logement
        </Link>
      </div>
    );
  }

  if (booking.status !== 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
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
          <p className="font-bold text-gray-900 text-sm">Procéder au paiement</p>
          <p className="text-xs text-gray-500 truncate max-w-[240px]">{booking.propertyTitle}</p>
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

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-800 space-y-1">
          <p className="font-semibold text-sm mb-1.5">Instructions de virement bancaire</p>
          <p>Effectuez un virement de <strong>{booking.total} DT</strong> depuis votre banque en indiquant la référence :</p>
          <p className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-1 rounded-lg inline-block mt-1">{booking.id.toUpperCase()}</p>
          <p className="mt-1.5">Saisissez ensuite votre banque et votre RIB ci-dessous pour confirmer.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Vos coordonnées bancaires</h3>
          </div>
          <div className="px-4 pb-4 space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Building2 size={14} className="inline mr-1.5 text-gray-500" />
                Votre banque
              </label>
              <select
                value={selectedBank}
                onChange={e => handleBankChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white appearance-none"
              >
                <option value="">Sélectionnez votre banque</option>
                {TUNISIAN_BANKS.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <Hash size={14} className="inline mr-1.5 text-gray-500" />
                Votre RIB (20 chiffres)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={rib.length > 0 ? formatRibDisplay(rib) : ''}
                  onChange={e => handleRibChange(e.target.value)}
                  placeholder="XX XXX XXXXXXXXXXXXX XX"
                  maxLength={24}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 pr-9 ${
                    ribValid
                      ? 'border-green-400 focus:ring-green-400 bg-green-50'
                      : ribError
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-gray-300 focus:ring-[#0F4C8A]'
                  }`}
                />
                {ribValid && (
                  <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
                {ribError && rib.length > 0 && (
                  <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                )}
              </div>
              {ribError && rib.length > 0 && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  {ribError}
                </p>
              )}
              {ribValid && bank && (
                <p className="mt-1.5 text-xs text-green-700 font-medium">
                  RIB valide · {bank.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Format : BB GGG AAAAAAAAAAAAA CC (20 chiffres au total)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!ribValid || submitting}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#0F4C8A] text-white rounded-2xl font-bold text-sm hover:bg-[#0A3566] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          {submitting ? 'Traitement...' : `Confirmer le paiement de ${booking.total} DT`}
        </button>

        <p className="text-xs text-gray-400 text-center px-4">
          En confirmant, vous attestez avoir effectué le virement bancaire du montant indiqué.
        </p>
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
