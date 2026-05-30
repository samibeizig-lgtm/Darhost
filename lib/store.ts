import { Property } from './types';
import { supabase } from './supabase';

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

// ── Supabase sync ────────────────────────────────────────────────────────────

export async function savePropertyRemote(property: Property): Promise<void> {
  if (!supabase) return;
  try {
    const seed = property.id.replace('user-', '');
    // Strip base64 images — too large for Supabase JSONB rows; use picsum placeholders instead
    const safeProperty: Property = {
      ...property,
      images: property.images.map((img, i) =>
        img.startsWith('data:') ? `https://picsum.photos/seed/${seed}${i}/800/600` : img
      ),
    };
    await supabase.from('properties').upsert({ id: property.id, data: safeProperty });
  } catch {}
}

export async function pushLocalPropertiesToRemote(): Promise<number> {
  if (!supabase) return 0;
  const local = getSubmittedProperties();
  let count = 0;
  for (const property of local) {
    try {
      const seed = property.id.replace('user-', '');
      const safeProperty: Property = {
        ...property,
        images: property.images.map((img, i) =>
          img.startsWith('data:') ? `https://picsum.photos/seed/${seed}${i}/800/600` : img
        ),
      };
      const { error } = await supabase.from('properties').upsert({ id: property.id, data: safeProperty });
      if (!error) count++;
    } catch {}
  }
  return count;
}

export async function syncPropertiesFromRemote(): Promise<Property[]> {
  const local = getSubmittedProperties();
  if (!supabase) return local;
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('data')
      .order('created_at', { ascending: false });
    if (error || !data) return local;
    const remote: Property[] = data.map((row) => (row as { data: Property }).data);
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
