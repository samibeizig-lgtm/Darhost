'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Edit3, Award, MapPin, Calendar, Home, MessageSquare, LogOut } from 'lucide-react';
import { properties } from '@/lib/data';

const MOCK_USER = {
  name: 'Mohamed Ben Salah',
  email: 'mohamed.bensalah@email.com',
  avatar: 'https://i.pravatar.cc/150?img=12',
  joinDate: 'Membre depuis Juin 2022',
  bio: 'Passionné de voyages et de découvertes culturelles. J\'adore explorer la Tunisie et rencontrer de nouvelles personnes.',
  phone: '+216 98 765 432',
  location: 'Tunis, Tunisie',
  reviewsReceived: 12,
  rating: 4.9,
  isHost: true,
};

const MOCK_BOOKINGS = [
  {
    id: 'b1',
    property: properties[0],
    checkIn: '15 Juin 2024',
    checkOut: '20 Juin 2024',
    nights: 5,
    total: 2330,
    status: 'Confirmée',
    statusColor: 'green',
  },
  {
    id: 'b2',
    property: properties[2],
    checkIn: '1 Août 2024',
    checkOut: '8 Août 2024',
    nights: 7,
    total: 4160,
    status: 'En attente',
    statusColor: 'yellow',
  },
  {
    id: 'b3',
    property: properties[6],
    checkIn: '10 Novembre 2024',
    checkOut: '14 Novembre 2024',
    nights: 4,
    total: 1085,
    status: 'Passée',
    statusColor: 'gray',
  },
];

const MOCK_REVIEWS = [
  {
    id: 'rv1',
    from: 'Yasmine Ben Ali',
    avatar: 'https://i.pravatar.cc/150?img=47',
    date: 'Mai 2024',
    rating: 5,
    comment: 'Mohamed est un voyageur exemplaire ! Très respectueux et communicatif.',
    property: 'Villa Blanche de Sidi Bou Said',
  },
  {
    id: 'rv2',
    from: 'Sonia Trabelsi',
    avatar: 'https://i.pravatar.cc/150?img=49',
    date: 'Novembre 2023',
    rating: 5,
    comment: 'Excellent voyageur, la maison était impeccable à son départ. Bienvenue à tout moment !',
    property: 'Maison Tozeur Oasis',
  },
];

type Tab = 'reservations' | 'properties' | 'reviews' | 'settings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('reservations');

  const myProperties = properties.slice(0, 2);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'reservations', label: 'Mes réservations', icon: <Calendar size={16} /> },
    ...(MOCK_USER.isHost ? [{ key: 'properties' as Tab, label: 'Mes logements', icon: <Home size={16} /> }] : []),
    { key: 'reviews', label: 'Avis reçus', icon: <Star size={16} /> },
    { key: 'settings', label: 'Paramètres', icon: <Edit3 size={16} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <img
              src={MOCK_USER.avatar}
              alt={MOCK_USER.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#E8F0FB]"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#0F4C8A] text-white rounded-full flex items-center justify-center hover:bg-[#0A3566] transition-colors">
              <Edit3 size={14} />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{MOCK_USER.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {MOCK_USER.isHost && (
                    <span className="inline-flex items-center gap-1 text-xs bg-[#E8F0FB] text-[#0F4C8A] px-2.5 py-1 rounded-full font-semibold">
                      <Award size={12} /> Superhôte
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={13} />
                    {MOCK_USER.location}
                  </span>
                  <span className="text-sm text-gray-500">{MOCK_USER.joinDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-[#0F4C8A]">{MOCK_USER.rating}</div>
                  <div className="flex items-center gap-0.5 justify-center">
                    <Star size={12} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                  </div>
                  <div className="text-xs text-gray-500">Note</div>
                </div>
                <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-[#0F4C8A]">{MOCK_USER.reviewsReceived}</div>
                  <div className="text-xs text-gray-500">Avis</div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-3 max-w-xl">{MOCK_USER.bio}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/messages"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageSquare size={15} />
            Messages
          </Link>
          {MOCK_USER.isHost && (
            <Link
              href="/host/submit"
              className="flex items-center gap-2 px-4 py-2 bg-[#0F4C8A] text-white rounded-full text-sm font-medium hover:bg-[#0A3566] transition-colors"
            >
              <Home size={15} />
              Ajouter un logement
            </Link>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-colors ml-auto">
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-[#0F4C8A] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {MOCK_BOOKINGS.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4"
            >
              <img
                src={booking.property.images[0]}
                alt={booking.property.title}
                className="w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <Link
                      href={`/properties/${booking.property.id}`}
                      className="font-semibold text-gray-900 hover:text-[#0F4C8A] transition-colors"
                    >
                      {booking.property.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {booking.property.location}, {booking.property.wilaya}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      booking.statusColor === 'green'
                        ? 'bg-green-100 text-green-700'
                        : booking.statusColor === 'yellow'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {booking.checkIn} → {booking.checkOut}
                  </span>
                  <span>{booking.nights} nuits</span>
                  <span className="font-semibold text-gray-900">{booking.total} DT</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {myProperties.map((property) => (
            <div key={property.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-[16/9]">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Actif
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900">{property.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {property.location} · {property.type}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={13} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                    <span className="font-semibold">{property.rating}</span>
                    <span className="text-gray-500">({property.reviewCount})</span>
                  </div>
                  <span className="font-bold text-gray-900">{property.price} DT / nuit</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/properties/${property.id}`}
                    className="flex-1 text-center py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Voir
                  </Link>
                  <button className="flex-1 py-2 bg-[#0F4C8A] text-white rounded-xl text-sm font-medium hover:bg-[#0A3566] transition-colors">
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/host/submit"
            className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-10 text-center hover:border-[#0F4C8A] hover:bg-[#E8F0FB]/30 transition-colors group"
          >
            <div className="text-4xl mb-3">+</div>
            <div className="font-semibold text-gray-700 group-hover:text-[#0F4C8A]">
              Ajouter un logement
            </div>
          </Link>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {MOCK_REVIEWS.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={review.avatar}
                  alt={review.from}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">{review.from}</div>
                      <div className="text-sm text-gray-500">{review.date}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-[#0F4C8A] text-[#0F4C8A]' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-2 leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Pour : <span className="text-[#0F4C8A]">{review.property}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Paramètres du compte</h2>
          <div className="space-y-5">
            {[
              { label: 'Prénom', value: 'Mohamed', type: 'text' },
              { label: 'Nom', value: 'Ben Salah', type: 'text' },
              { label: 'Adresse e-mail', value: MOCK_USER.email, type: 'email' },
              { label: 'Téléphone', value: MOCK_USER.phone, type: 'tel' },
            ].map(({ label, value, type }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  defaultValue={value}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Biographie</label>
              <textarea
                defaultValue={MOCK_USER.bio}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
              />
            </div>
            <button className="px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] transition-colors">
              Enregistrer les modifications
            </button>
          </div>

          {/* Danger zone */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-base font-bold text-red-600 mb-3">Zone de danger</h3>
            <button className="px-5 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
