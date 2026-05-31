'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Check, ArrowLeft, Plus, X } from 'lucide-react';
import {
  getUser,
  getSubmittedProperties,
  savePropertyRemote,
} from '@/lib/store';
import { Property, PropertyType } from '@/lib/types';
import { AMENITY_CATEGORIES } from '@/lib/amenities';

const PROPERTY_TYPES: PropertyType[] = ['Villa', 'Appartement', 'Riad', 'Maison', 'Chambre'];

function updateSubmittedProperty(updated: Property): void {
  const all = getSubmittedProperties();
  const idx = all.findIndex((p) => p.id === updated.id);
  if (idx === -1) return;
  const next = [...all];
  next[idx] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem('darhost_submitted_properties', JSON.stringify(next));
  }
}

function EditListingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'Maison' as PropertyType,
    description: '',
    price: '',
    cleaningFee: '',
    minNights: '',
    guests: '',
    bedrooms: '',
    bathrooms: '',
    beds: '',
    available: true,
    amenities: [] as string[],
    checkIn: '15:00',
    checkOut: '11:00',
    noSmoking: true,
    noParties: true,
    noPets: false,
    noNoise: true,
    customRules: [] as string[],
  });
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/listings'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    if (!id) { setNotFound(true); return; }

    const all = getSubmittedProperties();
    const found = all.find((p) => p.id === id);
    if (!found) { setNotFound(true); return; }

    setProperty(found);
    setForm({
      title: found.title,
      type: found.type,
      description: found.description,
      price: String(found.price),
      cleaningFee: String(found.cleaningFee),
      minNights: String(found.minNights),
      guests: String(found.guests),
      bedrooms: String(found.bedrooms),
      bathrooms: String(found.bathrooms),
      beds: String(found.beds),
      available: found.available,
      amenities: found.amenities ?? [],
      checkIn: found.houseRules?.find(r => r.title === 'Arrivée')?.description?.replace('Après ', '') ?? '15:00',
      checkOut: found.houseRules?.find(r => r.title === 'Départ')?.description?.replace('Avant ', '') ?? '11:00',
      noSmoking: !!found.houseRules?.some(r => r.title === 'Pas de cigarette'),
      noParties: !!found.houseRules?.some(r => r.title === 'Pas de fêtes'),
      noPets: !!found.houseRules?.some(r => r.title === 'Animaux non admis'),
      noNoise: !!found.houseRules?.some(r => r.title === 'Calme nocturne'),
      customRules: found.houseRules?.filter(r => !['Arrivée','Départ','Pas de cigarette','Pas de fêtes','Animaux non admis','Calme nocturne'].includes(r.title)).map(r => r.title) ?? [],
    });
  }, [id, router]);

  function addCustomRule() {
    if (newRule.trim()) {
      setForm(p => ({ ...p, customRules: [...p.customRules, newRule.trim()] }));
      setNewRule('');
    }
  }

  function toggleAmenity(amenityId: string) {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  }

  async function handleSave() {
    if (!property) return;
    setSaving(true);

    const updated: Property = {
      ...property,
      title: form.title,
      type: form.type,
      description: form.description,
      shortDescription: form.description.slice(0, 100) + '…',
      price: Number(form.price) || 0,
      cleaningFee: Number(form.cleaningFee) || 0,
      minNights: Number(form.minNights) || 1,
      guests: Number(form.guests) || 1,
      bedrooms: Number(form.bedrooms) || 1,
      bathrooms: Number(form.bathrooms) || 1,
      beds: Number(form.beds) || 1,
      available: form.available,
      isDraft: !form.available,
      amenities: form.amenities,
      houseRules: [
        { title: 'Arrivée', description: `Après ${form.checkIn}` },
        { title: 'Départ', description: `Avant ${form.checkOut}` },
        ...(form.noSmoking ? [{ title: 'Pas de cigarette', description: 'Interdit de fumer' }] : []),
        ...(form.noParties ? [{ title: 'Pas de fêtes', description: "Pas d'événements" }] : []),
        ...(form.noPets ? [{ title: 'Animaux non admis', description: "Pas d'animaux" }] : []),
        ...(form.noNoise ? [{ title: 'Calme nocturne', description: 'Silence après 22h' }] : []),
        ...form.customRules.map(r => ({ title: r, description: '' })),
      ],
    };

    updateSubmittedProperty(updated);
    await savePropertyRemote(updated);

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push('/host/listings');
    }, 1200);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Annonce introuvable</h1>
          <p className="text-gray-500 mb-6">Cette annonce n&apos;existe pas ou a été supprimée.</p>
          <button
            onClick={() => router.push('/host/listings')}
            className="px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors"
          >
            Retour aux annonces
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/host/listings')}
          className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;annonce</h1>
          <p className="text-sm text-gray-500 mt-0.5">{property.title}</p>
        </div>
      </div>

      <div className="space-y-4">

        {/* General info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Informations générales</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre de l&apos;annonce</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={70}
              placeholder="ex: Villa avec vue mer à Sidi Bou Said"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de bien</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PropertyType }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
              <span className="text-gray-400 font-normal ml-2">({form.description.length}/1000)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={1000}
              rows={5}
              placeholder="Décrivez votre logement..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
            />
          </div>
        </div>

        {/* Pricing & capacity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tarifs & Capacité</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix / nuit (DT)</label>
              <input type="number" min="0" value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frais de ménage (DT)</label>
              <input type="number" min="0" value={form.cleaningFee}
                onChange={(e) => setForm((p) => ({ ...p, cleaningFee: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nuits minimum</label>
              <input type="number" min="1" value={form.minNights}
                onChange={(e) => setForm((p) => ({ ...p, minNights: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'guests', label: 'Voyageurs' },
              { key: 'bedrooms', label: 'Chambres' },
              { key: 'bathrooms', label: 'Salles de bain' },
              { key: 'beds', label: 'Lits' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type="number" min="1"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Équipements</h2>
            <span className="text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2.5 py-1 rounded-full">
              {form.amenities.length} sélectionné{form.amenities.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-5">
            {AMENITY_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{cat.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item) => {
                    const selected = form.amenities.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl text-sm text-left transition-all ${
                          selected
                            ? 'border-[#0F4C8A] bg-[#E8F0FB] text-[#0F4C8A] font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl leading-none w-7 text-center grayscale">{item.emoji}</span>
                        <span className="flex-1 leading-tight">{item.label}</span>
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'bg-[#0F4C8A] border-[#0F4C8A]' : 'border-gray-300'
                        }`}>
                          {selected && <Check size={12} className="text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* House Rules */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Règles de la maison</h2>

          {/* Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Arrivée (après)</label>
              <select
                value={form.checkIn}
                onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              >
                {['12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Départ (avant)</label>
              <select
                value={form.checkOut}
                onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              >
                {['08:00','09:00','10:00','11:00','12:00','13:00'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {([
              { key: 'noSmoking', label: 'Non fumeur', emoji: '🚭' },
              { key: 'noParties', label: 'Pas de fêtes', emoji: '🎉' },
              { key: 'noPets', label: 'Animaux non admis', emoji: '🐾' },
              { key: 'noNoise', label: 'Calme nocturne (après 22h)', emoji: '🌙' },
            ] as const).map(({ key, label, emoji }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <span className="grayscale">{emoji}</span>
                  {label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form[key]}
                  onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form[key] ? 'bg-[#0F4C8A]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Custom rules */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Règles personnalisées</label>
            {form.customRules.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.customRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-700">
                    <span className="flex-1">{rule}</span>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, customRules: p.customRules.filter((_, i) => i !== idx) }))}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomRule())}
                placeholder="ex: Pas de chaussures à l'intérieur"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
              <button
                type="button"
                onClick={addCustomRule}
                disabled={!newRule.trim()}
                className="px-4 py-2.5 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <Plus size={15} />
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-sm">Publier l&apos;annonce</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {form.available ? 'Visible sur Hostn' : 'Enregistré comme brouillon'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, available: !p.available }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.available ? 'bg-[#0F4C8A]' : 'bg-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.available ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#0F4C8A] text-white rounded-2xl font-bold hover:bg-[#0A3566] disabled:opacity-60 transition-colors text-sm"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Save size={18} />
          )}
          {saving ? 'Enregistrement...' : saved ? 'Modifications enregistrées !' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense>
      <EditListingInner />
    </Suspense>
  );
}
