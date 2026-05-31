'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Star, Clock, CheckCircle, Search } from 'lucide-react';
import { getUser } from '@/lib/store';
import { properties as mockProperties } from '@/lib/data';

const MONTHS_FR = [
  'jan', 'fév', 'mars', 'avr', 'mai', 'juin',
  'juil', 'août', 'sep', 'oct', 'nov', 'déc',
];

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

type Status = 'ongoing' | 'upcoming' | 'past';

interface GuestReservation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  hostName: string;
  hostAvatar: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  status: Status;
  rating?: number;
}

function buildReservations(): GuestReservation[] {
  const today = new Date();

  const make = (
    id: string, pi: number, status: Status,
    checkInOffset: number, nights: number, guests: number, rating?: number,
  ): GuestReservation => {
    const p = mockProperties[pi % mockProperties.length];
    const checkIn = addDays(today, checkInOffset);
    const checkOut = addDays(checkIn, nights);
    return {
      id,
      propertyId: p.id,
      propertyTitle: p.title,
      propertyImage: p.images[0],
      propertyLocation: p.location,
      hostName: p.host.name,
      hostAvatar: p.host.avatar,
      checkIn: toStr(checkIn),
      checkOut: toStr(checkOut),
      nights,
      guests,
      totalAmount: p.price * nights + (p.cleaningFee || 0),
      status,
      rating,
    };
  };

  return [
    make('gr1', 0, 'ongoing',   -2,  5, 2),
    make('gr2', 2, 'upcoming',   4,  4, 3),
    make('gr3', 1, 'upcoming',  12,  7, 2),
    make('gr4', 3, 'past',     -45,  5, 2, 5),
    make('gr5', 0, 'past',     -90,  3, 4, 4),
    make('gr6', 4, 'past',    -180,  6, 2, 5),
  ];
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  ongoing:  { label: 'En cours',  className: 'bg-green-100 text-green-700' },
  upcoming: { label: 'À venir',   className: 'bg-blue-100 text-[#0F4C8A]' },
  past:     { label: 'Terminée',  className: 'bg-gray-100 text-gray-500' },
};

export default function ReservationsPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/reservations'); return; }
    setLoaded(true);
  }, [router]);

  if (!loaded) return null;

  const reservations = buildReservations();
  const active = reservations.filter(r => r.status === 'ongoing' || r.status === 'upcoming');
  const past = reservations.filter(r => r.status === 'past');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
        <p className="text-sm text-gray-500 mt-0.5">{reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total</p>
      </div>

      {/* Active */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-[#0F4C8A]" />
            Actives
          </h2>
          <span className="text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2.5 py-1 rounded-full">
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
            <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune réservation active</p>
            <Link href="/properties" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#0F4C8A] hover:underline">
              <Search size={14} />
              Trouver un logement
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(r => <ReservationCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-gray-400" />
              Passées
            </h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {past.length}
            </span>
          </div>
          <div className="space-y-3">
            {past.map(r => <ReservationCard key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ReservationCard({ r }: { r: GuestReservation }) {
  const cfg = STATUS_CONFIG[r.status];

  return (
    <Link
      href={`/properties/${r.propertyId}`}
      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3 p-3.5">
        {/* Image */}
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
          <img src={r.propertyImage} alt={r.propertyTitle} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{r.propertyTitle}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{r.propertyLocation}</span>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-[#0F4C8A] font-medium">
            <Calendar size={11} className="shrink-0" />
            <span>{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</span>
            <span className="text-gray-400 font-normal">· {r.nights} nuit{r.nights > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Users size={11} className="shrink-0" />
            <span>{r.guests} voyageur{r.guests > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <img src={r.hostAvatar} alt={r.hostName} className="w-5 h-5 rounded-full object-cover" />
          <span className="text-xs text-gray-500 truncate">{r.hostName}</span>
        </div>
        <div className="flex items-center gap-3">
          {r.rating && r.status === 'past' && (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={i < r.rating! ? 'fill-[#0F4C8A] text-[#0F4C8A]' : 'text-gray-300'}
                />
              ))}
            </div>
          )}
          <span className="font-bold text-gray-900 text-sm">{r.totalAmount} DT</span>
        </div>
      </div>
    </Link>
  );
}
