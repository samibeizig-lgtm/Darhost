'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, CheckCircle, Search, AlertCircle, XCircle, BookOpen, Plane, Car, Map, Zap, MoreHorizontal } from 'lucide-react';
import { getUser, syncBookingsFromRemote, cancelExpiredBookings, syncServiceBookingsFromRemote } from '@/lib/store';
import { Booking, ServiceBooking, ServiceType } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function fmtDate(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]}`;
}

const STATUS_CONFIG = {
  pending:   { label: 'En attente',  cls: 'bg-orange-100 text-orange-700', icon: Clock },
  confirmed: { label: 'Confirmée',   cls: 'bg-green-100 text-green-700',   icon: CheckCircle },
  refused:   { label: 'Refusée',     cls: 'bg-red-100 text-red-600',       icon: XCircle },
  cancelled: { label: 'Annulée',     cls: 'bg-gray-100 text-gray-500',     icon: XCircle },
  paid:      { label: 'Payée',       cls: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
};

function isActive(b: Booking): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return (b.status === 'pending' || b.status === 'confirmed') && b.checkOut > today;
}

const SERVICE_TYPE_ICONS: Record<ServiceType, React.ElementType> = {
  transfert: Plane, voiture: Car, guide: Map, activite: Zap, autre: MoreHorizontal,
};
const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  transfert: 'bg-blue-100 text-blue-700',
  voiture: 'bg-purple-100 text-purple-700',
  guide: 'bg-green-100 text-green-700',
  activite: 'bg-orange-100 text-orange-700',
  autre: 'bg-gray-100 text-gray-600',
};

function ServiceBookingCard({ b }: { b: ServiceBooking }) {
  const { t } = useLanguage();
  const Icon = SERVICE_TYPE_ICONS[b.serviceType];
  const colorCls = SERVICE_TYPE_COLORS[b.serviceType];
  const statusCls = b.status === 'pending' ? 'bg-orange-100 text-orange-700'
    : b.status === 'confirmed' ? 'bg-green-100 text-green-700'
    : b.status === 'paid' ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-500';
  const statusLabel = b.status === 'pending' ? 'En attente'
    : b.status === 'confirmed' ? 'Confirmée'
    : b.status === 'paid' ? 'Payée'
    : b.status === 'refused' ? 'Refusée'
    : 'Annulée';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-3.5">
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
          {b.serviceImage ? (
            <img src={b.serviceImage} alt={b.serviceTitle} className="w-full h-full object-cover" />
          ) : (
            <Icon size={28} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{b.serviceTitle}</h3>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
          </div>
          <div className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colorCls}`}>
            <Icon size={10} /> {t(`service.type_${b.serviceType}`)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{b.serviceLocation}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#0F4C8A] font-medium">
            <Calendar size={11} className="shrink-0" />
            <span>{b.date}{b.endDate ? ` → ${b.endDate}` : ''}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Users size={11} className="shrink-0" />
            <span>{b.persons} pers. · {b.providerName}</span>
          </div>
        </div>
      </div>
      {b.status === 'confirmed' && (
        <div className="mx-3.5 mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
              <Clock size={13} /> Paiement requis
            </div>
            <Link
              href={`/payment?id=${b.id}`}
              className="text-xs bg-[#0F4C8A] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#0A3566] transition-colors"
            >
              Procéder au paiement
            </Link>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 bg-gray-50">
        <Link href={`/services/${b.serviceId}`} className="text-xs text-[#0F4C8A] font-medium hover:underline">
          Voir le service
        </Link>
        <span className="font-bold text-gray-900 text-sm">{b.total} DT</span>
      </div>
    </div>
  );
}

function BookingCard({ b }: { b: Booking }) {
  const cfg = STATUS_CONFIG[b.status];
  const StatusIcon = cfg.icon;
  const today = new Date().toISOString().slice(0, 10);
  const ongoing = b.checkIn <= today && b.checkOut > today;
  const paymentActive = b.status === 'confirmed' && b.paymentDeadline && b.paymentDeadline > Date.now();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-3.5">
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
          <img src={b.propertyImage} alt={b.propertyTitle} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{b.propertyTitle}</h3>
            <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
              <StatusIcon size={10} />
              {ongoing && b.status === 'confirmed' ? 'En cours' : cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{b.propertyLocation}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#0F4C8A] font-medium">
            <Calendar size={11} className="shrink-0" />
            <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
            <span className="text-gray-400 font-normal">· {b.nights} nuit{b.nights > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Users size={11} className="shrink-0" />
            <span>{b.guests} voyageur{b.guests > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {paymentActive && (
        <div className="mx-3.5 mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
              <Clock size={13} /> Paiement requis dans les 6h
            </div>
            <Link
              href={`/payment?id=${b.id}`}
              className="text-xs bg-[#0F4C8A] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#0A3566] transition-colors"
            >
              Procéder au paiement
            </Link>
          </div>
        </div>
      )}

      {b.status === 'refused' && (
        <div className="mx-3.5 mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={13} className="shrink-0" />
          L&apos;hôte n&apos;a pas pu accepter votre demande.
        </div>
      )}

      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 bg-gray-50">
        <Link href={`/properties/${b.propertyId}`} className="text-xs text-[#0F4C8A] font-medium hover:underline">
          Voir le logement
        </Link>
        <span className="font-bold text-gray-900 text-sm">{b.total} DT</span>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [tab, setTab] = useState<'properties' | 'services'>('properties');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/reservations'); return; }
    cancelExpiredBookings();
    Promise.all([
      syncBookingsFromRemote().then(all => all.filter(b => b.guestId === user.id).sort((a, b) => b.createdAt - a.createdAt)),
      syncServiceBookingsFromRemote(user.id).then(all => all.filter(b => b.guestId === user.id).sort((a, b) => b.createdAt - a.createdAt)),
    ]).then(([props, svcs]) => {
      setBookings(props);
      setServiceBookings(svcs);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const active = bookings.filter(b => isActive(b));
  const past   = bookings.filter(b => !isActive(b));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('bookings.title')}</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('properties')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'properties' ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-500'}`}
        >
          Hébergements
          {bookings.length > 0 && <span className="ml-1.5 text-xs text-gray-400">({bookings.length})</span>}
        </button>
        <button
          onClick={() => setTab('services')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'services' ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-500'}`}
        >
          {t('tab.services')}
          {serviceBookings.length > 0 && <span className="ml-1.5 text-xs text-gray-400">({serviceBookings.length})</span>}
        </button>
      </div>

      {tab === 'properties' ? (
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-[#0F4C8A]" /> Actives
              </h2>
              {active.length > 0 && (
                <span className="text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2.5 py-1 rounded-full">{active.length}</span>
              )}
            </div>

            {active.length === 0 ? (
              <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">{t('bookings.no_bookings')}</p>
                <Link href="/properties" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#0F4C8A] hover:underline">
                  <Search size={14} /> Trouver un logement
                </Link>
              </div>
            ) : (
              <div className="space-y-3">{active.map(b => <BookingCard key={b.id} b={b} />)}</div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle size={16} className="text-gray-400" /> Historique
                </h2>
                <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{past.length}</span>
              </div>
              <div className="space-y-3">{past.map(b => <BookingCard key={b.id} b={b} />)}</div>
            </section>
          )}

          {bookings.length === 0 && (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">{t('bookings.no_bookings')}</p>
              <p className="text-sm text-gray-400 mb-5">{t('bookings.no_bookings_sub')}</p>
              <Link href="/properties" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] transition-colors">
                <Search size={15} /> Explorer les logements
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {serviceBookings.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700 mb-1">{t('bookings.no_bookings')}</p>
              <p className="text-sm text-gray-400 mb-5">Vous n&apos;avez pas encore réservé de services</p>
              <Link href="/services" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] transition-colors">
                <Search size={15} /> Explorer les services
              </Link>
            </div>
          ) : (
            serviceBookings.map(b => <ServiceBookingCard key={b.id} b={b} />)
          )}
        </div>
      )}
    </div>
  );
}
