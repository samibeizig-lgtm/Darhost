'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { getUser, syncPropertiesFromRemote, savePropertyRemote, getSubmittedProperties } from '@/lib/store';
import { Property } from '@/lib/types';

interface PropertySettings {
  basePrice: number;
  cleaningFee: number;
  weeklyDiscount: number;
  monthlyDiscount: number;
  minNights: number;
  bookingNotice: number;
  autoApprove: boolean;
}

const EMPTY: PropertySettings = {
  basePrice: 0, cleaningFee: 0, weeklyDiscount: 0, monthlyDiscount: 0,
  minNights: 1, bookingNotice: 1, autoApprove: false,
};

function loadSettings(id: string, prop: Property): PropertySettings {
  if (typeof window === 'undefined') return { ...EMPTY, basePrice: prop.price, cleaningFee: prop.cleaningFee, minNights: prop.minNights };
  try {
    const raw = localStorage.getItem(`darhost_settings_${id}`);
    const base = raw ? JSON.parse(raw) : {};
    const calRaw = localStorage.getItem(`darhost_calendar_${id}`);
    const cal = calRaw ? JSON.parse(calRaw) : {};
    return {
      basePrice: base.basePrice ?? prop.price,
      cleaningFee: base.cleaningFee ?? prop.cleaningFee,
      weeklyDiscount: base.weeklyDiscount ?? cal.weeklyDiscount ?? 0,
      monthlyDiscount: base.monthlyDiscount ?? cal.monthlyDiscount ?? 0,
      minNights: base.minNights ?? prop.minNights ?? 1,
      bookingNotice: base.bookingNotice ?? 1,
      autoApprove: base.autoApprove ?? false,
    };
  } catch { return { ...EMPTY, basePrice: prop.price, cleaningFee: prop.cleaningFee, minNights: prop.minNights }; }
}

function saveSettings(id: string, s: PropertySettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`darhost_settings_${id}`, JSON.stringify(s));
}

function updatePropertyInStorage(id: string, updates: Partial<Property>) {
  if (typeof window === 'undefined') return;
  const all = getSubmittedProperties();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return;
  const next = [...all];
  next[idx] = { ...next[idx], ...updates };
  localStorage.setItem('darhost_submitted_properties', JSON.stringify(next));
  savePropertyRemote(next[idx]).catch(() => {});
}

// ─── Row helpers ──────────────────────────────────────────────────────────────

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
      />
      {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#0F4C8A]' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

function SettingsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? '';

  const [property, setProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<PropertySettings>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'host') { router.push('/host/calendar'); return; }
    if (!id) { router.push('/host/calendar'); return; }
    syncPropertiesFromRemote().then(props => {
      const prop = props.find(p => p.id === id);
      if (!prop) { router.push('/host/calendar'); return; }
      setProperty(prop);
      setForm(loadSettings(id, prop));
    });
  }, [id, router]);

  function set<K extends keyof PropertySettings>(key: K, value: PropertySettings[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!property) return;
    setSaving(true);
    saveSettings(id, form);
    // Also sync cleaningFee and minNights back to the property
    updatePropertyInStorage(id, {
      price: form.basePrice,
      cleaningFee: form.cleaningFee,
      minNights: form.minNights,
      autoApprove: form.autoApprove,
    });
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const NOTICE_LABELS: Record<number, string> = {
    0: 'Le jour même',
    1: '1 nuit avant',
    2: '2 nuits avant',
    3: '3 nuits avant',
    4: '4 nuits avant',
    5: '5 nuits avant',
    6: '6 nuits avant',
    7: '7 nuits avant',
  };

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#0F4C8A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push(`/host/calendar/property?id=${id}`)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <p className="font-bold text-gray-900 text-sm">Paramètres</p>
          <p className="text-xs text-gray-500 truncate max-w-[240px]">{property.title}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">

        {/* Tarifs */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Tarifs</h2>
          </div>
          <div className="px-4">
            <FieldRow
              label="Prix de base / nuit"
              hint="Appliqué aux jours sans prix personnalisé sur le calendrier"
            >
              <NumberInput value={form.basePrice} onChange={v => set('basePrice', v)} min={0} suffix="DT" />
            </FieldRow>
            <FieldRow label="Frais de ménage">
              <NumberInput value={form.cleaningFee} onChange={v => set('cleaningFee', v)} min={0} suffix="DT" />
            </FieldRow>
            <FieldRow label="Remise semaine" hint="7 nuits ou plus">
              <NumberInput value={form.weeklyDiscount} onChange={v => set('weeklyDiscount', Math.min(v, 100))} min={0} max={100} suffix="%" />
            </FieldRow>
            <FieldRow label="Remise mois" hint="28 nuits ou plus">
              <NumberInput value={form.monthlyDiscount} onChange={v => set('monthlyDiscount', Math.min(v, 100))} min={0} max={100} suffix="%" />
            </FieldRow>
          </div>
        </div>

        {/* Règles */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Règles de réservation</h2>
          </div>
          <div className="px-4">
            <FieldRow label="Nuits minimum">
              <NumberInput value={form.minNights} onChange={v => set('minNights', Math.max(1, v))} min={1} max={30} suffix="nuits" />
            </FieldRow>
            <FieldRow
              label="Délai avant arrivée"
              hint="Préavis minimum requis pour réserver"
            >
              <select
                value={form.bookingNotice}
                onChange={e => set('bookingNotice', Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] bg-white"
              >
                {Object.entries(NOTICE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </FieldRow>
          </div>
        </div>

        {/* Validation */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Validation des réservations</h2>
          </div>
          <div className="px-4">
            <FieldRow
              label="Validation automatique"
              hint={form.autoApprove
                ? 'Les demandes sont acceptées instantanément'
                : 'Vous validez manuellement chaque demande'}
            >
              <Toggle checked={form.autoApprove} onChange={v => set('autoApprove', v)} />
            </FieldRow>
          </div>
        </div>

        {/* Save */}
        <div className="pt-2">
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
            {saving ? 'Enregistrement...' : saved ? 'Paramètres enregistrés !' : 'Enregistrer les paramètres'}
          </button>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 text-center px-4">
          Le prix de base s&apos;applique uniquement aux jours sans prix spécifique défini sur le calendrier.
          Les prix personnalisés du calendrier sont toujours prioritaires.
        </p>
      </div>
    </div>
  );
}

export default function CalendarSettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
