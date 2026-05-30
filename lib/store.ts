import { Property } from './types';
import { supabaseUrl, supabaseKey } from './supabase';

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

// ── Supabase sync (raw fetch — bypasses JS client path handling) ─────────────

export function isSupabaseConnected(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

const supabaseHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
});

function stripBase64Images(property: Property): Property {
  const seed = property.id.replace('user-', '');
  return {
    ...property,
    images: property.images.map((img, i) =>
      img.startsWith('data:') ? `https://picsum.photos/seed/${seed}${i}/800/600` : img
    ),
  };
}

async function insertOrUpdate(property: Property): Promise<string | null> {
  if (!supabaseUrl || !supabaseKey) return 'Supabase non connecté';
  const safe = stripBase64Images(property);
  const body = JSON.stringify({ id: property.id, data: safe });
  const base = `${supabaseUrl}/rest/v1/properties`;

  // Try INSERT
  const insertRes = await fetch(base, {
    method: 'POST',
    headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
    body,
  });

  if (insertRes.ok || insertRes.status === 201) return null;

  // If duplicate key, UPDATE instead
  if (insertRes.status === 409 || insertRes.status === 400) {
    const updateRes = await fetch(`${base}?id=eq.${encodeURIComponent(property.id)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({ data: safe }),
    });
    if (updateRes.ok) return null;
    const errText = await updateRes.text().catch(() => String(updateRes.status));
    return `UPDATE échoué (${updateRes.status}): ${errText}`;
  }

  const errText = await insertRes.text().catch(() => String(insertRes.status));
  return `INSERT échoué (${insertRes.status}): ${errText}`;
}

export async function savePropertyRemote(property: Property): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try { await insertOrUpdate(property); } catch {}
}

export async function pushLocalPropertiesToRemote(): Promise<{ count: number; error: string | null }> {
  if (!supabaseUrl || !supabaseKey) return { count: 0, error: "Supabase non connecté — vérifiez les variables d'environnement et redéployez." };
  const local = getSubmittedProperties();
  if (local.length === 0) return { count: 0, error: null };
  let count = 0;
  let lastError: string | null = null;
  for (const property of local) {
    try {
      const err = await insertOrUpdate(property);
      if (err) { lastError = err; } else { count++; }
    } catch (e) {
      lastError = String(e);
    }
  }
  return { count, error: count === 0 && lastError ? lastError : null };
}

export async function syncPropertiesFromRemote(): Promise<Property[]> {
  const local = getSubmittedProperties();
  if (!supabaseUrl || !supabaseKey) return local;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/properties?select=data&order=created_at.desc`,
      { headers: supabaseHeaders() }
    );
    if (!res.ok) return local;
    const rows: { data: Property }[] = await res.json();
    const remote = rows.map((r) => r.data);
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
