// ── WebAuthn / Biometric login helpers (Omix Store) ──
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ponytail: base64url → base64 fix. atob() rejects URL-safe chars (-/_)
// and expects padding. WebAuthn servers send base64url without padding.
function base64ToUint8Array(b64) {
  // Convert base64url to standard base64
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if missing
  while (s.length % 4) s += '=';
  const decoded = atob(s);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

// ── Registration ──
export async function startBiometricRegistration(deviceName) {
  const headers = await authHeaders();
  const begin = await fetch(`${API_BASE}/api/webauthn/register/begin`, { method: 'POST', headers });
  const beginData = await begin.json();
  if (!beginData.success) throw new Error(beginData.error || 'Could not start registration');
  const options = beginData.options;
  // Fix base64url fields for the browser
  options.challenge = base64ToUint8Array(options.challenge);
  options.user.id = base64ToUint8Array(options.user.id);
  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map(c => ({ ...c, id: base64ToUint8Array(c.id) }));
  }
  const cred = await navigator.credentials.create({ publicKey: options });
  const attestation = {
    id: cred.id,
    rawId: uint8ArrayToBase64(new Uint8Array(cred.rawId)),
    response: {
      clientDataJSON: uint8ArrayToBase64(new Uint8Array(cred.response.clientDataJSON)),
      attestationObject: uint8ArrayToBase64(new Uint8Array(cred.response.attestationObject)),
    },
    type: cred.type,
  };
  const complete = await fetch(`${API_BASE}/api/webauthn/register/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...attestation, deviceName }),
  });
  const completeData = await complete.json();
  if (!completeData.success) throw new Error(completeData.error || 'Registration failed');
  return completeData;
}

export async function listBiometricCredentials() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/webauthn/credentials`, { headers });
  const data = await res.json();
  return data.credentials || [];
}

export async function removeBiometricCredential(id) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/webauthn/credentials/${id}`, { method: 'DELETE', headers });
  return res.json();
}

// ── Login ──
export async function biometricLoginBegin(email) {
  const res = await fetch(`${API_BASE}/api/webauthn/login/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'No biometric login available');
  const options = data.options;
  options.challenge = base64ToUint8Array(options.challenge);
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map(c => ({ ...c, id: base64ToUint8Array(c.id) }));
  }
  const cred = await navigator.credentials.get({ publicKey: options });
  const assertion = {
    id: cred.id,
    rawId: uint8ArrayToBase64(new Uint8Array(cred.rawId)),
    response: {
      clientDataJSON: uint8ArrayToBase64(new Uint8Array(cred.response.clientDataJSON)),
      authenticatorData: uint8ArrayToBase64(new Uint8Array(cred.response.authenticatorData)),
      signature: uint8ArrayToBase64(new Uint8Array(cred.response.signature)),
      userHandle: cred.response.userHandle ? uint8ArrayToBase64(new Uint8Array(cred.response.userHandle)) : undefined,
    },
    type: cred.type,
  };
  const complete = await fetch(`${API_BASE}/api/webauthn/login/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: data.userId, response: assertion }),
  });
  const completeData = await complete.json();
  if (!completeData.success) throw new Error(completeData.error || 'Biometric login failed');
  return completeData.session;
}

export function isBiometricSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}
