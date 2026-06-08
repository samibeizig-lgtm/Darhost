'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Plane, Car, Map, Zap, MoreHorizontal, Camera, X } from 'lucide-react';
import { getUser, addService, setUser as persistUser } from '@/lib/store';
import { Service, ServiceType } from '@/lib/types';
import { wilayasTunisie } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

const SERVICE_TYPES: { value: ServiceType; Icon: React.ElementType; desc: string }[] = [
  { value: 'transfert', Icon: Plane, desc: 'Navette aéroport, gare, etc.' },
  { value: 'voiture', Icon: Car, desc: 'Véhicule avec ou sans chauffeur' },
  { value: 'guide', Icon: Map, desc: 'Visite guidée, excursion' },
  { value: 'activite', Icon: Zap, desc: 'Sport, loisirs, expérience' },
  { value: 'autre', Icon: MoreHorizontal, desc: 'Tout autre service' },
];

const PRICE_UNITS = ['trajet','jour','heure','personne','forfait'];
const CAR_CATEGORIES = ['compacte','berline','suv','4x4','van','luxe','cabriolet','autre'];
const FUEL_TYPES = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'hybride', label: 'Hybride' },
];

const STEPS = [
  { n: 1, label: 'Type' },
  { n: 2, label: 'Infos' },
  { n: 3, label: 'Tarif' },
  { n: 4, label: 'Photos' },
  { n: 5, label: 'Récap' },
];

const EMPTY_FORM = {
  type: '' as ServiceType | '',
  title: '', description: '', location: '', wilaya: '',
  price: '', priceUnit: 'jour' as string,
  maxPersons: '', includes: '',
  carCategory: '', transmission: '' as 'manuelle' | 'automatique' | '',
  fuelType: '' as 'essence' | 'diesel' | 'electrique' | 'hybride' | '',
  doors: '' as string,
  withDriver: false as boolean,
  mileageLimit: 'Illimité' as string,
  insuranceIncluded: false as boolean,
  deposit: '' as string,
  minAge: '21' as string,
  deliveryAvailable: false as boolean,
  photos: [] as string[],
};

export default function PrestataireSubmit() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUserState] = useState(() => typeof window !== 'undefined' ? getUser() : null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login?redirect=/prestataire/submit'); return; }
    setUserState(u);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('photos', [...form.photos, reader.result as string]);
    reader.readAsDataURL(file);
  }

  function canNext() {
    if (step === 1) return !!form.type;
    if (step === 2) return !!form.title && !!form.description && !!form.location && !!form.wilaya;
    if (step === 3) return !!form.price && Number(form.price) > 0;
    return true;
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const isVoiture = form.type === 'voiture';
    const service: Service = {
      id: `svc-${Date.now()}`,
      type: form.type as ServiceType,
      title: form.title,
      description: form.description,
      images: form.photos.length > 0 ? form.photos : [`https://picsum.photos/seed/${Date.now()}/800/600`],
      price: Number(form.price),
      priceUnit: form.priceUnit as Service['priceUnit'],
      location: form.location,
      wilaya: form.wilaya,
      providerId: user.id,
      providerName: user.name,
      providerAvatar: user.avatar,
      rating: 0,
      reviewCount: 0,
      available: true,
      maxPersons: form.maxPersons ? Number(form.maxPersons) : undefined,
      includes: form.includes ? form.includes.split('\n').filter(Boolean) : undefined,
      carCategory: isVoiture && form.carCategory ? form.carCategory as Service['carCategory'] : undefined,
      transmission: isVoiture && form.transmission ? form.transmission as Service['transmission'] : undefined,
      fuelType: isVoiture && form.fuelType ? form.fuelType as Service['fuelType'] : undefined,
      doors: isVoiture && form.doors ? Number(form.doors) : undefined,
      withDriver: isVoiture ? form.withDriver : undefined,
      mileageLimit: isVoiture && form.mileageLimit ? form.mileageLimit : undefined,
      insuranceIncluded: isVoiture ? form.insuranceIncluded : undefined,
      deposit: isVoiture && form.deposit ? Number(form.deposit) : undefined,
      minAge: isVoiture && form.minAge ? Number(form.minAge) : undefined,
      deliveryAvailable: isVoiture ? form.deliveryAvailable : undefined,
      createdAt: Date.now(),
    };
    addService(service);
    if (user.role !== 'prestataire') {
      const updated = { ...user, role: 'prestataire' as const };
      persistUser(updated);
    }
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service publié !</h1>
          <p className="text-gray-500 mb-8">Votre service est maintenant visible par les voyageurs.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/prestataire/services')} className="w-full py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold">
              Voir mes services
            </button>
            <button onClick={() => { setDone(false); setStep(1); setForm({ ...EMPTY_FORM }); }} className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold">
              Ajouter un autre service
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
              step > s.n ? 'bg-[#0F4C8A] text-white' : step === s.n ? 'bg-[#0F4C8A] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s.n ? 'text-[#0F4C8A]' : 'text-gray-400'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > s.n ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {/* Step 1: Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('prestataire.submit_type')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_TYPES.map(({ value, Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => set('type', value)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    form.type === value ? 'border-[#0F4C8A] bg-[#E8F0FB]' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${form.type === value ? 'bg-[#0F4C8A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t(`service.type_${value}`)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Infos */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('prestataire.submit_info')}</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_title')} *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Ex: Renault Clio - Location à Tunis" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_desc')} *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none" placeholder="Décrivez votre véhicule en détail..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_location')} *</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Tunis, Sousse..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_wilaya')} *</label>
                <select value={form.wilaya} onChange={e => set('wilaya', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                  <option value="">Sélectionner</option>
                  {wilayasTunisie.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Price + Car details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('prestataire.submit_price')}</h2>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_price_label')} (DT) *</label>
                <input type="number" min="1" value={form.price} onChange={e => set('price', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="80" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_unit')} *</label>
                <select value={form.priceUnit} onChange={e => set('priceUnit', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{t(`service.price_unit_${u}`)}</option>)}
                </select>
              </div>
            </div>

            {/* Car rental specific fields */}
            {form.type === 'voiture' && (
              <>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Car size={15} className="text-purple-600" /> Caractéristiques du véhicule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie</label>
                      <select value={form.carCategory} onChange={e => set('carCategory', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                        <option value="">Sélectionner</option>
                        {CAR_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Transmission</label>
                      <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                        <option value="">Non spécifiée</option>
                        <option value="manuelle">Manuelle</option>
                        <option value="automatique">Automatique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Carburant</label>
                      <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                        <option value="">Non spécifié</option>
                        {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre de portes</label>
                      <select value={form.doors} onChange={e => set('doors', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                        <option value="">Non spécifié</option>
                        <option value="2">2 portes</option>
                        <option value="3">3 portes</option>
                        <option value="4">4 portes</option>
                        <option value="5">5 portes</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre de passagers max</label>
                    <input type="number" min="1" max="9" value={form.maxPersons} onChange={e => set('maxPersons', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="5" />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-700 mb-3">Conditions de location</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kilométrage inclus</label>
                      <input value={form.mileageLimit} onChange={e => set('mileageLimit', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Illimité ou 200 km/jour" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Caution (DT)</label>
                      <input type="number" min="0" value={form.deposit} onChange={e => set('deposit', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Âge minimum du conducteur</label>
                      <input type="number" min="18" max="30" value={form.minAge} onChange={e => set('minAge', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="21" />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => set('withDriver', !form.withDriver)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.withDriver ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.withDriver ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Avec chauffeur disponible</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => set('insuranceIncluded', !form.insuranceIncluded)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.insuranceIncluded ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.insuranceIncluded ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Assurance tous risques incluse</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => set('deliveryAvailable', !form.deliveryAvailable)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.deliveryAvailable ? 'bg-[#0F4C8A]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.deliveryAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">Livraison à domicile possible</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Non-voiture capacity */}
            {form.type !== 'voiture' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_max_persons')}</label>
                <input type="number" min="1" value={form.maxPersons} onChange={e => set('maxPersons', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="8" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('prestataire.submit_includes')}</label>
              <textarea value={form.includes} onChange={e => set('includes', e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none" placeholder={form.type === 'voiture' ? "GPS\nClimatisation\nSiège enfant" : "Eau minérale\nClimatisation\nWi-Fi à bord"} />
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('prestataire.submit_photos')}</h2>
            <div className="grid grid-cols-3 gap-3">
              {form.photos.map((photo, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => set('photos', form.photos.filter((_,j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {form.photos.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#0F4C8A] transition-colors">
                  <Camera size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Ajouter</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">Si vous ne téléchargez pas de photo, une image générique sera utilisée.</p>
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('prestataire.submit_recap')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold">{form.type ? t(`service.type_${form.type}`) : ''}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Titre</span>
                <span className="font-semibold text-right max-w-[60%]">{form.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Localisation</span>
                <span className="font-semibold">{form.location}, {form.wilaya}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Prix</span>
                <span className="font-semibold text-[#0F4C8A]">{form.price} DT {t(`service.price_unit_${form.priceUnit}`)}</span>
              </div>
              {form.type === 'voiture' && (
                <>
                  {form.carCategory && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Catégorie</span>
                      <span className="font-semibold capitalize">{form.carCategory}</span>
                    </div>
                  )}
                  {form.transmission && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Transmission</span>
                      <span className="font-semibold capitalize">{form.transmission}</span>
                    </div>
                  )}
                  {form.fuelType && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Carburant</span>
                      <span className="font-semibold capitalize">{form.fuelType}</span>
                    </div>
                  )}
                  {form.deposit && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Caution</span>
                      <span className="font-semibold">{form.deposit} DT</span>
                    </div>
                  )}
                  {form.mileageLimit && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Kilométrage</span>
                      <span className="font-semibold">{form.mileageLimit}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Avec chauffeur</span>
                    <span className="font-semibold">{form.withDriver ? 'Oui' : 'Non'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Assurance incluse</span>
                    <span className="font-semibold">{form.insuranceIncluded ? 'Oui' : 'Non'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Livraison</span>
                    <span className="font-semibold">{form.deliveryAvailable ? 'Disponible' : 'Non'}</span>
                  </div>
                </>
              )}
              {form.maxPersons && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Capacité max</span>
                  <span className="font-semibold">{form.maxPersons} pers.</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Photos</span>
                <span className="font-semibold">{form.photos.length > 0 ? `${form.photos.length} photo(s)` : 'Générique'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} /> Retour
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0A3566] transition-colors"
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-[#0A3566] transition-colors"
          >
            {submitting ? 'Publication...' : t('prestataire.submit_btn')}
          </button>
        )}
      </div>
    </div>
  );
}
