'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal, X, MapPin, ChevronDown,
  Umbrella, Landmark, Mountain, Sun, Waves, Leaf, Building2, Anchor,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { properties as mockProperties, CATEGORIES } from '@/lib/data';
import { PropertyType } from '@/lib/types';
import { getSubmittedProperties, importSharedProperty } from '@/lib/store';
import { Property } from '@/lib/types';

const AMENITIES_LIST = [
  'WiFi', 'Piscine', 'Climatisation', 'Cuisine équipée',
  'Parking', 'Terrasse', 'Jardin', 'Barbecue',
];

const TYPES: PropertyType[] = ['Villa', 'Appartement', 'Riad', 'Maison', 'Chambre'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  plage: Umbrella,
  medina: Landmark,
  montagne: Mountain,
  desert: Sun,
  piscine: Waves,
  nature: Leaf,
  historique: Building2,
  mer: Anchor,
};

function PropertiesPage() {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get('location') ?? '';
  const categoryParam = searchParams.get('category') ?? '';

  const [allProperties, setAllProperties] = useState<Property[]>(mockProperties);
  const [importLink, setImportLink] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [showImport, setShowImport] = useState(false);

  function refreshProperties() {
    const submitted = getSubmittedProperties();
    setAllProperties([...submitted, ...mockProperties]);
  }

  useEffect(() => { refreshProperties(); }, []);

  function handleImport() {
    try {
      const hash = importLink.includes('#share=') ? importLink.split('#share=')[1] : '';
      if (!hash) { setImportMsg('Lien invalide.'); return; }
      const json = decodeURIComponent(
        atob(hash).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const property = JSON.parse(json) as Property;
      importSharedProperty(property);
      refreshProperties();
      setImportLink('');
      setImportMsg('Annonce importée avec succès !');
      setTimeout(() => { setImportMsg(''); setShowImport(false); }, 2500);
    } catch {
      setImportMsg('Lien invalide ou corrompu.');
    }
  }

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
  const [location, setLocation] = useState(locationParam);

  function toggleType(type: PropertyType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function clearFilters() {
    setSelectedTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setSelectedCategories([]);
    setSortBy('default');
    setLocation('');
  }

  const filtered = useMemo(() => {
    let result = [...allProperties];

    if (location) {
      const q = location.toLowerCase();
      result = result.filter(
        (p) =>
          p.location.toLowerCase().includes(q) ||
          p.wilaya.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
      );
    }
    if (selectedTypes.length > 0) {
      result = result.filter((p) => selectedTypes.includes(p.type));
    }
    if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));
    if (selectedAmenities.length > 0) {
      result = result.filter((p) =>
        selectedAmenities.every((a) => p.amenities.includes(a))
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        p.categories && selectedCategories.some((c) => p.categories!.includes(c))
      );
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [location, selectedTypes, minPrice, maxPrice, selectedAmenities, selectedCategories, sortBy, allProperties]);

  const hasFilters =
    selectedTypes.length > 0 ||
    minPrice ||
    maxPrice ||
    selectedAmenities.length > 0 ||
    selectedCategories.length > 0 ||
    location;

  const activeFilterCount = [
    selectedTypes.length > 0,
    minPrice,
    maxPrice,
    selectedAmenities.length > 0,
    selectedCategories.length > 0,
    location,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {location ? `Logements à ${location}` : 'Tous les logements'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} logement{filtered.length !== 1 ? 's' : ''} disponible
            {filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:border-gray-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
            >
              <option value="default">Trier par : Recommandés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="rating">Mieux notés</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtres
            {hasFilters && (
              <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Import panel */}
      <div className="mb-4">
        {!showImport ? (
          <button
            onClick={() => setShowImport(true)}
            className="text-xs text-[#0F4C8A] hover:underline"
          >
            + Importer une annonce depuis un autre appareil
          </button>
        ) : (
          <div className="bg-[#E8F0FB] border border-[#B8D0F0] rounded-xl p-4">
            <p className="text-sm font-semibold text-[#0F4C8A] mb-2">Importer une annonce partagée</p>
            <div className="flex gap-2">
              <input
                value={importLink}
                onChange={(e) => setImportLink(e.target.value)}
                placeholder="Collez le lien de partage ici…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] transition-colors"
              >
                Importer
              </button>
              <button
                onClick={() => { setShowImport(false); setImportMsg(''); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
            {importMsg && (
              <p className={`text-xs mt-2 font-medium ${importMsg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>
                {importMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Filtres</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-[#0F4C8A] hover:underline font-medium flex items-center gap-1">
                <X size={14} />
                Effacer tout
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sidi Bou Said, Djerba..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] focus:border-transparent"
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix par nuit (DT)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
                <span className="flex items-center text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type de logement</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedTypes.includes(type)
                        ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                        : 'border-gray-300 text-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-5 pt-5 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Environnement</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => {
                const Icon = CATEGORY_ICONS[value];
                return (
                  <button
                    key={value}
                    onClick={() => toggleCategory(value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedCategories.includes(value)
                        ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                        : 'border-gray-300 text-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {Icon && (
                      <Icon
                        size={14}
                        className={selectedCategories.includes(value) ? 'text-white' : 'text-[#5B8AC5]'}
                      />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenities */}
          <div className="mt-5 pt-5 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Équipements</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedAmenities.includes(a)
                      ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun logement trouvé</h3>
          <p className="text-gray-500 mb-6">Essayez de modifier vos filtres de recherche</p>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-medium hover:bg-[#0A3566] transition-colors"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">Chargement...</div>}>
      <PropertiesPage />
    </Suspense>
  );
}
