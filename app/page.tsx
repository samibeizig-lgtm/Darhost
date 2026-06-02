'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Calendar, Users, Star, Shield, Clock, Award,
  Landmark, Mountain, Sun, Waves, Leaf, Building2, Anchor, Palmtree,
  Home as HomeIcon,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { properties as mockProperties, localitesTunisie } from '@/lib/data';
import { syncPropertiesFromRemote, getUser } from '@/lib/store';
import { Property } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://plus.unsplash.com/premium_photo-1682377521625-c656fc1ff3e1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHZpbGxhfGVufDB8fDB8fHww',
];

const MOBILE_SECTIONS = [
  { labelKey: 'home.cat_beach', key: 'plage', type: 'category' as const, link: '/properties?category=plage' },
  { labelKey: 'home.cat_medina', key: 'medina', type: 'category' as const, link: '/properties?category=medina' },
  { labelKey: 'Djerba', key: 'djerba', type: 'city' as const, link: '/properties?location=Djerba' },
  { labelKey: 'home.cat_mountain', key: 'montagne', type: 'category' as const, link: '/properties?category=montagne' },
  { labelKey: 'Hammamet', key: 'hammamet', type: 'city' as const, link: '/properties?location=Hammamet' },
  { labelKey: 'home.cat_desert', key: 'desert', type: 'category' as const, link: '/properties?category=desert' },
  { labelKey: 'Tunis', key: 'tunis', type: 'city' as const, link: '/properties?location=Tunis' },
  { labelKey: 'home.cat_pool', key: 'piscine', type: 'category' as const, link: '/properties?category=piscine' },
  { labelKey: 'Sousse', key: 'sousse', type: 'city' as const, link: '/properties?location=Sousse' },
  { labelKey: 'home.cat_nature', key: 'nature', type: 'category' as const, link: '/properties?category=nature' },
];

const CATEGORY_DEFS = [
  { Icon: Palmtree, labelKey: 'home.cat_beach', value: 'plage' },
  { Icon: Landmark, labelKey: 'home.cat_medina', value: 'medina' },
  { Icon: Mountain, labelKey: 'home.cat_mountain', value: 'montagne' },
  { Icon: Sun, labelKey: 'home.cat_desert', value: 'desert' },
  { Icon: Waves, labelKey: 'home.cat_pool', value: 'piscine' },
  { Icon: Leaf, labelKey: 'home.cat_nature', value: 'nature' },
  { Icon: Building2, labelKey: 'home.cat_historic', value: 'historique' },
  { Icon: Anchor, labelKey: 'home.cat_sea', value: 'mer' },
];

const STAT_DEFS = [
  { icon: Award, value: '500+', labelKey: 'home.stat1_label' },
  { icon: Star, value: '4.8', labelKey: 'home.stat2_label' },
  { icon: Users, value: '12 000+', labelKey: 'home.stat3_label' },
  { icon: Shield, value: '100%', labelKey: 'home.stat4_label' },
];

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [activeCategory, setActiveCategory] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  const categories = CATEGORY_DEFS.map(c => ({ ...c, label: t(c.labelKey) }));
  const stats = STAT_DEFS.map(s => ({ ...s, label: t(s.labelKey) }));

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const [featured, setFeatured] = useState<Property[]>(mockProperties.slice(0, 8));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const desktopLocationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const inMobile = locationRef.current?.contains(e.target as Node);
      const inDesktop = desktopLocationRef.current?.contains(e.target as Node);
      if (!inMobile && !inDesktop) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleLocationChange(val: string) {
    setLocation(val);
    if (val.trim().length === 0) { setSuggestions([]); setShowSuggestions(false); return; }
    const q = val.toLowerCase();
    const matches = localitesTunisie.filter(l => l.toLowerCase().includes(q)).slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }

  useEffect(() => {

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const u = getUser();
      if (u?.role === 'host') { router.replace('/host/dashboard'); return; }
    }
    syncPropertiesFromRemote().then((submitted) => {
      setFeatured([...submitted, ...mockProperties].slice(0, 8));
    });
  }, [router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (guests) params.set('guests', guests);
    if (activeCategory) params.set('category', activeCategory);
    router.push(`/properties?${params.toString()}`);
  }

  const mobileSections = useMemo(() =>
    MOBILE_SECTIONS.map(s => ({
      ...s,
      label: s.labelKey.startsWith('home.') ? t(s.labelKey) : s.labelKey,
      properties: s.type === 'category'
        ? featured.filter(p => p.categories?.includes(s.key))
        : featured.filter(p =>
            p.wilaya?.toLowerCase().includes(s.key) ||
            p.location?.toLowerCase().includes(s.key)
          ),
    })).filter(s => s.properties.length > 0),
    [featured, t]
  );

  function handleCategoryClick(value: string) {
    const next = value === activeCategory ? '' : value;
    setActiveCategory(next);
    const params = new URLSearchParams();
    if (next) params.set('category', next);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div>
      <section className="relative text-white">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-[2500ms]"
            style={{ opacity: i === heroIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-10">
            <p className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              {t('home.badge')}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
              {t('home.title')}
              <br />
              <span className="text-[#F5E6C8]">{t('home.title2')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto">
            {/* Mobile layout */}
            <div className="sm:hidden flex flex-col gap-1.5 p-1">
              <div ref={locationRef} className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200">
                <MapPin size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.destination')}</label>
                  <input
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder={t('search.where')}
                    autoComplete="off"
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => { setLocation(s); setShowSuggestions(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-base text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-left transition-colors"
                      >
                        <MapPin size={14} className="text-gray-300 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200">
                  <Calendar size={16} className="text-[#0F4C8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.checkin')}</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-xs text-gray-700 outline-none bg-transparent" />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200">
                  <Calendar size={16} className="text-[#0F4C8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.checkout')}</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-xs text-gray-700 outline-none bg-transparent" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 flex-1">
                  <Users size={16} className="text-[#0F4C8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('property.guests')}</label>
                    <input type="number" min="1" max="20" value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full text-sm text-gray-700 outline-none bg-transparent" />
                  </div>
                </div>
                <button type="submit"
                  className="bg-[#0F4C8A] text-white rounded-xl px-5 py-3.5 font-semibold flex items-center gap-2 hover:bg-[#0A3566] transition-colors shrink-0">
                  <Search size={18} />
                  <span className="text-sm">{t('search.btn')}</span>
                </button>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-1">
              <div ref={desktopLocationRef} className="relative flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <MapPin size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.destination')}</label>
                  <input
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder={t('search.where')}
                    autoComplete="off"
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => { setLocation(s); setShowSuggestions(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-base text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-left transition-colors"
                      >
                        <MapPin size={14} className="text-gray-300 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <Calendar size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.checkin')}</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-sm text-gray-700 outline-none bg-transparent" />
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <Calendar size={18} className="text-[#0F4C8A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('search.checkout')}</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-sm text-gray-700 outline-none bg-transparent" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 py-2 rounded-xl">
                <div className="flex items-center gap-3 px-3 py-1 flex-1">
                  <Users size={18} className="text-[#0F4C8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-gray-700 mb-0.5">{t('property.guests')}</label>
                    <input type="number" min="1" max="20" value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full text-sm text-gray-700 outline-none bg-transparent" />
                  </div>
                </div>
                <button type="submit"
                  className="bg-[#0F4C8A] text-white rounded-xl px-5 py-3 font-semibold flex items-center gap-2 hover:bg-[#0A3566] transition-colors shrink-0">
                  <Search size={18} />
                  <span>{t('search.btn')}</span>
                </button>
              </div>
            </div>
          </form>

          <div className="flex justify-center gap-2 mt-6">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                aria-label={`Image ${i + 1}`}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === heroIndex ? 24 : 8,
                  height: 8,
                  background: i === heroIndex ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto py-3 px-4 sm:px-6 lg:px-8 scrollbar-hide"
               style={{ WebkitOverflowScrolling: 'touch' }}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-full shrink-0 transition-all text-xs font-medium border ${
                  activeCategory === cat.value
                    ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <cat.Icon
                  size={15}
                  className={activeCategory === cat.value ? 'text-white' : 'text-[#5B8AC5]'}
                />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile: sections horizontales par thème / ville */}
      <section className="md:hidden pt-6 pb-4 space-y-7">
        {(mobileSections.length > 0 ? mobileSections : [{ label: t('home.featured'), key: 'all', type: 'category' as const, link: '/properties', properties: featured }])
          .map((section) => (
          <div key={section.key}>
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-[15px] font-bold text-gray-900">{section.label}</h2>
              <Link href={section.link} className="text-xs font-semibold text-[#0F4C8A]">{t('home.see_all')} →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
              {section.properties.slice(0, 8).map((p) => (
                <Link href={`/properties/${p.id}`} key={p.id} className="w-36 shrink-0 pb-1">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gray-100 mb-2">
                    <img
                      src={p.images?.[0]}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{p.title}</p>
                  <p className="text-xs font-bold text-[#0F4C8A] mt-0.5">
                    {p.price} DT<span className="text-gray-400 font-normal">{t('common.per_night')}</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Desktop: grille classique */}
      <section className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('home.featured')}
            </h2>
          </div>
          <Link href="/properties" className="text-[#0F4C8A] font-semibold hover:underline text-sm sm:text-base">
            {t('home.see_all')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

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

      <section className="bg-gradient-to-r from-[#0F4C8A] to-[#1B6FBF] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HomeIcon size={36} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Partagez votre bien et gagnez de l&apos;argent
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Devenez hôte sur Hostn et générez des revenus supplémentaires en accueillant des
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
