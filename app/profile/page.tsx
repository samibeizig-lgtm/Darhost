'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Camera, MapPin, Save, Check, Calendar, Plus } from 'lucide-react';
import { properties as mockProperties } from '@/lib/data';
import {
  getUser, setUser as persistUser,
  getProfileData, setProfileData,
  syncPropertiesFromRemote,
  pushLocalPropertiesToRemote,
  generateShareLink,
  StoredUser,
} from '@/lib/store';
import { Property } from '@/lib/types';

const HOBBIES_LIST = [
  'Voyages', 'Cuisine', 'Sport', 'Lecture', 'Musique', 'Cinéma',
  'Randonnée', 'Plongée', 'Photographie', 'Architecture', 'Histoire',
  'Nature', 'Surf', 'Yoga', 'Gastronomie', 'Art',
];

const MOCK_BOOKINGS = [
  {
    id: 'b1', property: mockProperties[0],
    checkIn: '15 Juin 2024', checkOut: '20 Juin 2024',
    nights: 5, total: 2330, status: 'Confirmée', statusColor: 'green',
  },
  {
    id: 'b2', property: mockProperties[2],
    checkIn: '1 Août 2024', checkOut: '8 Août 2024',
    nights: 7, total: 4160, status: 'En attente', statusColor: 'yellow',
  },
  {
    id: 'b3', property: mockProperties[6],
    checkIn: '10 Novembre 2024', checkOut: '14 Novembre 2024',
    nights: 4, total: 1085, status: 'Passée', statusColor: 'gray',
  },
];

const MOCK_REVIEWS = [
  {
    id: 'rv1', from: 'Yasmine Ben Ali',
    avatar: 'https://i.pravatar.cc/150?img=47',
    date: 'Mai 2024', rating: 5,
    comment: 'Voyageur exemplaire ! Très respectueux et communicatif. Logement rendu impeccable.',
    property: 'Villa Blanche de Sidi Bou Said',
  },
  {
    id: 'rv2', from: 'Sonia Trabelsi',
    avatar: 'https://i.pravatar.cc/150?img=49',
    date: 'Novembre 2023', rating: 5,
    comment: 'Excellent voyageur, la maison était impeccable à son départ. Bienvenue à tout moment !',
    property: 'Maison Tozeur Oasis',
  },
];

type Tab = 'profile' | 'properties' | 'reservations';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '' as '' | 'homme' | 'femme',
    bio: '',
  });
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/profile'); return; }
    setUserState(u);
    setAvatarPreview(u.avatar);

    const p = getProfileData();
    const parts = u.name.trim().split(' ');
    setForm({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      phone: p.phone,
      address: p.address,
      birthDate: p.birthDate,
      gender: p.gender,
      bio: p.bio,
    });
    setSelectedHobbies(
      p.hobbies ? p.hobbies.split(',').map((h) => h.trim()).filter(Boolean) : []
    );
    syncPropertiesFromRemote().then(setMyProperties);
  }, [router]);

  function toggleHobby(hobby: string) {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!user) return;
    setSaving(true);
    const newName = `${form.firstName} ${form.lastName}`.trim() || user.name;
    const updated = { ...user, name: newName, avatar: avatarPreview };
    persistUser(updated);
    setUserState(updated);
    setProfileData({
      phone: form.phone,
      address: form.address,
      birthDate: form.birthDate,
      gender: form.gender,
      hobbies: selectedHobbies.join(', '),
      bio: form.bio,
    });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 600);
  }

  if (!user) return null;

  const avgRating = MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Profile card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={avatarPreview}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#E8F0FB]"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0F4C8A] text-white rounded-full flex items-center justify-center hover:bg-[#0A3566] transition-colors cursor-pointer shadow-sm">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
              {form.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {form.address}
                </span>
              )}
              <span className="capitalize bg-[#E8F0FB] text-[#0F4C8A] text-xs font-semibold px-2.5 py-1 rounded-full">
                {user.role === 'host' ? 'Hôte' : 'Voyageur'}
              </span>
            </div>
            {form.bio && (
              <p className="text-gray-600 text-sm mt-2 max-w-xl leading-relaxed">{form.bio}</p>
            )}
            {selectedHobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedHobbies.map((h) => (
                  <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-3 bg-gray-50 rounded-xl min-w-[72px]">
              <div className="text-xl font-bold text-[#0F4C8A]">{avgRating.toFixed(1)}</div>
              <div className="flex items-center gap-0.5 justify-center mt-0.5">
                <Star size={11} className="fill-[#0F4C8A] text-[#0F4C8A]" />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Note</div>
            </div>
            <div className="text-center px-4 py-3 bg-gray-50 rounded-xl min-w-[72px]">
              <div className="text-xl font-bold text-[#0F4C8A]">{MOCK_REVIEWS.length}</div>
              <div className="text-xs text-gray-500 mt-1">Avis</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([
          { key: 'profile', label: 'Mon profil' },
          { key: 'properties', label: 'Mes logements' },
          { key: 'reservations', label: 'Mes réservations' },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-[#0F4C8A] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Mon profil ── */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Informations personnelles</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
              <input
                value={user.email}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+216 XX XXX XXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date de naissance</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Genre</label>
              <div className="flex gap-6 mt-1">
                {(['homme', 'femme'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => setForm((p) => ({ ...p, gender: g }))}
                      className="w-4 h-4 accent-[#0F4C8A]"
                    />
                    <span className="text-sm text-gray-700">{g === 'homme' ? 'Homme' : 'Femme'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse / Ville</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="ex: Tunis, Tunisie"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
          </div>

          {/* Hobbies */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Loisirs &amp; centres d&apos;intérêt
            </label>
            <div className="flex flex-wrap gap-2">
              {HOBBIES_LIST.map((hobby) => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => toggleHobby(hobby)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedHobbies.includes(hobby)
                      ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-500'
                  }`}
                >
                  {!selectedHobbies.includes(hobby) && <Plus size={12} />}
                  {hobby}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Présentation
              <span className="text-gray-400 font-normal ml-2">({form.bio.length}/300)</span>
            </label>
            <textarea
              value={form.bio}
              maxLength={300}
              rows={4}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Parlez un peu de vous, de vos passions et de ce que vous aimez découvrir en voyageant..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer les modifications'}
            </button>
          </div>

          {/* Avis reçus */}
          {MOCK_REVIEWS.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Avis reçus ({MOCK_REVIEWS.length})
              </h3>
              <div className="space-y-4">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <img
                      src={review.avatar}
                      alt={review.from}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">{review.from}</span>
                          <span className="text-xs text-gray-400 ml-2">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < review.rating
                                  ? 'fill-[#0F4C8A] text-[#0F4C8A]'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Pour : <span className="text-[#0F4C8A]">{review.property}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Mes logements ── */}
      {activeTab === 'properties' && (
        <div>
          {myProperties.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{myProperties.length} logement{myProperties.length !== 1 ? 's' : ''}</p>
              <button
                onClick={async () => {
                  setSyncing(true);
                  setSyncMsg('');
                  const count = await pushLocalPropertiesToRemote();
                  setSyncing(false);
                  setSyncMsg(count > 0 ? `${count} annonce${count !== 1 ? 's' : ''} synchronisée${count !== 1 ? 's' : ''} !` : 'Déjà à jour.');
                  setTimeout(() => setSyncMsg(''), 3000);
                  syncPropertiesFromRemote().then(setMyProperties);
                }}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0F4C8A] border border-[#0F4C8A] rounded-full hover:bg-[#E8F0FB] disabled:opacity-50 transition-colors"
              >
                {syncing ? <div className="w-3.5 h-3.5 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" /> : null}
                {syncing ? 'Synchronisation...' : 'Synchroniser sur tous les appareils'}
              </button>
            </div>
          )}
          {syncMsg && (
            <p className="text-sm text-green-600 font-medium mb-3">{syncMsg}</p>
          )}
          {myProperties.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#E8F0FB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-[#0F4C8A]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun logement publié</h3>
              <p className="text-gray-500 text-sm">
                Publiez votre premier logement pour commencer à recevoir des réservations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {myProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
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
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star size={13} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                        <span className="font-semibold text-gray-900">
                          {property.rating > 0 ? property.rating : '—'}
                        </span>
                        <span>({property.reviewCount} avis)</span>
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
                      <button
                        onClick={() => {
                          const link = generateShareLink(property);
                          navigator.clipboard.writeText(link);
                          setCopiedId(property.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="flex-1 py-2 bg-[#0F4C8A] text-white rounded-xl text-sm font-medium hover:bg-[#0A3566] transition-colors"
                      >
                        {copiedId === property.id ? '✓ Copié !' : 'Partager'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Mes réservations ── */}
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
    </div>
  );
}
