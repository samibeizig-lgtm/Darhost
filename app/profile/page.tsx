'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Camera, MapPin, Save, Check, Plus, ShieldCheck, Building2, Upload, AlertCircle, Trash2 } from 'lucide-react';
import {
  getUser, setUser as persistUser,
  getProfileData, setProfileData,
  getHostBank, setHostBank,
  getIdentityStatus, setIdentityStatus, submitIdentityForReview,
  clearAllRemoteData,
  getAccounts, saveAccount, isRemoteConnected,
  IdentityStatus,
  StoredUser,
} from '@/lib/store';
import { TUNISIAN_BANKS, validateRib, formatRibDisplay } from '@/lib/banks';

const HOBBIES_LIST = [
  'Voyages', 'Cuisine', 'Sport', 'Lecture', 'Musique', 'Cinéma',
  'Randonnée', 'Plongée', 'Photographie', 'Architecture', 'Histoire',
  'Nature', 'Surf', 'Yoga', 'Gastronomie', 'Art',
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

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

  const [bankForm, setBankForm] = useState({ bankHolder: '', bankName: '', rib: '' });
  const [ribError, setRibError] = useState('');
  const [bankSaved, setBankSaved] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);

  const [idStatus, setIdStatus] = useState<IdentityStatus>('none');
  const [idFront, setIdFront] = useState('');
  const [idBack, setIdBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idSubmitted, setIdSubmitted] = useState(false);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

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

    const bank = getHostBank();
    setBankForm({ bankHolder: bank.bankHolder, bankName: bank.bankName, rib: bank.rib });
    setIdStatus(getIdentityStatus());

    // Auto-sync account to Firebase silently (covers accounts created before the fix)
    if (isRemoteConnected()) {
      const account = getAccounts()[u.email.toLowerCase()];
      if (account) saveAccount(account);
    }
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

  function handleRibChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 20);
    setBankForm(p => ({ ...p, rib: digits }));
    if (digits.length === 20 && bankForm.bankName) {
      const bank = TUNISIAN_BANKS.find(b => b.name === bankForm.bankName);
      setRibError(bank ? (validateRib(digits, bank.code) ?? '') : '');
    } else {
      setRibError('');
    }
  }

  function handleBankNameChange(name: string) {
    setBankForm(p => ({ ...p, bankName: name }));
    if (bankForm.rib.length === 20 && name) {
      const bank = TUNISIAN_BANKS.find(b => b.name === name);
      setRibError(bank ? (validateRib(bankForm.rib, bank.code) ?? '') : '');
    } else {
      setRibError('');
    }
  }

  function handleBankSave() {
    if (!bankForm.bankName) { setRibError('Choisissez votre banque avant'); return; }
    const bank = TUNISIAN_BANKS.find(b => b.name === bankForm.bankName);
    const err = bank ? validateRib(bankForm.rib, bank.code) : 'Banque introuvable';
    if (err) { setRibError(err); return; }
    setBankSaving(true);
    setHostBank(bankForm);
    setTimeout(() => { setBankSaving(false); setBankSaved(true); setTimeout(() => setBankSaved(false), 2500); }, 500);
  }

  function loadDoc(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    };
  }

  async function handleVerifyIdentity() {
    if (!idFront || !idBack || !selfie || !user) return;
    setIdSubmitting(true);
    setIdentityStatus('verified');
    setIdStatus('verified');
    await submitIdentityForReview(user.id, user.name);
    setIdSubmitting(false);
    setIdSubmitted(true);
    setTimeout(() => setIdSubmitted(false), 4000);
  }

  if (!user) return null;

  const avgRating = MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-10">

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-[#E8F0FB]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#0F4C8A] ring-4 ring-[#E8F0FB] flex items-center justify-center text-white text-4xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0F4C8A] text-white rounded-full flex items-center justify-center hover:bg-[#0A3566] transition-colors cursor-pointer shadow-sm">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

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

      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-red-700">Réinitialisation des données</p>
          <p className="text-xs text-red-500 mt-0.5">Efface tous les comptes, annonces et réservations</p>
        </div>
        <button
          onClick={async () => {
            if (!confirm('Effacer toutes les données ? Cette action est irréversible.')) return;
            ['darhost_user','darhost_accounts','darhost_profile','darhost_host_bank','darhost_identity_status','darhost_identity_verified','darhost_submitted_properties','darhost_bookings']
              .forEach(k => localStorage.removeItem(k));
            Object.keys(localStorage)
              .filter(k => k.startsWith('darhost_settings_') || k.startsWith('darhost_calendar_'))
              .forEach(k => localStorage.removeItem(k));
            await clearAllRemoteData();
            window.location.href = '/';
          }}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
        >
          <Trash2 size={14} />
          Tout effacer
        </button>
      </div>

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
      {user.role === 'host' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mt-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E8F0FB] rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-[#0F4C8A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paramètres de versement</h2>
              <p className="text-xs text-gray-500">Coordonnées bancaires pour recevoir vos revenus</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titulaire du compte</label>
              <input
                value={bankForm.bankHolder}
                onChange={e => setBankForm(p => ({ ...p, bankHolder: e.target.value }))}
                placeholder="Prénom et Nom du titulaire"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banque</label>
              <select
                value={bankForm.bankName}
                onChange={e => handleBankNameChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              >
                <option value="">Sélectionnez votre banque</option>
                {TUNISIAN_BANKS.map(b => (
                  <option key={b.code} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                RIB bancaire
                <span className="text-gray-400 font-normal ml-2 text-xs">20 chiffres</span>
              </label>
              <input
                value={formatRibDisplay(bankForm.rib)}
                onChange={e => handleRibChange(e.target.value)}
                placeholder="BB GGG AAAAAAAAAAAAA CC"
                maxLength={24}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] font-mono ${
                  ribError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {ribError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
                  <AlertCircle size={13} />
                  {ribError}
                </div>
              )}
              {!ribError && bankForm.rib.length === 20 && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
                  <Check size={13} />
                  RIB valide
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleBankSave}
              disabled={bankSaving}
              className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] disabled:opacity-60 transition-colors"
            >
              {bankSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : bankSaved ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {bankSaving ? 'Enregistrement...' : bankSaved ? 'Coordonnées enregistrées !' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {user.role === 'host' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mt-6 mb-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              idStatus === 'verified' ? 'bg-green-100' : idStatus === 'pending' ? 'bg-amber-50' : 'bg-gray-100'
            }`}>
              <ShieldCheck size={20} className={
                idStatus === 'verified' ? 'text-green-600' : idStatus === 'pending' ? 'text-amber-500' : 'text-gray-400'
              } />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vérification d&apos;identité</h2>
              <p className={`text-xs font-semibold mt-0.5 ${
                idStatus === 'verified' ? 'text-green-600' : idStatus === 'pending' ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {idStatus === 'verified' && 'Identité vérifiée'}
                {idStatus === 'pending' && 'En cours de vérification'}
                {idStatus === 'none' && 'Non vérifiée — requis pour publier une annonce'}
              </p>
            </div>
          </div>

          {idStatus === 'verified' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <ShieldCheck size={18} className="shrink-0" />
              Votre identité a été vérifiée avec succès. Vous pouvez publier des annonces.
            </div>
          )}

          {idStatus === 'pending' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Vos documents sont en cours d&apos;examen</p>
                  <p className="text-xs mt-0.5 text-amber-700">
                    Un administrateur validera votre identité dans un délai maximum de <strong>48 heures</strong>.
                    Vous recevrez une confirmation dès que votre dossier sera traité.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 px-1">
                Soumis le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {idStatus === 'none' && (
            <>
              <p className="text-sm text-gray-600 mb-5">
                Téléversez les 3 documents suivants. Un administrateur vérifiera votre identité sous 48h.
              </p>
              <div className="space-y-4">
                {([
                  { label: 'CIN recto', state: idFront, ref: idFrontRef, set: setIdFront },
                  { label: 'CIN verso', state: idBack, ref: idBackRef, set: setIdBack },
                  { label: 'Selfie avec CIN', state: selfie, ref: selfieRef, set: setSelfie },
                ] as const).map(({ label, state, ref, set }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        state ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}>
                        {state ? <Check size={14} className="text-green-600" /> : <Upload size={13} className="text-gray-400" />}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => ref.current?.click()}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        state
                          ? 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {state ? 'Modifier' : 'Téléverser'}
                    </button>
                    <input ref={ref} type="file" accept="image/*" className="hidden" onChange={loadDoc(set)} />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleVerifyIdentity}
                  disabled={!idFront || !idBack || !selfie || idSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] disabled:opacity-40 transition-colors"
                >
                  {idSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : idSubmitted ? (
                    <Check size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  {idSubmitting ? 'Envoi en cours...' : idSubmitted ? 'Dossier envoyé !' : 'Soumettre pour vérification'}
                </button>
                {(!idFront || !idBack || !selfie) && (
                  <p className="text-xs text-gray-400 mt-2">Téléversez les 3 documents pour continuer</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
