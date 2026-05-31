'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Check, ArrowLeft, Plus, X, Star, Upload, GripVertical, Image } from 'lucide-react';
import {
  getUser,
  getSubmittedProperties,
  savePropertyRemote,
} from '@/lib/store';
import { Property, PropertyType } from '@/lib/types';
import { AMENITY_CATEGORIES } from '@/lib/amenities';

const PROPERTY_TYPES: PropertyType[] = ['Villa', 'Appartement', 'Riad', 'Maison', 'Chambre'];

const TABS = [
  { id: 'info',      label: 'Infos' },
  { id: 'pricing',   label: 'Tarif' },
  { id: 'amenities', label: 'Équip.' },
  { id: 'photos',    label: 'Photos' },
  { id: 'rules',     label: 'Règles' },
] as const;

type TabId = typeof TABS[number]['id'];

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

async function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function EditListingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [uploading, setUploading] = useState(false);

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const draggingRef = useRef<number | null>(null);
  const overRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/listings'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    if (!id) { setNotFound(true); return; }

    const all = getSubmittedProperties();
    const found = all.find((p) => p.id === id && p.host?.id === user.id);
    if (!found) { setNotFound(true); return; }

    setProperty(found);
    setPhotos(found.images ?? []);
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

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const compressed = await Promise.all(files.map(compressPhoto));
    setPhotos(prev => [...prev, ...compressed]);
    setUploading(false);
    e.target.value = '';
  }

  function deletePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  function setCover(idx: number) {
    if (idx === 0) return;
    setPhotos(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  function startDrag(e: React.MouseEvent | React.TouchEvent, idx: number) {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    draggingRef.current = idx;
    overRef.current = idx;
    setDraggingIdx(idx);
    setOverIdx(idx);
  }

  useEffect(() => {
    if (draggingIdx === null) return;

    function onMove(e: MouseEvent | TouchEvent) {
      if ('touches' in e) e.preventDefault();
      const point = ('touches' in e ? (e as TouchEvent).touches[0] : e) as { clientX: number; clientY: number };
      const el = document.elementFromPoint(point.clientX, point.clientY);
      const card = el?.closest('[data-photo-idx]');
      if (card) {
        const i = Number(card.getAttribute('data-photo-idx'));
        overRef.current = i;
        setOverIdx(i);
      }
    }

    function onUp() {
      const from = draggingRef.current;
      const to = overRef.current;
      if (from !== null && to !== null && from !== to) {
        setPhotos(prev => {
          const next = [...prev];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return next;
        });
      }
      draggingRef.current = null;
      overRef.current = null;
      setDraggingIdx(null);
      setOverIdx(null);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [draggingIdx]);

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
      images: photos,
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
          <button onClick={() => router.push('/host/listings')} className="px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors">
            Retour aux annonces
          </button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push('/host/listings')} className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{property.title}</p>
            <p className="text-xs text-gray-500">Modifier l&apos;annonce</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#0F4C8A] text-white rounded-full font-semibold text-sm hover:bg-[#0A3566] disabled:opacity-60 transition-colors"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
            {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>

        <div className="px-4 pb-3 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-5 bg-gray-100 rounded-2xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 text-[11px] font-semibold rounded-xl transition-all leading-tight text-center ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0F4C8A] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-5">

        {activeTab === 'info' && (
          <div className="space-y-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre de l&apos;annonce</label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                maxLength={70}
                placeholder="ex: Villa avec vue mer à Sidi Bou Said"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/70</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de bien</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as PropertyType }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              >
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
                <span className="text-gray-400 font-normal ml-2">({form.description.length}/1000)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                maxLength={1000}
                rows={6}
                placeholder="Décrivez votre logement..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <div className="font-semibold text-gray-900 text-sm">Publier l&apos;annonce</div>
                <div className="text-xs text-gray-500 mt-0.5">{form.available ? 'Visible sur Hostn' : 'Brouillon'}</div>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, available: !p.available }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${form.available ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ${form.available ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'price', label: 'Prix / nuit', suffix: 'DT' },
                { key: 'cleaningFee', label: 'Frais de ménage', suffix: 'DT' },
                { key: 'minNights', label: 'Nuits minimum', suffix: 'nuits' },
              ].map(({ key, label, suffix }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type="number" min="0"
                      value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{suffix}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Capacité</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'guests', label: 'Voyageurs' },
                  { key: 'bedrooms', label: 'Chambres' },
                  { key: 'bathrooms', label: 'Salles de bain' },
                  { key: 'beds', label: 'Lits' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, [key]: String(Math.max(1, Number(p[key as keyof typeof p]) - 1)) }))}
                        className="px-3 py-3 text-gray-500 hover:bg-gray-100 transition-colors font-bold"
                      >−</button>
                      <span className="flex-1 text-center text-sm font-semibold text-gray-900">
                        {form[key as keyof typeof form] as string}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, [key]: String(Number(p[key as keyof typeof p]) + 1) }))}
                        className="px-3 py-3 text-gray-500 hover:bg-gray-100 transition-colors font-bold"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">Équipements</h2>
              <span className="text-xs font-semibold bg-[#E8F0FB] text-[#0F4C8A] px-2.5 py-1 rounded-full">
                {form.amenities.length} sélectionné{form.amenities.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-5">
              {AMENITY_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">{cat.label}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map(item => {
                      const selected = form.amenities.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleAmenity(item.id)}
                          className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl text-sm text-left transition-all ${
                            selected ? 'border-[#0F4C8A] bg-[#E8F0FB] text-[#0F4C8A] font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl leading-none w-7 text-center emoji-blue">{item.emoji}</span>
                          <span className="flex-1 leading-tight">{item.label}</span>
                          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'bg-[#0F4C8A] border-[#0F4C8A]' : 'border-gray-300'}`}>
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
        )}

        {activeTab === 'photos' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Photos</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} · Glissez pour réordonner
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3566] disabled:opacity-60 transition-colors"
              >
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={15} />}
                Ajouter
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
            </div>

            {photos.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#0F4C8A] hover:bg-[#F5F8FF] transition-colors">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image size={36} className="text-gray-300" />
                <div className="text-center">
                  <p className="font-semibold text-gray-600 text-sm">Aucune photo</p>
                  <p className="text-xs text-gray-400 mt-0.5">Cliquez pour ajouter des photos</p>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((src, idx) => (
                  <div
                    key={idx}
                    data-photo-idx={idx}
                    onMouseDown={e => startDrag(e, idx)}
                    onTouchStart={e => startDrag(e, idx)}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all select-none ${
                      draggingIdx === idx
                        ? 'opacity-40 border-gray-300 scale-95'
                        : overIdx === idx && draggingIdx !== null
                        ? 'border-[#0F4C8A] scale-[1.02] shadow-lg'
                        : 'border-transparent hover:border-[#0F4C8A]'
                    } ${draggingIdx !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                    {idx === 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        <Star size={10} className="fill-white" />
                        Couverture
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setCover(idx)}
                          title="Définir comme couverture"
                          className="w-7 h-7 bg-amber-400 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow transition-colors"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePhoto(idx)}
                        className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        <GripVertical size={11} />
                        Déplacer
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length > 0 && (
              <p className="text-xs text-gray-400 text-center">
                Glissez les photos pour les réordonner · ☆ pour définir la couverture · ✕ pour supprimer
              </p>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
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

            <div className="space-y-1">
              {([
                { key: 'noSmoking', label: 'Non fumeur', emoji: '🚭' },
                { key: 'noParties', label: 'Pas de fêtes', emoji: '🎉' },
                { key: 'noPets', label: 'Animaux non admis', emoji: '🐾' },
                { key: 'noNoise', label: 'Calme nocturne (après 22h)', emoji: '🌙' },
              ] as const).map(({ key, label, emoji }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-gray-800">
                    <span className="emoji-blue text-base">{emoji}</span>
                    {label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form[key]}
                    onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${form[key] ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Règles personnalisées</label>
              {form.customRules.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.customRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-700">
                      <span className="flex-1">{rule}</span>
                      <button type="button" onClick={() => setForm(p => ({ ...p, customRules: p.customRules.filter((_, i) => i !== idx) }))} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
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
        )}

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
