'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { getUser, syncPropertiesFromRemote } from '@/lib/store';
import { Property } from '@/lib/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_SHORT = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockReservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
}

interface CalendarData {
  blockedDates: string[];
  priceOverrides: Record<string, number>;
}

interface PropertySettings {
  basePrice: number;
  cleaningFee: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  minNights: number;
  bookingNotice: number;
  autoApprove: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const EMPTY_CAL: CalendarData = { blockedDates: [], priceOverrides: {} };
const EMPTY_SETTINGS: PropertySettings = {
  basePrice: 0, cleaningFee: 0, weeklyDiscount: 0, monthlyDiscount: 0,
  minNights: 1, bookingNotice: 1, autoApprove: false,
};

function loadCal(id: string): CalendarData {
  if (typeof window === 'undefined') return EMPTY_CAL;
  try {
    const raw = localStorage.getItem(`darhost_calendar_${id}`);
    if (!raw) return EMPTY_CAL;
    const parsed = JSON.parse(raw);
    // backward-compat: map unavailableDates → blockedDates
    return {
      blockedDates: parsed.blockedDates ?? parsed.unavailableDates ?? [],
      priceOverrides: parsed.priceOverrides ?? {},
    };
  } catch { return EMPTY_CAL; }
}

function saveCal(id: string, data: CalendarData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`darhost_calendar_${id}`, JSON.stringify(data));
}

function loadSettings(id: string, property: Property): PropertySettings {
  if (typeof window === 'undefined') return EMPTY_SETTINGS;
  try {
    const raw = localStorage.getItem(`darhost_settings_${id}`);
    const base = raw ? JSON.parse(raw) : {};
    const calRaw = localStorage.getItem(`darhost_calendar_${id}`);
    const cal = calRaw ? JSON.parse(calRaw) : {};
    return {
      basePrice: base.basePrice ?? property.price,
      cleaningFee: base.cleaningFee ?? property.cleaningFee,
      weeklyDiscount: base.weeklyDiscount ?? cal.weeklyDiscount ?? 0,
      monthlyDiscount: base.monthlyDiscount ?? cal.monthlyDiscount ?? 0,
      minNights: base.minNights ?? property.minNights ?? 1,
      bookingNotice: base.bookingNotice ?? 1,
      autoApprove: base.autoApprove ?? false,
    };
  } catch { return { ...EMPTY_SETTINGS, basePrice: property.price, cleaningFee: property.cleaningFee, minNights: property.minNights }; }
}

// ─── Mock reservations ────────────────────────────────────────────────────────

function toStr(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function generateReservations(property: Property): MockReservation[] {
  const today = new Date();
  const guests = [
    { name: 'Amine B.', id: 'g1' },
    { name: 'Sonia T.', id: 'g2' },
    { name: 'Mehdi K.', id: 'g3' },
    { name: 'Yasmine B.', id: 'g4' },
    { name: 'Karim M.', id: 'g5' },
  ];
  const make = (id: string, gi: number, ci: number, nights: number): MockReservation => {
    const checkIn = toStr(addDays(today, ci));
    const checkOut = toStr(addDays(today, ci + nights));
    return {
      id, guestName: guests[gi].name,
      checkIn, checkOut,
      totalAmount: property.price * nights + (property.cleaningFee || 0),
    };
  };
  return [
    make('r1', 0, -30, 5),
    make('r2', 1, -15, 3),
    make('r3', 2, -2,  5),
    make('r4', 3,  8,  4),
    make('r5', 4, 20,  5),
  ];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateFr(s: string) {
  const [, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

function expandRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let d = new Date(start);
  const e = new Date(end);
  while (d <= e) { dates.push(toStr(d)); d = addDays(d, 1); }
  return dates;
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  dateStr: string;
  day: number;
  todayStr: string;
  reservations: MockReservation[];
  calData: CalendarData;
  settings: PropertySettings;
  basePrice: number;
  selStart: string | null;
  hoverDate: string | null;
  isSelecting: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function DayCell({
  dateStr, day, todayStr, reservations, calData, settings, basePrice,
  selStart, hoverDate, isSelecting, onClick, onMouseEnter,
}: DayCellProps) {
  const isPast = dateStr < todayStr;
  const isToday = dateStr === todayStr;

  // Reservation
  const reservation = reservations.find(r => dateStr >= r.checkIn && dateStr < r.checkOut);
  const isReserved = !!reservation;
  const isResPast = isReserved && reservation!.checkOut <= todayStr;
  const isFirstDay = isReserved && reservation!.checkIn === dateStr;

  // Blocked
  const isBlocked = calData.blockedDates.includes(dateStr);

  // Selection range highlight
  let selRange: [string, string] | null = null;
  if (isSelecting && selStart && hoverDate) {
    selRange = selStart <= hoverDate ? [selStart, hoverDate] : [hoverDate, selStart];
  }
  const isInSel = selRange ? dateStr >= selRange[0] && dateStr <= selRange[1] : false;
  const isSelStart = selStart === dateStr;

  // Price
  const price = calData.priceOverrides[dateStr] ?? (settings.basePrice > 0 ? settings.basePrice : basePrice);

  // Connected bar: check neighbors
  const prevStr = toStr(addDays(new Date(dateStr), -1));
  const nextStr = toStr(addDays(new Date(dateStr), 1));
  const prevRes = reservations.find(r => prevStr >= r.checkIn && prevStr < r.checkOut);
  const nextRes = reservations.find(r => nextStr >= r.checkIn && nextStr < r.checkOut);
  const prevConnected = isReserved && prevRes?.id === reservation?.id;
  const nextConnected = isReserved && nextRes?.id === reservation?.id;

  // Styles
  let bg = '';
  let textColor = 'text-gray-700';
  if (isInSel) {
    bg = 'bg-indigo-100';
    textColor = 'text-indigo-800';
  } else if (isBlocked && !isPast) {
    bg = 'bg-red-50';
    textColor = 'text-red-400';
  } else if (isReserved) {
    bg = isResPast ? 'bg-gray-200' : 'bg-blue-100';
    textColor = isResPast ? 'text-gray-600' : 'text-blue-800';
  } else if (isPast) {
    textColor = 'text-gray-300';
  } else if (isToday) {
    textColor = 'text-[#0F4C8A] font-bold';
  }

  const roundL = (!isReserved || !prevConnected) ? 'rounded-l-lg' : '';
  const roundR = (!isReserved || !nextConnected) ? 'rounded-r-lg' : '';
  const rounded = isReserved ? `${roundL} ${roundR}` : 'rounded-lg';

  const ringClass = isToday && !isReserved && !isBlocked ? 'ring-2 ring-inset ring-[#0F4C8A]' : '';
  const selStartRing = isSelStart ? 'ring-2 ring-inset ring-indigo-500' : '';

  const clickable = !isPast && !isReserved;

  return (
    <button
      data-date={dateStr}
      disabled={isReserved || isPast}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      className={`relative flex flex-col items-center justify-start gap-0 pt-1.5 h-16 w-full transition-colors select-none
        ${bg} ${textColor} ${rounded} ${ringClass} ${selStartRing}
        ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
      `}
    >
      <span className="text-xs font-semibold leading-none">{day}</span>

      {isFirstDay && (
        <span className="text-[9px] leading-tight truncate w-full px-0.5 text-center mt-0.5">
          {reservation!.guestName}
        </span>
      )}
      {isFirstDay && (
        <span className="text-[9px] leading-none text-inherit opacity-70 mt-0.5">
          {reservation!.totalAmount} DT
        </span>
      )}

      {!isReserved && !isBlocked && !isPast && (
        <span className="text-[9px] leading-none text-gray-400 mt-0.5">{price} DT</span>
      )}
      {isBlocked && !isPast && (
        <span className="text-[10px] mt-0.5">✕</span>
      )}
    </button>
  );
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

interface MonthGridProps {
  year: number;
  month: number;
  todayStr: string;
  reservations: MockReservation[];
  calData: CalendarData;
  settings: PropertySettings;
  basePrice: number;
  selStart: string | null;
  hoverDate: string | null;
  isSelecting: boolean;
  onDayClick: (d: string) => void;
  onDayHover: (d: string) => void;
  isCurrentMonth: boolean;
  monthRef?: React.Ref<HTMLDivElement>;
}

function MonthGrid({
  year, month, todayStr, reservations, calData, settings, basePrice,
  selStart, hoverDate, isSelecting, onDayClick, onDayHover, isCurrentMonth, monthRef,
}: MonthGridProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();

  return (
    <div ref={monthRef} className="mb-6">
      <h3 className={`text-base font-bold mb-3 ${isCurrentMonth ? 'text-[#0F4C8A]' : 'text-gray-900'}`}>
        {MONTH_NAMES[month]} {year}
      </h3>
      <div className="grid grid-cols-7 mb-1">
        {DAY_INITIALS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 gap-x-0">
        {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <DayCell
              key={day}
              dateStr={dateStr}
              day={day}
              todayStr={todayStr}
              reservations={reservations}
              calData={calData}
              settings={settings}
              basePrice={basePrice}
              selStart={selStart}
              hoverDate={hoverDate}
              isSelecting={isSelecting}
              onClick={() => onDayClick(dateStr)}
              onMouseEnter={() => onDayHover(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PropertyCalendarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? '';

  const [property, setProperty] = useState<Property | null>(null);
  const [calData, setCalData] = useState<CalendarData>(EMPTY_CAL);
  const [settings, setSettings] = useState<PropertySettings>(EMPTY_SETTINGS);
  const [reservations, setReservations] = useState<MockReservation[]>([]);

  // Selection
  const [selStart, setSelStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingRange, setPendingRange] = useState<{ start: string; end: string } | null>(null);

  const currentMonthRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const todayStr = toStr(today);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'host') { router.push('/host/calendar'); return; }
    if (!id) { router.push('/host/calendar'); return; }
    syncPropertiesFromRemote().then(props => {
      const prop = props.find(p => p.id === id);
      if (!prop) { router.push('/host/calendar'); return; }
      setProperty(prop);
      setReservations(generateReservations(prop));
      const cal = loadCal(id);
      setCalData(cal);
      setSettings(loadSettings(id, prop));
    });
  }, [id, router]);

  useEffect(() => {
    if (currentMonthRef.current && property) {
      setTimeout(() => currentMonthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [property]);

  // Months: 2 before + current + 6 after
  const months = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 2 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  function handleDayClick(dateStr: string) {
    if (!isSelecting) {
      setSelStart(dateStr);
      setIsSelecting(true);
    } else {
      const [start, end] = selStart! <= dateStr ? [selStart!, dateStr] : [dateStr, selStart!];
      setPendingRange({ start, end });
      setSelStart(null);
      setHoverDate(null);
      setIsSelecting(false);
    }
  }

  function cancelSelect() {
    setSelStart(null);
    setHoverDate(null);
    setIsSelecting(false);
  }

  function confirmBlock() {
    if (!pendingRange || !property) return;
    const dates = expandRange(pendingRange.start, pendingRange.end);
    const next: CalendarData = {
      ...calData,
      blockedDates: Array.from(new Set([...calData.blockedDates, ...dates])),
    };
    setCalData(next);
    saveCal(property.id, next);
    setPendingRange(null);
  }

  function confirmUnblock() {
    if (!pendingRange || !property) return;
    const next: CalendarData = {
      ...calData,
      blockedDates: calData.blockedDates.filter(d => d < pendingRange.start || d > pendingRange.end),
    };
    setCalData(next);
    saveCal(property.id, next);
    setPendingRange(null);
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" onMouseLeave={() => { if (isSelecting) setHoverDate(null); }}>
      {/* Sticky header */}
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push('/host/calendar')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="text-center flex-1 min-w-0 mx-3">
          <p className="font-bold text-gray-900 text-sm truncate">{property.title}</p>
          {isSelecting && (
            <p className="text-xs text-indigo-600">Tapez la date de fin de la période</p>
          )}
        </div>
        <button
          onClick={() => router.push(`/host/calendar/settings?id=${id}`)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Settings size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Selection banner */}
      {isSelecting && (
        <div className="sticky top-14 md:top-30 z-10 bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-indigo-800">
            Depuis le <span className="font-bold">{formatDateFr(selStart!)}</span> — sélectionnez la fin
          </p>
          <button onClick={cancelSelect} className="text-sm font-semibold text-red-600 hover:text-red-700">
            Annuler
          </button>
        </div>
      )}

      {/* Calendar scroll */}
      <div className="px-4 pt-4 pb-32">
        {months.map(({ year, month }) => {
          const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
          return (
            <MonthGrid
              key={`${year}-${month}`}
              year={year}
              month={month}
              todayStr={todayStr}
              reservations={reservations}
              calData={calData}
              settings={settings}
              basePrice={property.price}
              selStart={selStart}
              hoverDate={hoverDate}
              isSelecting={isSelecting}
              onDayClick={handleDayClick}
              onDayHover={setHoverDate}
              isCurrentMonth={isCurrentMonth}
              monthRef={isCurrentMonth ? currentMonthRef : undefined}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 flex gap-4 text-[10px] text-gray-600 justify-center items-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block" /> Réservé (à venir)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Réservé (passé)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Bloqué</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 inline-block" /> Libre</span>
      </div>

      {/* Confirm modal */}
      {pendingRange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Gérer cette période</h3>
            <p className="text-sm text-gray-500 mb-6">
              Du <strong>{formatDateFr(pendingRange.start)}</strong> au <strong>{formatDateFr(pendingRange.end)}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmUnblock}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Débloquer
              </button>
              <button
                onClick={confirmBlock}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Bloquer
              </button>
            </div>
            <button
              onClick={() => setPendingRange(null)}
              className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyCalendarPage() {
  return (
    <Suspense>
      <PropertyCalendarInner />
    </Suspense>
  );
}
