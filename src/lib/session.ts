// src/lib/session.ts — Gestion cryptographique des sessions (HMAC-SHA256 avec Web Crypto API)
// Compatible Next.js Proxy/Edge et Node.js sans dépendances tierces

export interface SessionPayload {
  email: string;
  role: 'client' | 'dirigeant' | 'chef_usine' | 'chauffeur';
  nom?: string;
  exp: number; // Timestamp unix (secondes)
}

const SESSION_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || '2cgc_beton_super_secret_session_key_2026_ci_daloa';
const COOKIE_NAME = 'beton_session_token';

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Crée un jeton de session inviolable signé par HMAC-SHA256
 */
export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>, maxAgeSeconds = 86400 * 7): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };

  const payloadString = JSON.stringify(fullPayload);
  const encodedPayload = base64UrlEncode(payloadString);

  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binarySignature = '';
  for (let i = 0; i < signatureBytes.length; i++) {
    binarySignature += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(binarySignature)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Vérifie l'intégrité, la signature et l'expiration d'un jeton de session
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;

  try {
    const key = await getHmacKey();

    // Reconstruire la signature binaire
    let base64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Vérifier l'expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export { COOKIE_NAME };
