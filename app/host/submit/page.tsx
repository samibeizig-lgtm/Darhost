'use client';

import { useState, useEffect } from 'react';
import {
  Check, ChevronRight, ChevronLeft, Upload, X, Plus, LogIn,
  Home, Building2, Landmark, Building, BedDouble,
  Umbrella, Mountain, Sun, Waves, Leaf, Anchor, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { wilayasTunisie, CATEGORIES, localitesTunisie } from '@/lib/data';
import { getUser, addSubmittedProperty, StoredUser } from '@/lib/store';
import { Property, PropertyType } from '@/lib/types';

const STEPS = [
  { n: 1, label: 'Type de bien' },
  { n: 2, label: 'Informations' },
  { n: 3, label: 'Description' },
  { n: 4, label: 'Photos' },
  { n: 5, label: 'Équipements' },
  { n: 6, label: 'Tarification' },
  { n: 7, label: 'Règles' },
  { n: 8, label: 'Compte bancaire' },
  { n: 9, label: 'Identité' },
  { n: 10, label: 'Récapitulatif' },
];

const PROPERTY_TYPES = [
  { value: 'Villa', Icon: Home, desc: 'Villa individuelle avec jardin' },
  { value: 'Appartement', Icon: Building2, desc: 'Appartement en immeuble' },
  { value: 'Riad', Icon: Landmark, desc: 'Maison traditionnelle avec patio' },
  { value: 'Maison', Icon: Building, desc: 'Maison mitoyenne ou individuelle' },
  { value: 'Chambre', Icon: BedDouble, desc: 'Chambre dans un logement partagé' },
];

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

const AMENITIES = [
  'WiFi', 'Piscine', 'Climatisation', 'Cuisine équipée', 'Parking', 'Terrasse',
  'Jardin', 'Barbecue', 'Lave-linge', 'Télévision', 'Cheminée', 'Vue mer',
  'Accès plage', 'Ascenseur', 'Sèche-linge', 'Fer à repasser', 'Bureau de travail',
];

const BANKS = [
  'BNA – Banque Nationale Agricole',
  'STB – Société Tunisienne de Banque',
  'BIAT – Banque Internationale Arabe de Tunisie',
  'Attijari Bank',
  'BH Bank',
  'Amen Bank',
  'UIB – Union Internationale de Banques',
  'Arab Tunisian Bank (ATB)',
  'Banque Zitouna',
  'Autre',
];

interface FormData {
  type: string;
  categories: string[];
  address: string;
  wilaya: string;
  guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  title: string;
  description: string;
  photos: File[];
  amenities: string[];
  pricePerNight: string;
  cleaningFee: string;
  minNights: string;
  checkIn: string;
  checkOut: string;
  noSmoking: boolean;
  noParties: boolean;
  noPets: boolean;
  noNoise: boolean;
  customRules: string[];
  streetNumber: string;
  streetName: string;
  mapsLink: string;
  bankHolder: string;
  bankName: string;
  iban: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

const INITIAL: FormData = {
  type: '', categories: [], address: '', wilaya: '',
  streetNumber: '', streetName: '', mapsLink: '',
  guests: '', bedrooms: '', beds: '', bathrooms: '',
  title: '', description: '', photos: [], amenities: [],
  pricePerNight: '', cleaningFee: '', minNights: '1',
  checkIn: '15:00', checkOut: '11:00',
  noSmoking: true, noParties: true, noPets: false, noNoise: true,
  customRules: [],
  bankHolder: '', bankName: '', iban: '',
  idFront: null, idBack: null, selfie: null,
};

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = url;
  });
}

export default function HostSubmitPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setAuthChecked(true);
  }, []);

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function toggleAmenity(a: string) {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter((x) => x !== a)
      : [...form.amenities, a]
    );
  }

  function toggleCategory(cat: string) {
    set('categories', form.categories.includes(cat)
      ? form.categories.filter((c) => c !== cat)
      : [...form.categories, cat]
    );
  }

  function addCustomRule() {
    if (newRule.trim()) {
      set('customRules', [...form.customRules, newRule.trim()]);
      setNewRule('');
    }
  }

  function removeCustomRule(i: number) {
    set('customRules', form.customRules.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    const seed = Date.now();
    const images = form.photos.length > 0
      ? await Promise.all(form.photos.map(compressPhoto))
      : [
          `https://picsum.photos/seed/${seed}/800/600`,
          `https://picsum.photos/seed/${seed + 1}/800/600`,
          `https://picsum.photos/seed/${seed + 2}/800/600`,
          `https://picsum.photos/seed/${seed + 3}/800/600`,
          `https://picsum.photos/seed/${seed + 4}/800/600`,
        ];
    const newProperty: Property = {
      id: `user-${seed}`,
      title: form.title,
      type: (form.type as PropertyType) || 'Maison',
      location: form.address,
      wilaya: form.wilaya,
      description: form.description,
      shortDescription: form.description.slice(0, 100) + '…',
      images,
      price: Number(form.pricePerNight) || 0,
      cleaningFee: Number(form.cleaningFee) || 0,
      guests: Number(form.guests) || 1,
      bedrooms: Number(form.bedrooms) || 1,
      bathrooms: Number(form.bathrooms) || 1,
      beds: Number(form.beds) || 1,
      rating: 0,
      reviewCount: 0,
      amenities: form.amenities,
      categories: form.categories,
      createdAt: seed,
      houseRules: [
        { title: 'Arrivée', description: `Après ${form.checkIn}` },
        { title: 'Départ', description: `Avant ${form.checkOut}` },
        ...(form.noSmoking ? [{ title: 'Pas de cigarette', description: 'Interdit de fumer' }] : []),
        ...(form.noParties ? [{ title: 'Pas de fêtes', description: "Pas d'événements" }] : []),
        ...(form.noPets ? [{ title: 'Animaux non admis', description: "Pas d'animaux" }] : []),
        ...(form.noNoise ? [{ title: 'Calme nocturne', description: 'Silence après 22h' }] : []),
        ...form.customRules.map((r) => ({ title: r, description: '' })),
      ],
      host: {
        id: user?.id ?? 'u-new',
        name: user?.name ?? 'Hôte DarHost',
        avatar: user?.avatar ?? 'https://i.pravatar.cc/150?img=12',
        joinDate: new Date().toLocaleDateString('fr-TN', { month: 'long', year: 'numeric' }),
        responseRate: 100,
        responseTime: "Dans l'heure",
        isSuperhost: false,
        bio: '',
      },
      reviews: [],
      minNights: Number(form.minNights) || 1,
      available: true,
    };
    addSubmittedProperty(newProperty);
    setSubmitted(true);
  }

  if (!authChecked) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#E8F0FB] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-[#0F4C8A]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Connexion requise</h1>
          <p className="text-gray-500 mb-8">
            Vous devez être connecté pour soumettre un logement sur DarHost.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register?redirect=/host/submit"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors"
            >
              <LogIn size={18} />
              Créer un compte hôte
            </Link>
            <Link
              href="/login?redirect=/host/submit"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Logement soumis !</h1>
          <p className="text-gray-600 mb-2">
            Votre bien <strong>{form.title}</strong> a bien été soumis pour vérification.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Notre équipe examine votre dossier sous 48h. Vous recevrez une confirmation par e-mail.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Publier votre logement</h1>
        <p className="text-gray-500 text-sm">Étape {step} sur {STEPS.length}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s) => (
            <button
              key={s.n}
              onClick={() => step > s.n && setStep(s.n)}
              className={`flex flex-col items-center gap-1 flex-1 ${step > s.n ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > s.n
                    ? 'bg-[#0F4C8A] text-white'
                    : step === s.n
                    ? 'bg-[#0F4C8A] text-white ring-4 ring-[#E8F0FB]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className="hidden md:block text-xs text-gray-500 text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-[#0F4C8A] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">

        {/* Step 1: Type + Categories */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quel type de bien proposez-vous ?</h2>
            <p className="text-gray-500 text-sm mb-6">Choisissez la catégorie qui correspond le mieux à votre logement.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {PROPERTY_TYPES.map(({ value, Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => set('type', value)}
                  className={`flex items-center gap-4 p-5 border-2 rounded-xl text-left transition-all ${
                    form.type === value
                      ? 'border-[#0F4C8A] bg-[#E8F0FB]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Icon
                    size={32}
                    className={form.type === value ? 'text-[#0F4C8A]' : 'text-[#5B8AC5]'}
                  />
                  <div>
                    <div className="font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-1">Environnement du logement</h3>
              <p className="text-gray-500 text-sm mb-4">Sélectionnez les catégories qui décrivent votre logement (plusieurs choix possibles).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(({ value, label }) => {
                  const Icon = CATEGORY_ICONS[value];
                  const selected = form.categories.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleCategory(value)}
                      className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl text-sm font-medium transition-all ${
                        selected
                          ? 'border-[#0F4C8A] bg-[#E8F0FB] text-[#0F4C8A]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {Icon && (
                        <Icon size={22} className={selected ? 'text-[#0F4C8A]' : 'text-[#5B8AC5]'} />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Basic info (without name — title is in Step 3) */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Informations de base</h2>
            <p className="text-gray-500 text-sm mb-6">Dites-nous où se trouve votre logement et sa capacité.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gouvernorat *</label>
                  <select
                    value={form.wilaya}
                    onChange={(e) => set('wilaya', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {wilayasTunisie.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville / Quartier *</label>
                  <input
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="ex: Hammamet Nord, Médina..."
                    list="localities-submit"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                  <datalist id="localities-submit">
                    {localitesTunisie.map((l) => <option key={l} value={l} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numéro de rue</label>
                  <input
                    value={form.streetNumber}
                    onChange={(e) => set('streetNumber', e.target.value)}
                    placeholder="ex: 12"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de la rue *</label>
                  <input
                    value={form.streetName}
                    onChange={(e) => set('streetName', e.target.value)}
                    placeholder="ex: Rue de la République"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lien Google Maps</label>
                <input
                  value={form.mapsLink}
                  onChange={(e) => set('mapsLink', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
                <p className="text-xs text-gray-400 mt-1">Depuis Google Maps : clic droit sur la localisation → &quot;Partager ou intégrer la carte&quot; → copier le lien</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'guests', label: 'Max voyageurs', placeholder: '6' },
                  { key: 'bedrooms', label: 'Chambres', placeholder: '3' },
                  { key: 'beds', label: 'Lits', placeholder: '4' },
                  { key: 'bathrooms', label: 'Salles de bain', placeholder: '2' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input
                      type="number"
                      min="1"
                      value={form[key as keyof FormData] as string}
                      onChange={(e) => set(key as keyof FormData, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Décrivez votre logement</h2>
            <p className="text-gray-500 text-sm mb-6">Un bon titre et une description claire augmentent vos réservations.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Titre de l&apos;annonce *
                  <span className="text-gray-400 font-normal ml-2">({form.title.length}/70)</span>
                </label>
                <input
                  value={form.title}
                  maxLength={70}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="ex: Villa avec vue mer à Sidi Bou Said"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description détaillée *
                  <span className="text-gray-400 font-normal ml-2">({form.description.length}/1000)</span>
                </label>
                <textarea
                  value={form.description}
                  maxLength={1000}
                  rows={8}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Décrivez votre logement, son environnement, les points forts, les activités à proximité..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ajoutez des photos</h2>
            <p className="text-gray-500 text-sm mb-6">Minimum 5 photos. Les logements avec de belles photos reçoivent 3× plus de réservations.</p>

            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-[#0F4C8A] hover:bg-[#E8F0FB]/30 transition-colors mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    set('photos', [...form.photos, ...Array.from(e.target.files)]);
                  }
                }}
              />
              <Upload size={36} className="mx-auto text-[#0F4C8A] mb-3" />
              <p className="font-semibold text-gray-700">Glissez vos photos ici</p>
              <p className="text-sm text-gray-500 mt-1">ou cliquez pour sélectionner</p>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, WEBP — max 10 Mo par photo</p>
            </label>

            {form.photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {form.photos.length} photo{form.photos.length > 1 ? 's' : ''} sélectionnée{form.photos.length > 1 ? 's' : ''}
                    {form.photos.length < 5 && (
                      <span className="text-orange-500 ml-2">(minimum 5)</span>
                    )}
                    {form.photos.length >= 5 && (
                      <span className="text-green-600 ml-2">✓</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.photos.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => set('photos', form.photos.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-[#0F4C8A] text-white text-xs px-1.5 py-0.5 rounded-md">
                          Couverture
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Amenities */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quels équipements proposez-vous ?</h2>
            <p className="text-gray-500 text-sm mb-6">Sélectionnez tous les équipements disponibles dans votre logement.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-2 px-4 py-3 border-2 rounded-xl text-sm text-left transition-all ${
                    form.amenities.includes(a)
                      ? 'border-[#0F4C8A] bg-[#E8F0FB] text-[#0F4C8A] font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {form.amenities.includes(a) && <Check size={15} className="shrink-0" />}
                  {a}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {form.amenities.length} équipement{form.amenities.length !== 1 ? 's' : ''} sélectionné{form.amenities.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Step 6: Pricing */}
        {step === 6 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Définissez vos tarifs</h2>
            <p className="text-gray-500 text-sm mb-6">Fixez vos prix en Dinar Tunisien (DT). Vous pouvez les modifier à tout moment.</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix par nuit (DT) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">DT</span>
                  <input
                    type="number"
                    min="1"
                    value={form.pricePerNight}
                    onChange={(e) => set('pricePerNight', e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                </div>
                {form.pricePerNight && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vous gagnerez environ{' '}
                    <strong>{Math.round(Number(form.pricePerNight) * 0.88)} DT</strong> par nuit après
                    les frais de service DarHost (12%).
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frais de ménage (DT)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">DT</span>
                    <input
                      type="number"
                      min="0"
                      value={form.cleaningFee}
                      onChange={(e) => set('cleaningFee', e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre minimum de nuits</label>
                  <select
                    value={form.minNights}
                    onChange={(e) => set('minNights', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
                  >
                    {[1, 2, 3, 4, 5, 7, 14, 30].map((n) => (
                      <option key={n} value={n}>{n} nuit{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: House rules */}
        {step === 7 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Règles de la maison</h2>
            <p className="text-gray-500 text-sm mb-6">Définissez les règles que vos voyageurs doivent respecter.</p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heure d&apos;arrivée</label>
                  <select
                    value={form.checkIn}
                    onChange={(e) => set('checkIn', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
                  >
                    {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
                      <option key={t} value={t}>Après {t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heure de départ</label>
                  <select
                    value={form.checkOut}
                    onChange={(e) => set('checkOut', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
                  >
                    {['09:00', '10:00', '11:00', '12:00', '13:00'].map((t) => (
                      <option key={t} value={t}>Avant {t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {[
                { key: 'noSmoking', label: 'Interdit de fumer', desc: 'Pas de cigarette ni chicha à l\'intérieur' },
                { key: 'noParties', label: 'Pas de fêtes', desc: 'Pas d\'événements ou soirées non autorisés' },
                { key: 'noPets', label: 'Animaux non admis', desc: 'Les animaux de compagnie ne sont pas acceptés' },
                { key: 'noNoise', label: 'Calme après 22h', desc: 'Pas de nuisances sonores après 22h00' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <button
                    onClick={() => set(key as keyof FormData, !form[key as keyof FormData])}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      form[key as keyof FormData] ? 'bg-[#0F4C8A]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form[key as keyof FormData] ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Règles personnalisées</label>
              {form.customRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">{rule}</span>
                  <button onClick={() => removeCustomRule(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomRule()}
                  placeholder="ex: Pas de chaussures à l'intérieur"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
                <button
                  onClick={addCustomRule}
                  className="px-4 py-2.5 bg-[#0F4C8A] text-white rounded-xl hover:bg-[#0A3566] transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Bank account */}
        {step === 8 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Compte bancaire</h2>
            <p className="text-gray-500 text-sm mb-6">
              Renseignez votre compte pour recevoir vos paiements. Vos données sont chiffrées et sécurisées.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du titulaire *</label>
                <input
                  value={form.bankHolder}
                  onChange={(e) => set('bankHolder', e.target.value)}
                  placeholder="Nom et prénom exacts du titulaire"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banque *</label>
                <select
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
                >
                  <option value="">Sélectionner votre banque</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Numéro de compte / RIB *
                </label>
                <input
                  value={form.iban}
                  onChange={(e) => set('iban', e.target.value)}
                  placeholder="TN59 XXXX XXXX XXXX XXXX XXXX XX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
                <p className="text-xs text-gray-500 mt-1">Format IBAN tunisien : TN59 suivi de 20 chiffres</p>
              </div>
            </div>
            <div className="mt-5 p-4 bg-[#E8F0FB] rounded-xl text-sm text-[#0F4C8A] flex items-start gap-2">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <span>Vos informations bancaires sont chiffrées et ne sont jamais partagées avec des tiers.</span>
            </div>
          </div>
        )}

        {/* Step 9: Identity */}
        {step === 9 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vérification d&apos;identité</h2>
            <p className="text-gray-500 text-sm mb-6">
              Pour garantir la sécurité de notre communauté, nous devons vérifier votre identité.
              Vos documents sont traités de manière confidentielle.
            </p>
            <div className="space-y-5">
              {[
                { key: 'idFront', label: 'Carte d\'Identité Nationale — Recto *', desc: 'Cliquez pour télécharger le recto de votre CIN' },
                { key: 'idBack', label: 'Carte d\'Identité Nationale — Verso *', desc: 'Cliquez pour télécharger le verso de votre CIN' },
                { key: 'selfie', label: 'Selfie tenant votre CIN *', desc: 'Photo de vous tenant votre CIN à côté de votre visage' },
              ].map(({ key, label, desc }) => {
                const file = form[key as 'idFront' | 'idBack' | 'selfie'];
                return (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                    <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#0F4C8A]'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => set(key as keyof FormData, e.target.files?.[0] ?? null)}
                      />
                      {file ? (
                        <div>
                          <Check size={24} className="mx-auto text-green-500 mb-1" />
                          <p className="text-sm font-medium text-green-700">{(file as File).name}</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                          <p className="text-sm text-gray-600">{desc}</p>
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <span>La vérification d&apos;identité prend généralement <strong>24 à 48 heures</strong>. Vous serez notifié par e-mail.</span>
            </div>
          </div>
        )}

        {/* Step 10: Review */}
        {step === 10 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Récapitulatif</h2>
            <p className="text-gray-500 text-sm mb-6">Vérifiez toutes les informations avant de soumettre votre annonce.</p>

            <div className="space-y-4">
              {[
                { label: 'Type de bien', value: form.type || '—' },
                { label: 'Catégories', value: form.categories.length > 0 ? form.categories.map(c => CATEGORIES.find(cat => cat.value === c)?.label).join(', ') : '—' },
                { label: 'Localisation', value: form.wilaya && form.address ? `${form.streetNumber ? form.streetNumber + ' ' : ''}${form.streetName ? form.streetName + ', ' : ''}${form.address}, ${form.wilaya}` : '—' },
                { label: 'Capacité', value: form.guests ? `${form.guests} voyageurs, ${form.bedrooms} chambre(s), ${form.beds} lit(s), ${form.bathrooms} salle(s) de bain` : '—' },
                { label: 'Titre de l\'annonce', value: form.title || '—' },
                { label: 'Photos', value: form.photos.length > 0 ? `${form.photos.length} photo(s)` : '—' },
                { label: 'Équipements', value: form.amenities.length > 0 ? form.amenities.join(', ') : '—' },
                { label: 'Prix par nuit', value: form.pricePerNight ? `${form.pricePerNight} DT` : '—' },
                { label: 'Frais de ménage', value: form.cleaningFee ? `${form.cleaningFee} DT` : '—' },
                { label: 'Arrivée / Départ', value: `Après ${form.checkIn} — Avant ${form.checkOut}` },
                { label: 'Banque', value: form.bankName || '—' },
                { label: 'Vérification identité', value: form.idFront && form.idBack && form.selfie ? '✓ Documents fournis' : '⚠️ Documents manquants' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-semibold text-gray-600 w-44 shrink-0">{label}</span>
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#E8F0FB] rounded-xl text-sm text-[#0F4C8A]">
              <p className="font-semibold mb-1">Ce qui se passe ensuite :</p>
              <ol className="list-decimal list-inside space-y-1 text-[#1A4EA1]">
                <li>Vérification de votre identité (24–48h)</li>
                <li>Examen de votre annonce par notre équipe</li>
                <li>Publication et première réservation !</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => { setStep(Math.max(1, step - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
          Précédent
        </button>

        {step < STEPS.length ? (
          <button
            onClick={() => { setStep(Math.min(STEPS.length, step + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors"
          >
            Suivant
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors"
          >
            <Check size={18} />
            Soumettre l&apos;annonce
          </button>
        )}
      </div>
    </div>
  );
}
