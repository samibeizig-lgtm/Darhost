'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, Home, LogIn, LogOut, Clock, Users, ChevronRight, Plus,
} from 'lucide-react';
import { getUser, syncPropertiesFromRemote, syncBookingsFromRemote, cancelExpiredBookings } from '@/lib/store';
import { Property, Booking } from '@/lib/types';

const MONTHS_FR = [
  'jan', 'fév', 'mars', 'avr', 'mai', 'juin',
  'juil', 'août', 'sep', 'oct', 'nov', 'déc',
];
const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

interface Reservation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  guestName: string;
  guestAvatar: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  paymentPending?: boolean;
}

function toStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(s: string): string {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}


function bookingToReservation(b: Booking): Reservation {
  return {
    id: b.id,
    propertyId: b.propertyId,
    propertyTitle: b.propertyTitle,
    propertyImage: b.propertyImage,
    guestName: b.guestName,
    guestAvatar: b.guestAvatar,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guests: b.guests,
    totalAmount: b.total,
    paymentPending: !!(b.paymentDeadline && b.paymentDeadline > Date.now()),
  };
}

export default function HostDashboardPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostName, setHostName] = useState('');

  const todayStr = toStr(new Date());
  const today = new Date();

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/dashboard'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    setHostName(user.name.split(' ')[0]);
    cancelExpiredBookings();
    Promise.all([syncPropertiesFromRemote(), syncBookingsFromRemote()]).then(([props, allBookings]) => {
      setProperties(props);
      const myIds = new Set(props.map(p => p.id));
      const confirmed = allBookings
        .filter(b => b.status === 'confirmed' && myIds.has(b.propertyId))
        .map(bookingToReservation);
      setReservations(confirmed);
      setLoading(false);
    });
  }, [router]);

  const activeListings = properties.filter(p => p.available && !p.isDraft).length;

  const ongoing = reservations.filter(r => r.checkIn < todayStr && r.checkOut > todayStr);
  const checkInToday = reservations.filter(r => r.checkIn === todayStr);
  const checkOutToday = reservations.filter(r => r.checkOut === todayStr);
  const upcoming = reservations
    .filter(r => r.checkIn > todayStr)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthRevenue = reservations
    .filter(r => r.checkIn.startsWith(monthPrefix) || r.checkOut > monthPrefix + '-01')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const todayEvents = [...checkInToday.map(r => ({ ...r, type: 'in' as const })), ...checkOutToday.map(r => ({ ...r, type: 'out' as const }))];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {hostName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{MONTH_NAMES_FR[today.getMonth()]} {today.getFullYear()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0F4C8A] text-white rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="opacity-80" />
            <span className="text-xs font-medium opacity-80">Revenus du mois</span>
          </div>
          <div className="text-2xl font-extrabold">{monthRevenue.toLocaleString('fr-TN')} DT</div>
          <div className="text-xs opacity-60 mt-0.5">{reservations.filter(r => r.checkIn.startsWith(monthPrefix)).length} réservation(s)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Home size={16} className="text-[#0F4C8A]" />
            <span className="text-xs font-medium text-gray-500">Annonces actives</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{activeListings}</div>
          <Link href="/host/listings" className="text-xs text-[#0F4C8A] font-semibold mt-0.5 block hover:underline">Voir mes annonces →</Link>
        </div>
      </div>

      {todayEvents.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#0F4C8A]" />
            Aujourd&apos;hui
          </h2>
          <div className="space-y-2">
            {todayEvents.map(r => (
              <div key={r.id + r.type} className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                r.type === 'in'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                {r.type === 'in'
                  ? <LogIn size={18} className="text-green-600 shrink-0" />
                  : <LogOut size={18} className="text-orange-500 shrink-0" />
                }
                <img src={r.guestAvatar} alt={r.guestName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{r.guestName}</p>
                  <p className="text-xs text-gray-500 truncate">{r.propertyTitle}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  r.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {r.type === 'in' ? 'Check-in' : 'Check-out'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {ongoing.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#0F4C8A]" />
            En cours
            <span className="ml-auto text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full">{ongoing.length}</span>
          </h2>
          <div className="space-y-2">
            {ongoing.map(r => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ChevronRight size={16} className="text-[#0F4C8A]" />
            À venir
            <span className="ml-auto text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full">{upcoming.length}</span>
          </h2>
          <div className="space-y-2">
            {upcoming.map(r => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      )}

      {properties.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <Home size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">Aucune annonce publiée</p>
          <p className="text-sm text-gray-400 mb-5">Publiez votre premier logement pour recevoir des réservations.</p>
          <Link
            href="/host/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] transition-colors"
          >
            <Plus size={15} />
            Créer une annonce
          </Link>
        </div>
      )}
    </div>
  );
}

function ReservationCard({ r }: { r: Reservation }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 bg-white border rounded-xl shadow-sm ${
      r.paymentPending ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200'
    }`}>
      <img src={r.propertyImage} alt={r.propertyTitle} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm truncate">{r.propertyTitle}</p>
          {r.paymentPending && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock size={9} /> Paiement en cours
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <img src={r.guestAvatar} alt={r.guestName} className="w-4 h-4 rounded-full object-cover" />
          <p className="text-xs text-gray-500 truncate">{r.guestName} · {r.guests} voy.</p>
        </div>
        <p className="text-xs text-[#0F4C8A] font-medium mt-0.5">
          {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 text-sm">{r.totalAmount} DT</p>
        <p className="text-xs text-gray-400">{r.nights} nuit{r.nights > 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
