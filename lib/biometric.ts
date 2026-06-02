const CRED_KEY = 'hostn_biometric_credential';

interface StoredCred {
  credentialId: string;
  email: string;
}

export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );
}

export function getBiometricCredential(): StoredCred | null {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
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

export async function registerBiometric(email: string): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: 'Hostn', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(email).buffer as ArrayBuffer,
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 },  // RS256
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

    localStorage.setItem(CRED_KEY, JSON.stringify({
      credentialId: b64url(credential.rawId),
      email,
    }));
    return true;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(): Promise<string | null> {
  const stored = getBiometricCredential();
  if (!stored) return null;
  try {
    const credId = Uint8Array.from(
      atob(stored.credentialId.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    ).buffer as ArrayBuffer;
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        rpId: window.location.hostname,
        allowCredentials: [{ type: 'public-key', id: credId }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;
    return stored.email;
  } catch {
    return null;
  }
}

export function removeBiometric(): void {
  localStorage.removeItem(CRED_KEY);
}
