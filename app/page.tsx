'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Calendar, Users, Star, Shield, Clock, Award,
  Umbrella, Landmark, Mountain, Sun, Waves, Leaf, Building2, Anchor,
  Home as HomeIcon,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { properties as mockProperties } from '@/lib/data';
import { getSubmittedProperties } from '@/lib/store';
import { Property } from '@/lib/types';

const categories = [
  { Icon: Umbrella, label: 'Plage', value: 'plage' },
  { Icon: Landmark, label: 'Médina', value: 'medina' },
  { Icon: Mountain, label: 'Montagne', value: 'montagne' },
  { Icon: Sun, label: 'Désert', value: 'desert' },
  { Icon: Waves, label: 'Piscine', value: 'piscine' },
  { Icon: Leaf, label: 'Nature', value: 'nature' },
  { Icon: Building2, label: 'Historique', value: 'historique' },
  { Icon: Anchor, label: 'Bord de mer', value: 'mer' },
];

const stats = [
  { icon: Award, value: '500+', label: 'Logements vérifiés' },
  { icon: Star, value: '4.8', label: 'Note moyenne' },
  { icon: Users, value: '12 000+', label: 'Voyageurs satisfaits' },
  { icon: Shield, value: '100%', label: 'Paiements sécurisés' },
];

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [activeCategory, setActiveCategory] = useState('');
  const [featured, setFeatured] = useState<Property[]>(mockProperties.slice(0, 8));

  useEffect(() => {
    const submitted = getSubmittedProperties();
    setFeatured([...submitted, ...mockProperties].slice(0, 8));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (guests) params.set('guests', guests);
    if (activeCategory) params.set('category', activeCategory);
    router.push(`/properties?${params.toString()}`);
  }

  function handleCategoryClick(value: string) {
    const next = value === activeCategory ? '' : value;
    setActiveCategory(next);
    const params = new URLSearchParams();
    if (next) params.set('category', next);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#051C44] via-[#0F4C8A] to-[#1B6FBF] text-white">
        {/* Sidi Bou Said photo fused with the blue gradient */}
        <img
          src="https://picsum.photos/seed/sidi1/1600/900"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.22] mix-blend-overlay pointer-events-none select-none"
        />

        {/* Decorative arches */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <svg
            className="absolute -right-24 -top-24 opacity-10"
            width="500"
            height="500"
            viewBox="0 0 500 500"
          >
            <circle cx="250" cy="250" r="200" stroke="white" strokeWidth="60" fill="none" />
            <circle cx="250" cy="250" r="120" stroke="white" strokeWidth="40" fill="none" />
          </svg>
          <svg
            className="absolute -left-16 bottom-0 opacity-10"
            width="300"
            height="300"
            viewBox="0 0 300 300"
          >
            <path d="M0 300 V100 Q0 0 150 0 Q300 0 300 100 V300Z" fill="white" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-10">
            <p className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              🇹🇳 La plateforme #1 de location en Tunisie
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
              Votre maison
              <br />
              <span className="text-[#F5E6C8]">en Tunisie</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Découvrez les plus belles demeures tunisiennes — villas bord de mer, riads de médina,
              chalets de montagne et oasis du désert.
            </p>
          </div>

          {/* Search card */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
              {/* Location */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <MapPin size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">Destination</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Où allez-vous ?"
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Check-in */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <Calendar size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">Arrivée</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-sm text-gray-700 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Check-out */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <Calendar size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">Départ</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-sm text-gray-700 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Guests + Search */}
              <div className="flex items-center gap-2 px-2 py-2 rounded-xl">
                <div className="flex items-center gap-3 px-3 py-1 flex-1">
                  <Users size={18} className="text-[#0F4C8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">Voyageurs</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full text-sm text-gray-700 outline-none bg-transparent"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#0F4C8A] text-white rounded-xl px-5 py-3 font-semibold flex items-center gap-2 hover:bg-[#0A3566] transition-colors shrink-0"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Rechercher</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-full shrink-0 transition-all text-sm font-medium border ${
                  activeCategory === cat.value
                    ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <cat.Icon
                  size={20}
                  className={activeCategory === cat.value ? 'text-white' : 'text-[#5B8AC5]'}
                />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured properties ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Logements populaires
            </h2>
            <p className="text-gray-500 mt-1">Les meilleures adresses sélectionnées pour vous</p>
          </div>
          <Link
            href="/properties"
            className="text-[#0F4C8A] font-semibold hover:underline text-sm sm:text-base"
          >
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#E8F0FB] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 bg-[#0F4C8A] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-white" />
                </div>
                <div className="text-2xl font-extrabold text-[#0F4C8A]">{value}</div>
                <div className="text-gray-600 text-sm mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations highlight ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Explorez la Tunisie
        </h2>
        <p className="text-gray-500 mb-8">Des destinations pour tous les goûts</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Sidi Bou Said', img: 'sidi1', count: '24 logements', color: '#0F4C8A' },
            { name: 'Djerba', img: 'djerba1', count: '38 logements', color: '#1B6FBF' },
            { name: 'Hammamet', img: 'hamm1', count: '52 logements', color: '#0A3566' },
            { name: 'Tozeur', img: 'tozeur1', count: '18 logements', color: '#255DCA' },
          ].map((dest) => (
            <Link
              key={dest.name}
              href={`/properties?location=${dest.name}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] block"
            >
              <img
                src={`https://picsum.photos/seed/${dest.img}/400/500`}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <div className="font-bold text-lg">{dest.name}</div>
                <div className="text-sm text-gray-300">{dest.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Become a host CTA ── */}
      <section className="bg-gradient-to-r from-[#0F4C8A] to-[#1B6FBF] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon size={36} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Partagez votre bien et gagnez de l&apos;argent
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Devenez hôte sur DarHost et générez des revenus supplémentaires en accueillant des
            voyageurs du monde entier dans votre logement tunisien.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/host/submit"
              className="px-8 py-4 bg-white text-[#0F4C8A] font-bold rounded-full hover:bg-gray-100 transition-colors text-lg"
            >
              Publier mon logement
            </Link>
            <Link
              href="#"
              className="px-8 py-4 border-2 border-white/60 text-white font-semibold rounded-full hover:border-white transition-colors text-lg"
            >
              En savoir plus
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-blue-200">
            {[
              { icon: Clock, text: 'Inscription en 10 minutes' },
              { icon: Shield, text: 'Paiements sécurisés et garantis' },
              { icon: Award, text: 'Support hôte 7j/7' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={16} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
