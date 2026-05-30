'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUser, syncPropertiesFromRemote } from '@/lib/store';
import { Property } from '@/lib/types';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0
}

export default function CalendarPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [today] = useState(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/calendar'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    syncPropertiesFromRemote().then((props) => {
      setProperties(props);
      if (props.length > 0) setSelectedProperty(props[0]);
    });
  }, [router]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

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

          {/* Calendar */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {selectedProperty && (
              <>
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

                <div className="grid grid-cols-7 mb-2">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                  ))}
                </div>

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
                    return (
                      <button
                        key={day}
                        disabled={isPast}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                          isToday
                            ? 'bg-[#0F4C8A] text-white'
                            : isPast
                            ? 'text-gray-300 cursor-default'
                            : 'hover:bg-[#E8F0FB] hover:text-[#0F4C8A] text-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    La gestion des réservations et des blocages de dates sera disponible prochainement.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
