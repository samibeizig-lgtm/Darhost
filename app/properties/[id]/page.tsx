'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Star, MapPin, Users, BedDouble, Bath, Wifi, Waves, Wind,
  UtensilsCrossed, Car, Trees, Flame, CheckCircle, ChevronLeft,
  Share, Heart, Shield, Clock, MessageSquare, Award
} from 'lucide-react';
import { properties } from '@/lib/data';

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

function BookingWidget({ price, cleaningFee, minNights }: {
  price: number;
  cleaningFee: number;
  minNights: number;
}) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.round(ms / 86400000));
  })();

  const serviceFee = nights > 0 ? Math.round(price * nights * 0.12) : 0;
  const total = nights > 0 ? price * nights + cleaningFee + serviceFee : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg sticky top-24">
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-bold text-gray-900">{price} DT</span>
        <span className="text-gray-500">/ nuit</span>
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r border-gray-300">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Arrivée
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-sm text-gray-900 outline-none"
            />
          </div>
          <div className="p-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Départ
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm text-gray-900 outline-none"
            />
          </div>
        </div>
        <div className="p-3 border-t border-gray-300">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
            Voyageurs
          </label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900">{guests} voyageur{guests > 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-700 transition-colors"
              >
                −
              </button>
              <span className="font-medium w-4 text-center">{guests}</span>
              <button
                onClick={() => setGuests(guests + 1)}
                className="w-7 h-7 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-[#0F4C8A] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0A3566] transition-colors mb-3">
        {nights > 0 ? 'Réserver' : 'Vérifier la disponibilité'}
      </button>

      <p className="text-center text-sm text-gray-500 mb-4">
        Vous ne serez pas encore débité
      </p>

      {nights > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 underline cursor-pointer">
              {price} DT × {nights} nuit{nights > 1 ? 's' : ''}
            </span>
            <span className="text-gray-900">{price * nights} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 underline cursor-pointer">Frais de ménage</span>
            <span className="text-gray-900">{cleaningFee} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 underline cursor-pointer">Frais de service DarHost</span>
            <span className="text-gray-900">{serviceFee} DT</span>
          </div>
          <div className="flex justify-between font-bold pt-3 border-t border-gray-200">
            <span>Total</span>
            <span>{total} DT</span>
          </div>
        </div>
      )}

      {minNights > 1 && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Séjour minimum : {minNights} nuits
        </p>
      )}
    </div>
  );
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = properties.find((p) => p.id === params.id);
  if (!property) notFound();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Award size={14} />
                Superhôte
              </span>
            )}
            <span className="text-gray-500 flex items-center gap-1">
              <MapPin size={13} />
              {property.location}, {property.wilaya}
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
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        {property.images.slice(1, 5).map((img, i) => (
          <div key={i} className="relative overflow-hidden">
            <img
              src={img}
              alt={`Photo ${i + 2}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
          className="absolute bottom-4 right-4 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          style={{ position: 'relative', marginTop: '-40px', zIndex: 10, display: 'none' }}
        >
          Voir toutes les photos
        </button>
      </div>

      {/* Gallery overlay */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl w-full max-h-full overflow-y-auto">
            {property.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Photo ${i + 1}`}
                className="w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: details */}
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

          {/* Host info inline */}
          <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
            <img
              src={property.host.avatar}
              alt={property.host.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                Logement proposé par {property.host.name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {property.host.isSuperhost && (
                  <span className="text-xs bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full font-medium">
                    Superhôte
                  </span>
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
              { icon: Shield, title: 'DarHost Protect', sub: 'Protection pour votre séjour' },
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
              <h2 className="text-xl font-bold text-gray-900">
                {property.rating} · {property.reviewCount} avis
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {property.reviews.map((review) => (
                <div key={review.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{review.author}</div>
                      <div className="text-xs text-gray-500">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.round(review.rating) ? 'fill-[#0F4C8A] text-[#0F4C8A]' : 'text-gray-300'}
                      />
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
              <img
                src={property.host.avatar}
                alt={property.host.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{property.host.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {property.host.isSuperhost && (
                    <span className="text-xs bg-[#E8F0FB] text-[#0F4C8A] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Award size={11} /> Superhôte
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{property.host.bio}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span>Taux de réponse : <strong>{property.host.responseRate}%</strong></span>
              <span>Délai de réponse : <strong>{property.host.responseTime}</strong></span>
            </div>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={16} />
              Contacter {property.host.name.split(' ')[0]}
            </Link>
          </div>
        </div>

        {/* Right: booking widget */}
        <div className="lg:col-span-1">
          <BookingWidget
            price={property.price}
            cleaningFee={property.cleaningFee}
            minNights={property.minNights}
          />
        </div>
      </div>
    </div>
  );
}
