'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Users, BedDouble, Bath, Wifi, Waves, Wind,
  UtensilsCrossed, Car, Trees, Flame, CheckCircle,
  Share, Heart, Shield, Clock, MessageSquare, Award, X, AlertCircle,
} from 'lucide-react';
import { properties } from '@/lib/data';
import { getSubmittedProperties, getUser, saveBooking } from '@/lib/store';
import { Property, Booking } from '@/lib/types';

const MONTHS_FR = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={20} />,
  'Piscine': <Waves size={20} />,
  'Climatisation': <Wind size={20} />,
  'Cuisine équipée': <UtensilsCrossed size={20} />,
  'Parking': <Car size={20} />,
  'Terrasse': <Trees size={20} />,
  'Cheminée': <Flame size={20} />,
};

function getAmenityIcon(name: string) {
  return amenityIcons[name] ?? <CheckCircle size={20} />;
}

function fmtDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
}

// ── Booking confirmation modal ────────────────────────────────────────────────

function BookingConfirmModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const router = useRouter();
  const isConfirmed = booking.status === 'confirmed';
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isConfirmed || !booking.paymentDeadline) return;
    const update = () => {
      const diff = booking.paymentDeadline! - Date.now();
      if (diff <= 0) { setTimeLeft('Délai expiré'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [isConfirmed, booking.paymentDeadline]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Status header */}
        <div className={`px-6 pt-6 pb-5 text-center ${isConfirmed ? 'bg-green-50' : 'bg-blue-50'}`}>
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${isConfirmed ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isConfirmed
              ? <CheckCircle size={30} className="text-green-600" />
              : <Clock size={30} className="text-blue-600" />}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isConfirmed ? 'Réservation confirmée !' : 'Demande envoyée'}
          </h3>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            {isConfirmed
              ? 'Votre réservation a été acceptée automatiquement.'
              : "L'hôte a bien reçu votre demande, une réponse vous parviendra dans les 24 heures."}
          </p>
        </div>

        {/* Booking details */}
        <div className="px-6 py-4 space-y-2.5 border-b border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Logement</span>
            <span className="font-medium text-right max-w-[60%] truncate">{booking.propertyTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Arrivée</span>
            <span className="font-medium">{fmtDate(booking.checkIn)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Départ</span>
            <span className="font-medium">{fmtDate(booking.checkOut)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{booking.nights} nuit{booking.nights > 1 ? 's' : ''} · {booking.guests} voyageur{booking.guests > 1 ? 's' : ''}</span>
            <span className="font-bold text-gray-900">{booking.total} DT</span>
          </div>
        </div>

        {/* Payment section (confirmed only) */}
        {isConfirmed && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Paiement requis dans les 6 heures</span>
            </div>
            {timeLeft && (
              <div className="text-2xl font-bold text-amber-800 font-mono mb-3">{timeLeft}</div>
            )}
            <button
              disabled
              className="w-full py-3 bg-amber-400 text-white rounded-xl font-bold text-sm opacity-60 cursor-not-allowed"
            >
              Procéder au paiement — Interface à venir
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => { onClose(); router.push('/reservations'); }}
            className="flex-1 py-3 bg-[#0F4C8A] text-white rounded-xl text-sm font-bold hover:bg-[#0A3566] transition-colors"
          >
            Mes réservations
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Booking form (shared desktop/mobile) ──────────────────────────────────────

function BookingForm({ property }: { property: Property }) {
  const router = useRouter();
  const todayStr = new Date().toISOString().slice(0, 10);
  const minNights = property.minNights || 1;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  const minCheckOut = checkIn
    ? (() => {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + minNights);
        return d.toISOString().slice(0, 10);
      })()
    : todayStr;

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  })();

  const basePrice = property.price;
  const cleaningFee = property.cleaningFee || 0;
  const serviceFee = nights > 0 ? Math.round(basePrice * nights * 0.12) : 0;
  const total = nights > 0 ? basePrice * nights + cleaningFee + serviceFee : 0;
  const canReserve = !!checkIn && !!checkOut && nights >= minNights;

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    setError('');
    if (checkOut && val) {
      const d = new Date(val);
      d.setDate(d.getDate() + minNights);
      if (checkOut < d.toISOString().slice(0, 10)) setCheckOut('');
    }
  }

  async function handleReserve() {
    setError('');
    const user = getUser();
    if (!user) { router.push(`/login?redirect=/properties/${property.id}`); return; }
    if (user.role === 'host') {
      setError('Passez en mode Voyageur pour effectuer une réservation.');
      return;
    }
    if (!canReserve) return;

    setCompleting(true);
    const autoApproved = property.autoApprove ?? false;
    const now = Date.now();
    const booking: Booking = {
      id: `booking-${now}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyImage: property.images[0],
      propertyLocation: property.location,
      guestId: user.id,
      guestName: user.name,
      guestAvatar: user.avatar,
      checkIn, checkOut, nights, guests,
      pricePerNight: basePrice,
      cleaningFee,
      serviceFee,
      total,
      status: autoApproved ? 'confirmed' : 'pending',
      autoApproved,
      createdAt: now,
      paymentDeadline: autoApproved ? now + 6 * 3600000 : undefined,
    };
    saveBooking(booking);
    await new Promise(r => setTimeout(r, 600));
    setCompleting(false);
    setConfirmedBooking(booking);
  }

  return (
    <>
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r border-gray-300">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Arrivée</label>
            <input
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={e => handleCheckInChange(e.target.value)}
              className="w-full text-sm text-gray-900 outline-none"
            />
          </div>
          <div className="p-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Départ</label>
            <input
              type="date"
              value={checkOut}
              min={minCheckOut}
              disabled={!checkIn}
              onChange={e => { setCheckOut(e.target.value); setError(''); }}
              className="w-full text-sm text-gray-900 outline-none disabled:opacity-40"
            />
          </div>
        </div>
        <div className="p-3 border-t border-gray-300">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Voyageurs</label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900">{guests} voyageur{guests > 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-700 transition-colors"
              >−</button>
              <span className="font-medium w-4 text-center">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests(Math.min(property.guests, guests + 1))}
                className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-700 transition-colors"
              >+</button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Maximum {property.guests} voyageur{property.guests > 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleReserve}
        disabled={completing}
        className={`w-full py-4 rounded-xl font-bold text-base transition-colors mb-3 flex items-center justify-center gap-2 ${
          canReserve
            ? 'bg-[#0F4C8A] text-white hover:bg-[#0A3566]'
            : 'bg-gray-100 text-gray-400 cursor-default'
        }`}
      >
        {completing
          ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Traitement...</>
          : canReserve ? 'Réserver' : 'Sélectionnez vos dates'}
      </button>

      <p className="text-center text-xs text-gray-500 mb-4">Vous ne serez pas encore débité</p>

      {nights > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{basePrice} DT × {nights} nuit{nights > 1 ? 's' : ''}</span>
            <span className="text-gray-900">{basePrice * nights} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frais de ménage</span>
            <span className="text-gray-900">{cleaningFee} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frais de service Hostn</span>
            <span className="text-gray-900">{serviceFee} DT</span>
          </div>
          <div className="flex justify-between font-bold pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>{total} DT</span>
          </div>
        </div>
      )}

      {minNights > 1 && (
        <p className="text-xs text-gray-500 mt-3 text-center">Séjour minimum : {minNights} nuits</p>
      )}

      {confirmedBooking && (
        <BookingConfirmModal booking={confirmedBooking} onClose={() => setConfirmedBooking(null)} />
      )}
    </>
  );
}

// ── Main PropertyDetail ───────────────────────────────────────────────────────

export default function PropertyDetail({ id }: { id: string }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);

  useEffect(() => {
    const mock = properties.find((p) => p.id === id);
    if (mock) { setProperty(mock); return; }
    const submitted = getSubmittedProperties();
    const found = submitted.find((p) => p.id === id);
    setProperty(found ?? null);
  }, [id]);

  if (property === undefined) return null;
  if (!property) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Logement introuvable</h1>
      <Link href="/properties" className="text-[#0F4C8A] underline">Voir tous les logements</Link>
    </div>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span>/</span>
          <Link href="/properties" className="hover:underline">Logements</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{property.title}</span>
        </div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{property.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1 font-semibold">
                <Star size={14} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                {property.rating}
              </span>
              <span className="text-gray-500">({property.reviewCount} avis)</span>
              {property.host.isSuperhost && (
                <span className="flex items-center gap-1 text-[#0F4C8A] font-semibold">
                  <Award size={14} />Superhôte
                </span>
              )}
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin size={13} />{property.location}, {property.wilaya}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Share size={16} />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : ''} />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          </div>
        </div>

        {/* Photo gallery */}
        <div
          className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-72 sm:h-96 mb-8 cursor-pointer"
          onClick={() => setGalleryOpen(true)}
        >
          <div className="col-span-2 row-span-2 relative overflow-hidden">
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
          {property.images.slice(1, 5).map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>

        {/* Gallery overlay */}
        {galleryOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
            >✕</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl w-full max-h-full overflow-y-auto">
              {property.images.map((img, i) => (
                <img key={i} src={img} alt={`Photo ${i + 1}`} className="w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* Main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Capacity */}
            <div className="flex flex-wrap gap-4 pb-6 border-b border-gray-200">
              {[
                { icon: Users, label: `${property.guests} voyageurs` },
                { icon: BedDouble, label: `${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}` },
                { icon: BedDouble, label: `${property.beds} lit${property.beds > 1 ? 's' : ''}` },
                { icon: Bath, label: `${property.bathrooms} salle${property.bathrooms > 1 ? 's' : ''} de bain` },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-700">
                  <Icon size={18} className="text-[#0F4C8A]" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>

            {/* Host inline */}
            <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
              <img src={property.host.avatar} alt={property.host.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h3 className="font-semibold text-gray-900">Logement proposé par {property.host.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {property.host.isSuperhost && (
                    <span className="text-xs bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full font-medium">Superhôte</span>
                  )}
                  <span className="text-sm text-gray-500">Membre depuis {property.host.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-gray-200">
              {[
                { icon: Award, title: property.host.isSuperhost ? 'Superhôte' : 'Hôte expérimenté', sub: `${property.host.responseRate}% de taux de réponse` },
                { icon: Clock, title: 'Arrivée simplifiée', sub: 'Disponible après 15h00' },
                { icon: Shield, title: 'Hostn Protect', sub: 'Protection pour votre séjour' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon size={22} className="text-[#0F4C8A] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{title}</div>
                    <div className="text-sm text-gray-500">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Équipements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 text-gray-700">
                    <span className="text-[#0F4C8A]">{getAmenityIcon(amenity)}</span>
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House rules */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Règles de la maison</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.houseRules.map((rule) => (
                  <div key={rule.title} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#0F4C8A] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{rule.title}</div>
                      <div className="text-sm text-gray-500">{rule.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Star size={20} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                <h2 className="text-xl font-bold text-gray-900">{property.rating} · {property.reviewCount} avis</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {property.reviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={review.avatar} alt={review.author} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{review.author}</div>
                        <div className="text-xs text-gray-500">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < Math.round(review.rating) ? 'fill-[#0F4C8A] text-[#0F4C8A]' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Host section */}
            <div className="border border-gray-200 rounded-2xl p-6 mt-8">
              <div className="flex items-start gap-4 mb-4">
                <img src={property.host.avatar} alt={property.host.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{property.host.name}</h3>
                  {property.host.isSuperhost && (
                    <span className="text-xs bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit mt-1">
                      <Award size={11} /> Superhôte
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{property.host.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>Taux de réponse : <strong>{property.host.responseRate}%</strong></span>
                <span>Délai de réponse : <strong>{property.host.responseTime}</strong></span>
              </div>
              <Link href="/messages" className="inline-flex items-center gap-2 px-5 py-3 border border-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                <MessageSquare size={16} />
                Contacter {property.host.name.split(' ')[0]}
              </Link>
            </div>
          </div>

          {/* Desktop booking sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg sticky top-24">
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-bold text-gray-900">{property.price} DT</span>
                <span className="text-gray-500">/ nuit</span>
              </div>
              <BookingForm property={property} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xl font-bold text-gray-900">{property.price} DT</span>
          <span className="text-sm text-gray-500"> / nuit</span>
          <span className="ml-2 text-xs text-gray-400">
            · <Star size={11} className="inline fill-gray-400 text-gray-400 -mt-0.5" /> {property.rating}
          </span>
        </div>
        <button
          onClick={() => setMobileBookingOpen(true)}
          className="px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-bold text-sm hover:bg-[#0A3566] transition-colors"
        >
          Réserver
        </button>
      </div>

      {/* Mobile booking bottom sheet */}
      {mobileBookingOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileBookingOpen(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100 z-10">
              <div>
                <span className="font-bold text-lg text-gray-900">{property.price} DT</span>
                <span className="text-sm text-gray-500 ml-1">/ nuit</span>
              </div>
              <button onClick={() => setMobileBookingOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="px-5 py-4 pb-8">
              <BookingForm property={property} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
