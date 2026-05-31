'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Check, ArrowLeft } from 'lucide-react';
import {
  getUser,
  getSubmittedProperties,
  savePropertyRemote,
} from '@/lib/store';
import { Property, PropertyType } from '@/lib/types';

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
  });

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
    });
  }, [id, router]);

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Titre de l&apos;annonce
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={70}
            placeholder="ex: Villa avec vue mer à Sidi Bou Said"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Type de bien
          </label>
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
            rows={6}
            placeholder="Décrivez votre logement..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix / nuit (DT)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frais de ménage (DT)</label>
            <input
              type="number"
              min="0"
              value={form.cleaningFee}
              onChange={(e) => setForm((p) => ({ ...p, cleaningFee: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nuits minimum</label>
            <input
              type="number"
              min="1"
              value={form.minNights}
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
                type="number"
                min="1"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
          <div>
            <div className="font-medium text-gray-900 text-sm">Publier l&apos;annonce</div>
            <div className="text-xs text-gray-500">
              {form.available ? 'Visible sur DarHost' : 'Enregistré comme brouillon'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, available: !p.available }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              form.available ? 'bg-[#0F4C8A]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.available ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
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
