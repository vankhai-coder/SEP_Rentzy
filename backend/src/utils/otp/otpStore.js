// Simple in-memory OTP store with TTL
// Keyed by `${envelopeId}:${email.toLowerCase()}`
const store = new Map();

function makeKey(envelopeId, email) {
  return `${String(envelopeId)}:${String(email).toLowerCase()}`;
}

export function createOtp(envelopeId, email, ttlMs = 5 * 60 * 1000) {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const key = makeKey(envelopeId, email);
  const expiresAt = Date.now() + ttlMs;
  const entry = { code, expiresAt };
  store.set(key, entry);
  // Auto cleanup
  setTimeout(() => {
    const current = store.get(key);
    if (current && current.expiresAt <= Date.now()) {
      store.delete(key);
    }
  }, ttlMs + 1000);
  return code;
}

export function verifyOtp(envelopeId, email, code) {
  const key = makeKey(envelopeId, email);
  const entry = store.get(key);
  if (!entry) return false;
  const ok = entry.code === String(code) && Date.now() <= entry.expiresAt;
  if (ok) store.delete(key); // one-time use
  return ok;
}

export function hasOtp(envelopeId, email) {
  const key = makeKey(envelopeId, email);
  const entry = store.get(key);
  return !!entry && Date.now() <= entry.expiresAt;
}