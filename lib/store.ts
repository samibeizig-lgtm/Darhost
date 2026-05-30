import { Property } from './types';

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

// ── Firebase Realtime Database sync ──────────────────────────────────────────

const firebaseUrl = (process.env.NEXT_PUBLIC_FIREBASE_DB_URL ?? '').trim().replace(/\/$/, '');

export function isRemoteConnected(): boolean {
  return !!firebaseUrl;
}

// Keep old name for backward compat with profile page
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

// ─────────────────────────────────────────────────────────────────────────────

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
