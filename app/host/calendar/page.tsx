'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { getUser, syncPropertiesFromRemote } from '@/lib/store';
import { Property } from '@/lib/types';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface CalendarData {
  unavailableDates: string[];
  priceOverrides: Record<string, number>;
  weeklyDiscount: number;
  monthlyDiscount: number;
}

const EMPTY_CALENDAR: CalendarData = {
  unavailableDates: [],
  priceOverrides: {},
  weeklyDiscount: 0,
  monthlyDiscount: 0,
};

function getCalendarKey(propertyId: string) {
  return `darhost_calendar_${propertyId}`;
}

function loadCalendarData(propertyId: string): CalendarData {
  if (typeof window === 'undefined') return EMPTY_CALENDAR;
  try {
    const raw = localStorage.getItem(getCalendarKey(propertyId));
    return raw ? { ...EMPTY_CALENDAR, ...JSON.parse(raw) } : EMPTY_CALENDAR;
  } catch { return EMPTY_CALENDAR; }
}

function saveCalendarData(propertyId: string, data: CalendarData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCalendarKey(propertyId), JSON.stringify(data));
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function dateKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

type Tab = 'disponibilites' | 'prix' | 'remises';

export default function CalendarPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [today] = useState(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState<Tab>('disponibilites');
  const [calData, setCalData] = useState<CalendarData>(EMPTY_CALENDAR);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [weeklyDiscount, setWeeklyDiscount] = useState('0');
  const [monthlyDiscount, setMonthlyDiscount] = useState('0');
  const [discountSaved, setDiscountSaved] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/calendar'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    syncPropertiesFromRemote().then((props) => {
      setProperties(props);
      if (props.length > 0) setSelectedProperty(props[0]);
    });
  }, [router]);

  const loadData = useCallback((prop: Property) => {
    const data = loadCalendarData(prop.id);
    setCalData(data);
    setWeeklyDiscount(String(data.weeklyDiscount));
    setMonthlyDiscount(String(data.monthlyDiscount));
  }, []);

  useEffect(() => {
    if (selectedProperty) loadData(selectedProperty);
  }, [selectedProperty, loadData]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function toggleUnavailable(day: number) {
    if (!selectedProperty) return;
    const key = dateKey(viewYear, viewMonth, day);
    const isUnavail = calData.unavailableDates.includes(key);
    const next: CalendarData = {
      ...calData,
      unavailableDates: isUnavail
        ? calData.unavailableDates.filter((d) => d !== key)
        : [...calData.unavailableDates, key],
    };
    setCalData(next);
    saveCalendarData(selectedProperty.id, next);
  }

  function handleDatePriceClick(day: number) {
    if (!selectedProperty) return;
    const key = dateKey(viewYear, viewMonth, day);
    setEditingDate(key);
    setPriceInput(String(calData.priceOverrides[key] ?? ''));
  }

  function saveDatePrice(key: string) {
    if (!selectedProperty) return;
    const val = Number(priceInput);
    const overrides = { ...calData.priceOverrides };
    if (priceInput === '' || isNaN(val)) {
      delete overrides[key];
    } else {
      overrides[key] = val;
    }
    const next: CalendarData = { ...calData, priceOverrides: overrides };
    setCalData(next);
    saveCalendarData(selectedProperty.id, next);
    setEditingDate(null);
  }

  function saveDiscounts() {
    if (!selectedProperty) return;
    const next: CalendarData = {
      ...calData,
      weeklyDiscount: Number(weeklyDiscount) || 0,
      monthlyDiscount: Number(monthlyDiscount) || 0,
    };
    setCalData(next);
    saveCalendarData(selectedProperty.id, next);
    setDiscountSaved(true);
    setTimeout(() => setDiscountSaved(false), 2000);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'disponibilites', label: 'Disponibilités' },
    { key: 'prix', label: 'Prix par date' },
    { key: 'remises', label: 'Remises' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#E8F0FB] rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-[#0F4C8A]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-sm text-gray-500">Gérez les disponibilités de vos logements</p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun logement publié</h3>
          <p className="text-gray-400 text-sm">Publiez votre premier logement pour gérer son calendrier.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Property selector */}
          <div className="lg:w-64 shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Logements</p>
            <div className="flex flex-col gap-2">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProperty(p)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors border ${
                    selectedProperty?.id === p.id
                      ? 'bg-[#0F4C8A] text-white border-[#0F4C8A]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#0F4C8A]'
                  }`}
                >
                  <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className={`text-xs truncate ${selectedProperty?.id === p.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {p.location}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {selectedProperty && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setEditingDate(null); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                        activeTab === tab.key
                          ? 'bg-white text-[#0F4C8A] shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Disponibilités & Prix tabs share the calendar */}
                {(activeTab === 'disponibilites' || activeTab === 'prix') && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-6">
                      <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronLeft size={18} className="text-gray-600" />
                      </button>
                      <h2 className="text-lg font-bold text-gray-900">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </h2>
                      <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ChevronRight size={18} className="text-gray-600" />
                      </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const isToday =
                          day === today.getDate() &&
                          viewMonth === today.getMonth() &&
                          viewYear === today.getFullYear();
                        const isPast =
                          new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const key = dateKey(viewYear, viewMonth, day);
                        const isUnavail = calData.unavailableDates.includes(key);
                        const priceOverride = calData.priceOverrides[key];
                        const isEditing = editingDate === key;

                        if (activeTab === 'disponibilites') {
                          return (
                            <button
                              key={day}
                              disabled={isPast}
                              onClick={() => !isPast && toggleUnavailable(day)}
                              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors relative ${
                                isToday && !isUnavail
                                  ? 'bg-[#0F4C8A] text-white'
                                  : isPast
                                  ? 'text-gray-300 cursor-default'
                                  : isUnavail
                                  ? 'bg-red-100 text-red-500 line-through hover:bg-red-200'
                                  : 'hover:bg-[#E8F0FB] hover:text-[#0F4C8A] text-gray-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        }

                        // Prix tab
                        return (
                          <div key={day} className="relative">
                            {isEditing ? (
                              <div className="absolute z-10 top-0 left-1/2 -translate-x-1/2 bg-white border border-[#0F4C8A] rounded-xl shadow-lg p-2 w-24">
                                <input
                                  type="number"
                                  min="0"
                                  value={priceInput}
                                  onChange={(e) => setPriceInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveDatePrice(key);
                                    if (e.key === 'Escape') setEditingDate(null);
                                  }}
                                  autoFocus
                                  placeholder="DT"
                                  className="w-full text-xs border-none outline-none text-center font-semibold text-[#0F4C8A]"
                                />
                                <button
                                  onClick={() => saveDatePrice(key)}
                                  className="w-full mt-1 text-[10px] bg-[#0F4C8A] text-white rounded-lg py-0.5 font-bold"
                                >
                                  OK
                                </button>
                              </div>
                            ) : null}
                            <button
                              disabled={isPast}
                              onClick={() => !isPast && handleDatePriceClick(day)}
                              className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                                isToday
                                  ? 'bg-[#0F4C8A] text-white'
                                  : isPast
                                  ? 'text-gray-300 cursor-default'
                                  : priceOverride
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'hover:bg-[#E8F0FB] hover:text-[#0F4C8A] text-gray-700'
                              }`}
                            >
                              <span>{day}</span>
                              {priceOverride && !isPast && (
                                <span className="text-[9px] font-bold leading-none mt-0.5">
                                  {priceOverride}DT
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {activeTab === 'disponibilites' ? (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#0F4C8A] inline-block" /> Aujourd&apos;hui
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-red-100 inline-block" /> Indisponible
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border border-gray-300 inline-block" /> Disponible
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Prix personnalisé
                          </span>
                          <span className="text-gray-400">Cliquez sur une date pour définir un prix</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remises tab */}
                {activeTab === 'remises' && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Remises</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Définissez des remises automatiques pour les séjours longs.
                    </p>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Remise semaine (%) — 7 nuits ou plus
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weeklyDiscount}
                            onChange={(e) => setWeeklyDiscount(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                        </div>
                        {Number(weeklyDiscount) > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Les voyageurs bénéficieront de <strong>{weeklyDiscount}%</strong> de réduction pour 7 nuits+
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Remise mois (%) — 28 nuits ou plus
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={monthlyDiscount}
                            onChange={(e) => setMonthlyDiscount(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                        </div>
                        {Number(monthlyDiscount) > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Les voyageurs bénéficieront de <strong>{monthlyDiscount}%</strong> de réduction pour 28 nuits+
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={saveDiscounts}
                          className="flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-xl font-semibold hover:bg-[#0A3566] transition-colors"
                        >
                          {discountSaved ? <Check size={16} /> : <Save size={16} />}
                          {discountSaved ? 'Enregistré !' : 'Enregistrer les remises'}
                        </button>
                      </div>

                      {(calData.weeklyDiscount > 0 || calData.monthlyDiscount > 0) && (
                        <div className="mt-4 p-4 bg-[#E8F0FB] rounded-xl text-sm">
                          <p className="font-semibold text-[#0F4C8A] mb-2">Remises actuelles</p>
                          {calData.weeklyDiscount > 0 && (
                            <p className="text-gray-700">Semaine : <strong>{calData.weeklyDiscount}%</strong></p>
                          )}
                          {calData.monthlyDiscount > 0 && (
                            <p className="text-gray-700">Mois : <strong>{calData.monthlyDiscount}%</strong></p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
