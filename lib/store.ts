import { Property, Booking } from './types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'host';
  avatar: string;
}

export interface ProfileData {
  phone: string;
  address: string;
  birthDate: string;
  gender: 'homme' | 'femme' | '';
  hobbies: string;
  bio: string;
}

const EMPTY_PROFILE: ProfileData = { phone: '', address: '', birthDate: '', gender: '', hobbies: '', bio: '' };

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('darhost_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setUser(user: StoredUser): void {
  localStorage.setItem('darhost_user', JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem('darhost_user');
}

export function getProfileData(): ProfileData {
  if (typeof window === 'undefined') return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem('darhost_profile');
    return raw ? { ...EMPTY_PROFILE, ...JSON.parse(raw) } : EMPTY_PROFILE;
  } catch { return EMPTY_PROFILE; }
}

export function setProfileData(data: ProfileData): void {
  localStorage.setItem('darhost_profile', JSON.stringify(data));
}

export interface HostBankData { bankHolder: string; bankName: string; rib: string; }
const EMPTY_BANK: HostBankData = { bankHolder: '', bankName: '', rib: '' };

export function getHostBank(): HostBankData {
  if (typeof window === 'undefined') return EMPTY_BANK;
  try {
    const raw = localStorage.getItem('darhost_host_bank');
    return raw ? { ...EMPTY_BANK, ...JSON.parse(raw) } : EMPTY_BANK;
  } catch { return EMPTY_BANK; }
}

export function setHostBank(data: HostBankData): void {
  localStorage.setItem('darhost_host_bank', JSON.stringify(data));
}

export type IdentityStatus = 'none' | 'pending' | 'verified';

export function getIdentityStatus(): IdentityStatus {
  if (typeof window === 'undefined') return 'none';
  const v = localStorage.getItem('darhost_identity_status');
  if (v === 'verified' || v === 'pending') return v;

  if (localStorage.getItem('darhost_identity_verified') === 'true') return 'verified';
  return 'none';
}

export function setIdentityStatus(status: IdentityStatus): void {
  localStorage.setItem('darhost_identity_status', status);
}

export function getIdentityVerified(): boolean {
  return getIdentityStatus() === 'verified';
}

export function setIdentityVerified(v: boolean): void {
  setIdentityStatus(v ? 'verified' : 'none');
}

export async function submitIdentityForReview(userId: string, userName: string): Promise<void> {
  if (!firebaseUrl) return;
  try {
    await fetch(`${firebaseUrl}/identity_requests/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, status: 'pending', submittedAt: Date.now() }),
    });
  } catch {}
}

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'host';
  avatar: string;
  password: string;
}

export function getAccounts(): Record<string, StoredAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('darhost_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveAccount(account: StoredAccount): void {
  const all = getAccounts();
  all[account.email.toLowerCase()] = account;
  localStorage.setItem('darhost_accounts', JSON.stringify(all));
  if (firebaseUrl) {
    const safeKey = account.id;
    fetch(`${firebaseUrl}/accounts/${safeKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    }).catch(() => {});
  }
}

export function findAccount(email: string, password: string): StoredAccount | null {
  const all = getAccounts();
  const account = all[email.toLowerCase()];
  if (!account) return null;
  if (account.password !== password) return null;
  return account;
}

export function emailExists(email: string): boolean {
  const all = getAccounts();
  return !!all[email.toLowerCase()];
}

export function getSubmittedProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('darhost_submitted_properties');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addSubmittedProperty(property: Property): void {
  const existing = getSubmittedProperties();
  localStorage.setItem(
    'darhost_submitted_properties',
    JSON.stringify([property, ...existing])
  );
}

export function importSharedProperty(property: Property): void {
  const existing = getSubmittedProperties();
  if (!existing.find((p) => p.id === property.id)) {
    addSubmittedProperty(property);
  }
}

const firebaseUrl = (process.env.NEXT_PUBLIC_FIREBASE_DB_URL ?? '').trim().replace(/\/$/, '');

export function isRemoteConnected(): boolean {
  return !!firebaseUrl;
}

export async function syncAccountsFromRemote(): Promise<void> {
  if (!firebaseUrl) return;
  try {
    const res = await fetch(`${firebaseUrl}/accounts.json`);
    const data: Record<string, StoredAccount> | null = res.ok ? await res.json() : null;
    const remoteAccounts = data ? Object.values(data) : [];
    const remoteIds = new Set(remoteAccounts.map(a => a.id));
    const local = getAccounts();

    let localChanged = false;
    for (const account of remoteAccounts) {
      const key = account.email.toLowerCase();
      if (!local[key]) { local[key] = account; localChanged = true; }
    }
    if (localChanged && typeof window !== 'undefined') {
      localStorage.setItem('darhost_accounts', JSON.stringify(local));
    }

    for (const account of Object.values(local)) {
      if (!remoteIds.has(account.id)) {
        fetch(`${firebaseUrl}/accounts/${account.id}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(account),
        }).catch(() => {});
      }
    }
  } catch {}
}

export async function clearAllRemoteData(): Promise<void> {
  if (!firebaseUrl) return;
  try {
    await Promise.all([
      fetch(`${firebaseUrl}/annonces.json`, { method: 'DELETE' }),
      fetch(`${firebaseUrl}/bookings.json`, { method: 'DELETE' }),
      fetch(`${firebaseUrl}/accounts.json`, { method: 'DELETE' }),
      fetch(`${firebaseUrl}/identityRequests.json`, { method: 'DELETE' }),
    ]);
  } catch {}
}

export const isSupabaseConnected = isRemoteConnected;

function stripBase64Images(property: Property): Property {
  const seed = property.id.replace('user-', '');
  return {
    ...property,
    images: property.images.map((img, i) =>
      img.startsWith('data:') ? `https://picsum.photos/seed/${seed}${i}/800/600` : img
    ),
  };
}

export async function savePropertyRemote(property: Property): Promise<void> {
  if (!firebaseUrl) return;
  try {
    const safe = stripBase64Images(property);
    await fetch(`${firebaseUrl}/annonces/${property.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safe),
    });
  } catch {}
}

export async function deleteProperty(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    const all = getSubmittedProperties();
    localStorage.setItem('darhost_submitted_properties', JSON.stringify(all.filter(p => p.id !== id)));
  }
  if (!firebaseUrl) return;
  try {
    await fetch(`${firebaseUrl}/annonces/${id}.json`, { method: 'DELETE' });
  } catch {}
}

export async function pushLocalPropertiesToRemote(): Promise<{ count: number; error: string | null }> {
  if (!firebaseUrl) return { count: 0, error: "Firebase non connecté — ajoutez NEXT_PUBLIC_FIREBASE_DB_URL dans Cloudflare Pages." };
  const local = getSubmittedProperties();
  if (local.length === 0) return { count: 0, error: null };
  let count = 0;
  let lastError: string | null = null;
  for (const property of local) {
    try {
      const safe = stripBase64Images(property);
      const res = await fetch(`${firebaseUrl}/annonces/${property.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safe),
      });
      if (res.ok) { count++; } else { lastError = `PUT échoué (${res.status})`; }
    } catch (e) {
      lastError = String(e);
    }
  }
  return { count, error: count === 0 && lastError ? lastError : null };
}

export async function syncPropertiesFromRemote(): Promise<Property[]> {
  const local = getSubmittedProperties();
  if (!firebaseUrl) return local;
  try {
    const res = await fetch(`${firebaseUrl}/annonces.json`);
    if (!res.ok) return local;
    const data: Record<string, Property> | null = await res.json();
    if (!data) return local;
    const remote = Object.values(data);
    const remoteIds = new Set(remote.map((p) => p.id));
    const merged = [...remote, ...local.filter((p) => !remoteIds.has(p.id))];
    if (typeof window !== 'undefined') {
      localStorage.setItem('darhost_submitted_properties', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return local;
  }
}

export function getBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('darhost_bookings');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function cancelExpiredBookings(): void {
  if (typeof window === 'undefined') return;
  const all = getBookings();
  const now = Date.now();
  all
    .filter(b => b.status === 'confirmed' && b.paymentDeadline && b.paymentDeadline < now)
    .forEach(b => updateBookingStatus(b.id, 'cancelled'));
}

export function saveBooking(booking: Booking): void {
  if (typeof window === 'undefined') return;
  const all = getBookings();
  const idx = all.findIndex(b => b.id === booking.id);
  const next = idx === -1 ? [booking, ...all] : all.map((b, i) => i === idx ? booking : b);
  localStorage.setItem('darhost_bookings', JSON.stringify(next));
  pushBookingRemote(booking).catch(() => {});
}

export function updateBookingStatus(id: string, status: Booking['status'], extra?: Partial<Booking>): void {
  if (typeof window === 'undefined') return;
  const all = getBookings();
  const idx = all.findIndex(b => b.id === id);
  if (idx === -1) return;
  const updated: Booking = { ...all[idx], status, respondedAt: Date.now(), ...extra };
  const next = all.map((b, i) => i === idx ? updated : b);
  localStorage.setItem('darhost_bookings', JSON.stringify(next));
  pushBookingRemote(updated).catch(() => {});
}

async function pushBookingRemote(booking: Booking): Promise<void> {
  if (!firebaseUrl) return;
  try {
    await fetch(`${firebaseUrl}/bookings/${booking.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
  } catch {}
}

export async function syncBookingsFromRemote(): Promise<Booking[]> {
  const local = getBookings();
  if (!firebaseUrl) return local;
  try {
    const res = await fetch(`${firebaseUrl}/bookings.json`);
    if (!res.ok) return local;
    const data: Record<string, Booking> | null = await res.json();
    if (!data) return local;
    const remote = Object.values(data);
    const remoteIds = new Set(remote.map(b => b.id));
    const merged = [...remote, ...local.filter(b => !remoteIds.has(b.id))];
    if (typeof window !== 'undefined') {
      localStorage.setItem('darhost_bookings', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return local;
  }
}

export function generateShareLink(property: Property): string {
  if (typeof window === 'undefined') return '';
  const seed = property.id.replace('user-', '');
  const shareable = {
    ...property,
    images: Array.from({ length: 5 }, (_, i) =>
      `https://picsum.photos/seed/${seed}${i}/800/600`
    ),
  };
  const json = JSON.stringify(shareable);
  const encoded = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) =>
      String.fromCharCode(parseInt(p, 16))
    )
  );
  return `${window.location.origin}/properties/${property.id}#share=${encoded}`;
}
