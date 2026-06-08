'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plane, Car, Map, Zap, MoreHorizontal, MapPin, Star, Check, ArrowLeft, Gauge, Fuel, Settings2, DoorOpen, Users, ShieldCheck, Banknote, UserCheck, Truck } from 'lucide-react';
import { getUser, syncServicesFromRemote, saveServiceBooking } from '@/lib/store';
import { Service, ServiceType, ServiceBooking } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

const TYPE_ICONS: Record<ServiceType, React.ElementType> = {
  transfert: Plane, voiture: Car, guide: Map, activite: Zap, autre: MoreHorizontal,
};
const TYPE_COLORS: Record<ServiceType, string> = {
  transfert: 'bg-blue-100 text-blue-700',
  voiture: 'bg-purple-100 text-purple-700',
  guide: 'bg-green-100 text-green-700',
  activite: 'bg-orange-100 text-orange-700',
  autre: 'bg-gray-100 text-gray-600',
};

const CAR_CATEGORY_LABELS: Record<string, string> = {
  compacte: 'Compacte', berline: 'Berline', suv: 'SUV', '4x4': '4×4',
  van: 'Van', luxe: 'Luxe', cabriolet: 'Cabriolet', autre: 'Autre',
};
const FUEL_LABELS: Record<string, string> = {
  essence: 'Essence', diesel: 'Diesel', electrique: 'Électrique', hybride: 'Hybride',
};

function Spec({ Icon, label, value }: { Icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
      <Icon size={16} className="text-purple-600 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ServiceDetail({ id: idProp }: { id?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const id = idProp ?? (params?.id as string);

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);

  // Booking form state
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [persons, setPersons] = useState(1);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [flight, setFlight] = useState('');
  const [withDriver, setWithDriver] = useState(false);
  const [language, setLanguage] = useState('Français');
  const [duration, setDuration] = useState('Journée complète');
  const [interests, setInterests] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    syncServicesFromRemote().then(all => {
      const found = all.find(s => s.id === id);
      setService(found ?? null);
      setLoading(false);
    });
  }, [id]);

  function computeTotal(): number {
    if (!service) return 0;
    const days = endDate && date ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(date).getTime()) / 86400000) + 1) : 1;
    if (service.priceUnit === 'personne') return service.price * persons;
    if (service.priceUnit === 'jour') return service.price * days;
    return service.price;
  }

  function getRentalDays(): number {
    if (!endDate || !date) return 0;
    return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(date).getTime()) / 86400000) + 1);
  }

  async function handleBook() {
    const u = getUser();
    if (!u) { router.push(`/login?redirect=/services/${id}`); return; }
    if (!date) { setError('Veuillez choisir une date de prise en charge.'); return; }
    if (service?.type === 'voiture' && !endDate) { setError('Veuillez choisir une date de restitution.'); return; }
    if (service?.type === 'voiture' && endDate && endDate <= date) { setError('La date de restitution doit être après la date de prise en charge.'); return; }
    if (!service) return;
    setSubmitting(true);
    const booking: ServiceBooking = {
      id: `sbk-${Date.now()}`,
      serviceId: service.id,
      serviceTitle: service.title,
      serviceType: service.type,
      serviceImage: service.images[0] ?? '',
      serviceLocation: service.location,
      providerId: service.providerId,
      providerName: service.providerName,
      providerAvatar: service.providerAvatar,
      guestId: u.id,
      guestName: u.name,
      guestAvatar: u.avatar,
      date,
      time: time || undefined,
      endDate: endDate || undefined,
      persons,
      pickupLocation: pickup || undefined,
      dropoffLocation: dropoff || undefined,
      flightNumber: flight || undefined,
      carCategory: service.carCategory || undefined,
      withDriver: service.type === 'voiture' ? withDriver : undefined,
      language: language || undefined,
      duration: duration || undefined,
      interests: interests || undefined,
      notes: notes || undefined,
      total: computeTotal(),
      status: 'pending',
      createdAt: Date.now(),
    };
    saveServiceBooking(booking);
    setSubmitting(false);
    setBooked(true);
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse"><div className="h-64 bg-gray-200 rounded-2xl mb-6" /></div>;
  if (!service) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Service introuvable.</div>;

  const Icon = TYPE_ICONS[service.type];
  const colorCls = TYPE_COLORS[service.type];
  const isVoiture = service.type === 'voiture';

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réservation envoyée !</h1>
          <p className="text-gray-500 mb-2">Votre demande a été transmise au prestataire.</p>
          <p className="text-gray-400 text-sm mb-8">Vous serez notifié dès confirmation.</p>
          <button onClick={() => router.push('/reservations')} className="w-full py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold mb-3">
            Voir mes réservations
          </button>
          <button onClick={() => router.push('/services')} className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold">
            Explorer d&apos;autres services
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const total = computeTotal();
  const rentalDays = getRentalDays();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Images */}
      <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-6">
        {service.images[0] ? (
          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Icon size={64} className="text-gray-300" /></div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: details */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full mb-2 ${colorCls}`}>
                <Icon size={10} /> {t(`service.type_${service.type}`)}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{service.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <MapPin size={14} /> {service.location}, {service.wilaya}
                {service.reviewCount > 0 && <>
                  <span>·</span>
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-700">{service.rating.toFixed(1)}</span>
                  <span>({service.reviewCount} avis)</span>
                </>}
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">{service.description}</p>

          {/* Car specs grid */}
          {isVoiture && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t('service.car_specs')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {service.carCategory && (
                  <Spec Icon={Car} label={t('service.car_category')} value={CAR_CATEGORY_LABELS[service.carCategory] ?? service.carCategory} />
                )}
                {service.transmission && (
                  <Spec Icon={Settings2} label={t('service.car_transmission')} value={service.transmission.charAt(0).toUpperCase() + service.transmission.slice(1)} />
                )}
                {service.fuelType && (
                  <Spec Icon={Fuel} label={t('service.car_fuel')} value={FUEL_LABELS[service.fuelType] ?? service.fuelType} />
                )}
                {service.doors && (
                  <Spec Icon={DoorOpen} label={t('service.car_doors')} value={`${service.doors} portes`} />
                )}
                {service.maxPersons && (
                  <Spec Icon={Users} label="Passagers max" value={`${service.maxPersons} pers.`} />
                )}
                {service.mileageLimit && (
                  <Spec Icon={Gauge} label={t('service.car_mileage')} value={service.mileageLimit} />
                )}
                {service.minAge && (
                  <Spec Icon={UserCheck} label={t('service.car_min_age')} value={`${service.minAge} ans`} />
                )}
                {service.deposit != null && service.deposit > 0 && (
                  <Spec Icon={Banknote} label={t('service.car_deposit')} value={`${service.deposit} DT`} />
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${service.withDriver ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  <Car size={11} /> {service.withDriver ? t('service.car_driver_yes') : t('service.car_driver_no')}
                </span>
                {service.insuranceIncluded && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                    <ShieldCheck size={11} /> {t('service.car_insurance')} incluse
                  </span>
                )}
                {service.deliveryAvailable && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                    <Truck size={11} /> {t('service.car_delivery')}
                  </span>
                )}
              </div>
            </div>
          )}

          {service.includes && service.includes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Ce qui est inclus</h3>
              <ul className="space-y-2">
                {service.includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3">
              {service.providerAvatar ? (
                <img src={service.providerAvatar} alt={service.providerName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#0F4C8A] text-white flex items-center justify-center font-bold">{service.providerName.charAt(0)}</div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{service.providerName}</p>
                <p className="text-xs text-gray-500">{t('nav.role_prestataire')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: booking form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24">
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-2xl font-bold text-[#0F4C8A]">{service.price} DT</span>
              <span className="text-gray-400 text-sm">{t(`service.price_unit_${service.priceUnit}`)}</span>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mb-4">{error}</div>}

            <div className="space-y-3">
              {/* Car rental dates */}
              {isVoiture ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_car_startdate')}</label>
                      <input type="date" min={today} value={date} onChange={e => { setDate(e.target.value); if (endDate && endDate <= e.target.value) setEndDate(''); }} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_car_enddate')}</label>
                      <input type="date" min={date || today} value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" />
                    </div>
                  </div>

                  {rentalDays > 0 && (
                    <p className="text-xs text-center text-purple-700 font-semibold bg-purple-50 py-1.5 rounded-lg">
                      {rentalDays} jour{rentalDays > 1 ? 's' : ''} de location
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_car_pickup')}</label>
                    <input value={pickup} onChange={e => setPickup(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Adresse, hôtel..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_car_return')}</label>
                    <input value={dropoff} onChange={e => setDropoff(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Même lieu ou autre adresse" />
                  </div>

                  {service.withDriver && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('service.book_with_driver')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWithDriver(false)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${!withDriver ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                        >
                          Sans chauffeur
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithDriver(true)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${withDriver ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                        >
                          Avec chauffeur
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Non-car-rental date */
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_date')} *</label>
                  <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" />
                </div>
              )}

              {/* Time for transfert and activite */}
              {(service.type === 'transfert' || service.type === 'activite') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_time')}</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" />
                </div>
              )}

              {/* Persons (not for car rental, already defined by vehicle capacity) */}
              {!isVoiture && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_persons')}</label>
                  <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-3 py-2">
                    <button type="button" onClick={() => setPersons(Math.max(1, persons - 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-600">−</button>
                    <span className="flex-1 text-center text-sm font-semibold">{persons}</span>
                    <button type="button" onClick={() => setPersons(Math.min(service.maxPersons ?? 99, persons + 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-600">+</button>
                  </div>
                </div>
              )}

              {/* Transfert specific */}
              {service.type === 'transfert' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_pickup')}</label>
                    <input value={pickup} onChange={e => setPickup(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Aéroport, adresse..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_dropoff')}</label>
                    <input value={dropoff} onChange={e => setDropoff(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Hôtel, adresse..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_flight')}</label>
                    <input value={flight} onChange={e => setFlight(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="TU123" />
                  </div>
                </>
              )}

              {/* Guide specific */}
              {service.type === 'guide' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_duration')}</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                      <option>Demi-journée</option>
                      <option>Journée complète</option>
                      <option>2 jours</option>
                      <option>Sur mesure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_language')}</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]">
                      <option>Français</option>
                      <option>Anglais</option>
                      <option>Arabe</option>
                      <option>Allemand</option>
                      <option>Italien</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_interests')}</label>
                    <input value={interests} onChange={e => setInterests(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]" placeholder="Médina, sites romains..." />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('service.book_notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] resize-none" placeholder="Demandes particulières..." />
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-100 mt-4 pt-4 mb-4">
              {isVoiture && rentalDays > 0 && service.priceUnit === 'jour' && (
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{service.price} DT × {rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                  <span>{total} DT</span>
                </div>
              )}
              {isVoiture && service.deposit != null && service.deposit > 0 && (
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Caution (remboursable)</span>
                  <span>{service.deposit} DT</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span>Total location</span>
                <span className="text-[#0F4C8A] text-base">{total} DT</span>
              </div>
            </div>

            <button onClick={handleBook} disabled={submitting || !date || (isVoiture && !endDate)} className="w-full py-3.5 bg-[#0F4C8A] text-white rounded-xl font-bold hover:bg-[#0A3566] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Envoi...' : t('service.book_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
