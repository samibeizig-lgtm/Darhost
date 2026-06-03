interface BiometricEntry {
  userId: string;
  email: string;
  credentialId: string;
}

const INDEX_KEY = 'hostn_biometric_index';

function getIndex(): BiometricEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setIndex(entries: BiometricEntry[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );
}

export function isBiometricEnabledForUser(userId: string): boolean {
  return getIndex().some(e => e.userId === userId);
}

export function hasAnyBiometric(): boolean {
  return getIndex().length > 0;
}

function randomBytes(n: number): ArrayBuffer {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr.buffer as ArrayBuffer;
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlToBuffer(s: string): ArrayBuffer {
  return Uint8Array.from(
    atob(s.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  ).buffer as ArrayBuffer;
}

export async function registerBiometric(email: string, userId: string): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'Hostn', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId).buffer as ArrayBuffer,
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const credentialId = b64url(credential.rawId);
    const entries = getIndex().filter(e => e.userId !== userId);
    entries.push({ userId, email, credentialId });
    setIndex(entries);
    return true;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(): Promise<string | null> {
  const entries = getIndex();
  if (entries.length === 0) return null;
  try {
    const allowCredentials = entries.map(e => ({
      type: 'public-key' as const,
      id: b64urlToBuffer(e.credentialId),
    }));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;
    const usedId = b64url(assertion.rawId);
    const entry = entries.find(e => e.credentialId === usedId);
    return entry?.email ?? null;
  } catch {
    return null;
  }
}

export function removeBiometric(userId: string): void {
  setIndex(getIndex().filter(e => e.userId !== userId));
}
