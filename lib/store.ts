import { Property } from './types';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'host';
  avatar: string;
}

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
